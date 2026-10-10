// FINOVA server – chỉ dùng module có sẵn của Node.js (không cần cài thư viện)
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'finova', 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
const loadUsers = () => { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; } };
const saveUsers = users => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

/* ---------- Mật khẩu: scrypt + salt ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  return crypto.timingSafeEqual(crypto.scryptSync(pw, salt, 64), Buffer.from(hash, 'hex'));
}

/* ---------- Session (cookie HttpOnly) ---------- */
const sessions = new Map(); // token -> email
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function currentUser(req) {
  const email = sessions.get(parseCookies(req).sid);
  return email ? loadUsers().find(u => u.email === email) || null : null;
}
const secureFlag = () => (process.env.NODE_ENV === 'production' || process.env.RENDER ? '; Secure' : '');

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = e => String(e || '').trim().toLowerCase();

/* ---------- Tiện ích HTTP ---------- */
function send(res, status, obj, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 50_000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

/* ---------- API ---------- */
const routes = {
  'GET /api/health': (req, res) => send(res, 200, { ok: true }),

  'GET /api/me': (req, res) => {
    const u = currentUser(req);
    send(res, 200, { user: u ? { name: u.name, email: u.email } : null });
  },

  'POST /api/register': (req, res, b) => {
    const name = String(b.name || '').trim();
    const email = norm(b.email);
    if (!name) return send(res, 400, { error: 'Vui lòng nhập tên khách hàng.' });
    if (!emailRe.test(email)) return send(res, 400, { error: 'Email không hợp lệ.' });
    if (!b.password || String(b.password).length < 6) return send(res, 400, { error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    if (b.password !== b.confirm) return send(res, 400, { error: 'Mật khẩu nhập lại không khớp.' });
    const users = loadUsers();
    if (users.some(u => u.email === email)) return send(res, 409, { error: 'Email này đã được đăng ký.' });
    users.push({ name: name.slice(0, 80), email, password: hashPassword(String(b.password)), createdAt: new Date().toISOString() });
    saveUsers(users);
    send(res, 200, { ok: true });
  },

  'POST /api/login': (req, res, b) => {
    const user = loadUsers().find(u => u.email === norm(b.email));
    if (!user || !verifyPassword(String(b.password || ''), user.password)) {
      return send(res, 401, { error: 'Email hoặc mật khẩu không đúng.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user.email);
    send(res, 200, { user: { name: user.name, email: user.email } },
      { 'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secureFlag()}` });
  },

  'POST /api/logout': (req, res) => {
    sessions.delete(parseCookies(req).sid);
    send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; Path=/; Max-Age=0' });
  },

  // Quên mật khẩu bước 1: xác nhận email
  'POST /api/forgot/check': (req, res, b) => {
    const email = norm(b.email);
    if (!emailRe.test(email)) return send(res, 400, { error: 'Email không hợp lệ.' });
    if (!loadUsers().some(u => u.email === email)) return send(res, 404, { error: 'Không tìm thấy tài khoản với email này.' });
    send(res, 200, { ok: true });
  },

  // Quên mật khẩu bước 2: đặt mật khẩu mới
  'POST /api/forgot/reset': (req, res, b) => {
    const email = norm(b.email);
    if (!b.password || String(b.password).length < 6) return send(res, 400, { error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    if (b.password !== b.confirm) return send(res, 400, { error: 'Mật khẩu nhập lại không khớp.' });
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return send(res, 404, { error: 'Không tìm thấy tài khoản.' });
    user.password = hashPassword(String(b.password));
    saveUsers(users);
    send(res, 200, { ok: true });
  }
};

/* ---------- File tĩnh ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  const handler = routes[`${req.method} ${pathname}`];
  if (handler) return handler(req, res, req.method === 'POST' ? await readBody(req) : {});
  if (pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, pathname);
}).listen(PORT, () => console.log(`FINOVA đang chạy tại cổng ${PORT}`));
