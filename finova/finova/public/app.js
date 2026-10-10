/* FINOVA – giao diện SPA thuần JavaScript */
const IMAGES = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=70'
];

const $app = document.getElementById('app');
const $modal = document.getElementById('modal-root');
let user = null;
let sliderTimer = null;
let sideCollapsed = window.innerWidth < 860;
let activeTab = 'overview';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMoney = n => Math.round(n).toLocaleString('vi-VN') + ' ₫';
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

async function api(url, body) {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra.');
  return data;
}

/* ---------- Router ---------- */
function route() {
  clearInterval(sliderTimer);
  const h = location.hash.replace('#', '') || '/';
  if (user) {
    if (h === '/login' || h === '/register' || h === '/forgot') return go('/');
    return renderLoggedIn();
  }
  if (h === '/register') return renderRegister();
  if (h === '/login') return renderLogin();
  if (h === '/forgot') return renderForgot();
  renderGuest();
}
function go(path) { location.hash = path; }
window.addEventListener('hashchange', route);

/* ---------- Header ---------- */
const USER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>';

function headerHTML() {
  const menu = user
    ? `<div class="dropdown-inner">
         <div class="dropdown-name">${esc(user.name)}<small>${esc(user.email)}</small></div>
         <button data-act="logout">Đăng xuất</button>
       </div>`
    : `<div class="dropdown-inner">
         <button data-act="register">Đăng ký</button>
         <button data-act="login">Đăng nhập tài khoản</button>
       </div>`;
  return `
  <header class="header">
    <a class="brand" href="#/"><img src="/logo.png" alt="Logo FINOVA"><span>FINOVA</span></a>
    <div class="header-right">
      <button class="guide-btn" data-act="guide">Hướng dẫn</button>
      <div class="user-menu" tabindex="0">
        <button class="user-icon" aria-label="Tài khoản" data-act="toggle-menu">${USER_SVG}</button>
        <div class="dropdown">${menu}</div>
      </div>
    </div>
  </header>`;
}

function bindHeader() {
  $app.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', async e => {
      const act = el.dataset.act;
      if (act === 'guide') showGuide();
      else if (act === 'register') go('/register');
      else if (act === 'login') go('/login');
      else if (act === 'toggle-menu') el.closest('.user-menu').classList.toggle('open');
      else if (act === 'logout') {
        await api('/api/logout', {});
        user = null; activeTab = 'overview'; go('/'); route();
      }
    });
  });
}

/* ---------- Hướng dẫn ---------- */
function showGuide() {
  $modal.innerHTML = `
  <div class="modal-bg" id="mbg"><div class="modal" role="dialog" aria-modal="true">
    <button class="close" id="mclose" aria-label="Đóng">✕</button>
    <h3>Hướng dẫn đăng ký, đăng nhập và đăng xuất</h3>
    <h4>1. Đăng ký tài khoản</h4>
    <ol>
      <li>Rê chuột vào biểu tượng con người ở góc trên bên phải, chọn <b>Đăng ký</b>.</li>
      <li>Nhập tên khách hàng, email, mật khẩu (tối thiểu 6 ký tự) và nhập lại mật khẩu.</li>
      <li>Bấm nút <b>Đăng ký</b> ở giữa trang. Khi thành công, hệ thống chuyển bạn sang trang đăng nhập.</li>
    </ol>
    <h4>2. Đăng nhập</h4>
    <ol>
      <li>Rê chuột vào biểu tượng con người, chọn <b>Đăng nhập tài khoản</b>.</li>
      <li>Nhập email và mật khẩu rồi bấm <b>Đăng nhập</b>. Trang chủ chính sẽ hiện ra.</li>
      <li>Quên mật khẩu? Bấm <b>Quên mật khẩu</b>, nhập email để xác nhận, sau đó nhập mật khẩu mới.</li>
    </ol>
    <h4>3. Đăng xuất</h4>
    <ol>
      <li>Bấm vào biểu tượng con người ở góc trên bên phải (tên của bạn sẽ hiện ra).</li>
      <li>Chọn <b>Đăng xuất</b> để thoát khỏi tài khoản.</li>
    </ol>
  </div></div>`;
  const close = () => { $modal.innerHTML = ''; };
  document.getElementById('mclose').onclick = close;
  document.getElementById('mbg').onclick = e => { if (e.target.id === 'mbg') close(); };
}

/* ---------- Nội dung dùng chung ---------- */
const DISCLAIMER_SHORT = `<div class="disclaimer"><h4>⚖️ Disclaimer</h4>
<p>FINOVA is a financial planning support platform designed strictly for educational and informational purposes. All calculation models and scenario projections rely entirely on user-provided data and underlying assumptions. They serve as estimated benchmarks, not guaranteed financial outcomes or personalized investment advice. FINOVA does not offer guaranteed yields or recommend specific securities.</p></div>`;

const DISCLAIMER_FULL = `<div class="disclaimer"><h4>⚖️ DISCLAIMER &amp; SAFETY NOTICE</h4>
<p>FINOVA is a financial planning support platform designed strictly for educational and informational purposes. All calculations, projection charts, and scenario outcomes depend entirely on user-provided information and stated financial assumptions.</p>
<p>Results generated by FINOVA are mathematical estimates and decision-support tools, not guarantees of future financial outcomes, certified financial audits, or personalized investment advice. FINOVA does not promise or guarantee investment yields, nor does it recommend purchasing or selling specific financial products, securities, or assets.</p></div>`;

const FOOTER = `<footer class="footer">© ${new Date().getFullYear()} FINOVA – Goal-Based Personal Finance Planning Engine</footer>`;

/* ---------- CODE 1: Trang khách ---------- */
function renderGuest() {
  $app.className = '';
  $app.innerHTML = `${headerHTML()}
  <div class="page">
    <section class="hero-guest" style="--bg:url('${IMAGES[0]}')">
      <div class="inner">
        <span class="engine">GOAL-BASED PERSONAL FINANCE PLANNING ENGINE</span>
        <h1 class="hero-title">FINOVA — Plan Smarter.<br>Achieve Your Goals.</h1>
        <p class="hero-sub">Your Financial Goals. Your Plan. Your Future.</p>
        <div class="cta-row">
          <button class="btn btn-primary" onclick="location.hash='/register'">Bắt đầu miễn phí</button>
          <button class="btn btn-secondary" onclick="location.hash='/login'">Đăng nhập</button>
        </div>
      </div>
    </section>

    <section class="section narrative">
      <h2>Giới thiệu về FINOVA</h2>
      <p class="lead">Plan with clarity. Explore your scenarios.</p>
      <div class="intro-box">
        <p>FINOVA is an intelligent personal finance planning platform that transforms complex financial ambitions into clear, actionable roadmaps.</p>
        <p>By seamlessly integrating AI-driven goal parsing with a deterministic financial calculation engine, FINOVA helps you evaluate your financial health, model multi-scenario cash flows, and stress-test your strategy against real-world changes in income, savings rates, and market assumptions.</p>
        <p class="tagline">Plan with clarity. Explore your scenarios. Take total control of your financial future.</p>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <h2>What can FINOVA do for you?</h2>
      <p class="lead">Four core capabilities</p>
      <div class="grid2">
        <div class="card"><div class="icon">🧠</div><h3>Intelligent Profile &amp; Goal Parsing</h3>
          <p>Instantly structure your financial profile—income, expenses, assets, liabilities, time horizon, and risk tolerance—from natural language while automatically highlighting missing details.</p></div>
        <div class="card"><div class="icon">📈</div><h3>Multi-Scenario Cash Flow Modeling</h3>
          <p>Compare three distinct financial trajectories (Baseline, Conservative, and Optimistic) powered by precise mathematical calculation models rather than unpredictable AI guesses.</p></div>
        <div class="card"><div class="icon">🎛️</div><h3>Real-Time "What-If" &amp; Stress Testing</h3>
          <p>Interactively adjust savings rates, target deadlines, or simulate economic shocks (such as a sudden income drop or expense surge) to evaluate your financial resilience in real time.</p></div>
        <div class="card"><div class="icon">💡</div><h3>AI Trade-Off &amp; Risk Insights</h3>
          <p>Receive clear, objective AI explanations detailing potential trade-offs, risk limits, and opportunity costs across scenarios—helping you make confident, well-informed decisions.</p></div>
      </div>
    </section>
    ${DISCLAIMER_SHORT}
    ${FOOTER}
  </div>`;
  bindHeader();
}

/* ---------- Đăng ký ---------- */
function renderRegister() {
  $app.className = '';
  $app.innerHTML = `${headerHTML()}
  <div class="page"><div class="auth-wrap"><form class="auth-card" id="f" novalidate>
    <img class="logo-top" src="/logo.png" alt="">
    <h2>Đăng ký tài khoản</h2>
    <div id="msg"></div>
    <div class="field"><label>Tên khách hàng</label><input name="name" autocomplete="name" placeholder="Nguyễn Văn A" required></div>
    <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" placeholder="ban@email.com" required></div>
    <div class="field"><label>Mật khẩu</label><input name="password" type="password" autocomplete="new-password" placeholder="Tối thiểu 6 ký tự" required></div>
    <div class="field"><label>Nhập lại mật khẩu</label><input name="confirm" type="password" autocomplete="new-password" required></div>
    <div class="center"><button class="btn btn-primary" type="submit">Đăng ký</button></div>
    <p class="link-row">Đã có tài khoản? <a href="#/login">Đăng nhập</a></p>
  </form></div></div>`;
  bindHeader();
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      await api('/api/register', d);
      store.set('finova_flash', 'Đăng ký thành công! Hãy đăng nhập.');
      go('/login');
    } catch (err) { document.getElementById('msg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
  };
}

/* ---------- Đăng nhập ---------- */
function renderLogin() {
  const flash = store.get('finova_flash', '');
  store.set('finova_flash', '');
  $app.className = '';
  $app.innerHTML = `${headerHTML()}
  <div class="page"><div class="auth-wrap"><form class="auth-card" id="f" novalidate>
    <img class="logo-top" src="/logo.png" alt="">
    <h2>Đăng nhập</h2>
    <div id="msg">${flash ? `<div class="msg ok">${esc(flash)}</div>` : ''}</div>
    <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label>Mật khẩu</label><input name="password" type="password" autocomplete="current-password" required></div>
    <p style="text-align:right;margin:-4px 0 12px"><a class="link-btn" href="#/forgot">Quên mật khẩu?</a></p>
    <div class="center"><button class="btn btn-primary" type="submit">Đăng nhập</button></div>
    <p class="link-row">Chưa có tài khoản? <a href="#/register">Đăng ký</a></p>
  </form></div></div>`;
  bindHeader();
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    try {
      const r = await api('/api/login', Object.fromEntries(new FormData(e.target)));
      user = r.user; activeTab = 'overview'; go('/'); route();
    } catch (err) { document.getElementById('msg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
  };
}

/* ---------- Quên mật khẩu (2 bước) ---------- */
function renderForgot() {
  let email = '';
  $app.className = '';
  $app.innerHTML = `${headerHTML()}
  <div class="page"><div class="auth-wrap"><form class="auth-card" id="f" novalidate></form></div></div>`;
  bindHeader();
  const f = document.getElementById('f');

  const step1 = () => {
    f.innerHTML = `<img class="logo-top" src="/logo.png" alt=""><h2>Quên mật khẩu</h2><div id="msg"></div>
      <p style="color:var(--muted);margin-bottom:14px;font-size:.93rem">Nhập email đã đăng ký để xác nhận tài khoản.</p>
      <div class="field"><label>Email</label><input name="email" type="email" required></div>
      <div class="center"><button class="btn btn-primary" type="submit">Xác nhận email</button></div>
      <p class="link-row"><a href="#/login">← Quay lại đăng nhập</a></p>`;
    f.onsubmit = async e => {
      e.preventDefault();
      email = new FormData(f).get('email');
      try { await api('/api/forgot/check', { email }); step2(); }
      catch (err) { document.getElementById('msg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
    };
  };
  const step2 = () => {
    f.innerHTML = `<img class="logo-top" src="/logo.png" alt=""><h2>Đặt mật khẩu mới</h2><div id="msg"><div class="msg ok">Đã xác nhận email: ${esc(email)}</div></div>
      <div class="field"><label>Mật khẩu mới</label><input name="password" type="password" autocomplete="new-password" required></div>
      <div class="field"><label>Nhập lại mật khẩu mới</label><input name="confirm" type="password" autocomplete="new-password" required></div>
      <div class="center"><button class="btn btn-primary" type="submit">Đổi mật khẩu</button></div>`;
    f.onsubmit = async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      try {
        await api('/api/forgot/reset', { email, ...d });
        store.set('finova_flash', 'Đổi mật khẩu thành công! Hãy đăng nhập lại.');
        go('/login');
      } catch (err) { document.getElementById('msg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
    };
  };
  step1();
}

/* ---------- CODE 2: Sau đăng nhập ---------- */
const TABS = [
  { id: 'overview', icon: '🏠', label: 'Tổng quan' },
  { id: 'account', icon: '👤', label: 'Tài khoản khách hàng' },
  { id: 'finance', icon: '💼', label: 'Thông tin tài chính của khách hàng' },
  { id: 'invest', icon: '💰', label: 'Tiết kiệm và đầu tư' },
  { id: 'review', icon: '⭐', label: 'Đánh giá' },
  { id: 'support', icon: '☎️', label: 'Liên hệ và hỗ trợ' }
];

function renderLoggedIn() {
  $app.className = 'with-sidebar' + (sideCollapsed ? ' collapsed' : '');
  $app.innerHTML = `${headerHTML()}
  <aside class="sidebar">${TABS.map(t => `<button class="${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}"><span class="ico">${t.icon}</span>${t.label}</button>`).join('')}</aside>
  <button class="side-toggle" id="stog" aria-label="Đóng/mở thanh công cụ">${sideCollapsed ? '❯' : '❮'}</button>
  <main class="page main" id="main"></main>`;
  bindHeader();
  document.getElementById('stog').onclick = () => {
    sideCollapsed = !sideCollapsed;
    $app.classList.toggle('collapsed', sideCollapsed);
    document.getElementById('stog').textContent = sideCollapsed ? '❯' : '❮';
  };
  $app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    activeTab = b.dataset.tab;
    if (window.innerWidth < 860) sideCollapsed = true;
    renderLoggedIn(); window.scrollTo(0, 0);
  });
  const main = document.getElementById('main');
  ({ overview: viewOverview, account: viewAccount, finance: viewFinance, invest: viewInvest, review: viewReview, support: viewSupport })[activeTab](main);
}

/* --- Tổng quan --- */
function viewOverview(el) {
  el.innerHTML = `
  <section class="slider" id="slider">
    ${IMAGES.map((u, i) => `<div class="slide ${i === 0 ? 'on' : ''}" style="background-image:url('${u}')"></div>`).join('')}
    <div class="slider-text"><div><h1>GOAL-BASED PERSONAL FINANCE PLANNING ENGINE</h1><p>Xin chào, ${esc(user.name)}!</p></div></div>
    <div class="dots">${IMAGES.map((_, i) => `<span class="${i === 0 ? 'on' : ''}" data-i="${i}"></span>`).join('')}</div>
  </section>

  <section class="section narrative">
    <h2 class="title-grad">FINOVA — Plan Smarter. Achieve Your Goals.</h2>
    <p class="lead">Your Financial Goals. Your Plan. Your Future.</p>
    <div class="intro-box">
      <p>FINOVA is an intelligent personal finance planning platform designed to help individuals understand their current financial health and transform ambitious financial goals into realistic, actionable roadmaps.</p>
      <p>By seamlessly combining Artificial Intelligence (AI) with a deterministic financial calculation engine, FINOVA analyzes your income, expenses, savings, assets, and liabilities. The platform evaluates your overall financial capacity, detects missing data, and rigorously assesses the feasibility of your long-term goals—such as buying a home, funding education, or preparing for retirement.</p>
      <p>Through dynamic multi-scenario modeling, interactive what-if analysis, and financial stress testing, FINOVA empowers you to explore how real-world changes—in income, savings rates, inflation, or unexpected expenses—impact your financial timeline.</p>
      <p>Beyond numbers, FINOVA leverages AI to provide clear, objective explanations of financial trade-offs, potential risks, and alternative strategies—enabling you to make confident, well-informed decisions.</p>
      <p class="tagline">Plan with clarity. Explore your options. Build your financial future with FINOVA.</p>
      <div class="cta-row">
        <button class="btn btn-primary" id="b-start">🚀 Start Planning Your Goals</button>
        <button class="btn btn-secondary" id="b-demo">📊 Try Demo Scenario</button>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <h2>What Can FINOVA Do for You?</h2><p class="lead">Core features</p>
    <div class="grid2">
      ${featureCard('01', '🔍', 'Intelligent Financial Analysis', 'Smart Data Parsing & Financial Health Check',
        'Organize your raw financial information effortlessly. FINOVA extracts and structures your income, expenses, cash flow, assets, and liabilities from natural language inputs or user profiles. Before running calculations, the system automatically identifies missing or conflicting data, ensuring your financial baseline is complete and accurate.',
        ['Automated Profile & Goal Normalization', 'Missing Data & Constraint Detection (Guardrails)', 'Comprehensive Monthly Cash-Flow Assessment'])}
      ${featureCard('02', '📊', 'Multi-Scenario Planning', 'Simulate 3 Distinct Financial Trajectories',
        'Never rely on a single optimistic projection. FINOVA generates and compares three mathematical scenarios simultaneously: Conservative, Baseline, and Optimistic. Powered by exact calculation algorithms rather than AI estimation, you can visualize precise timelines for reaching your target goals under varying financial conditions.',
        ['3-Pathway Wealth Projection Charts', 'Deterministic Mathematical Cash-Flow Engine', 'Clear Goal Feasibility Timelines'])}
      ${featureCard('03', '🎚️', 'What-If Analysis & Stress Testing', 'Interactive Modeling & Risk Resilience Check',
        "Take full control of your assumptions. Use interactive sliders to adjust savings rates, target deadlines, or expected yields in real time and see immediate live updates to your goal progress. Activate Financial Stress Testing to simulate economic shocks—such as a 20% income reduction or unexpected expense surges—to measure your portfolio's true resilience.",
        ['Real-Time Parameter Sliders (Savings, Timeline, Returns)', 'One-Click Income & Expense Shock Simulations', 'Instant Visual Feasibility Adjustments'])}
      ${featureCard('04', '🤖', 'AI-Powered Financial Insights', 'Objective Trade-off Explanations & Risk Guidance',
        "Understand the logic behind the numbers. FINOVA’s AI acts as an objective advisor, explaining the trade-offs between different choices (e.g., reaching a goal 2 years earlier vs. increasing monthly savings). It highlights key risk factors, financial bottlenecks, and strategy alternatives without making deceptive promises or selling financial products.",
        ['Plain-Language Trade-Off Explanations', 'Transparent Assumption Auditing', 'Zero Hallucination & Objective Educational Focus'])}
    </div>
  </section>

  <section class="section" id="demo-sec" style="padding-top:0">
    <h2>Interactive Demo</h2><p class="lead">Kéo thanh trượt để xem mô phỏng 3 kịch bản ngay trên trang chủ</p>
    <div id="demo"></div>
  </section>
  ${DISCLAIMER_FULL}
  ${FOOTER}`;

  // slideshow: 5 ảnh, đổi mỗi 5 giây, lặp vòng
  const slides = [...el.querySelectorAll('.slide')], dots = [...el.querySelectorAll('.dots span')];
  let idx = 0;
  const show = i => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('on', k === idx));
    dots.forEach((d, k) => d.classList.toggle('on', k === idx));
  };
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => show(idx + 1), 5000);
  dots.forEach(d => d.onclick = () => { show(+d.dataset.i); clearInterval(sliderTimer); sliderTimer = setInterval(() => show(idx + 1), 5000); });

  document.getElementById('b-start').onclick = () => { activeTab = 'finance'; renderLoggedIn(); window.scrollTo(0, 0); };
  document.getElementById('b-demo').onclick = () => document.getElementById('demo-sec').scrollIntoView({ behavior: 'smooth' });
  mountDemo(document.getElementById('demo'), { savings: 5000000, years: 10, ret: 6, shock: null });
}

function featureCard(num, icon, title, sub, desc, bullets) {
  return `<div class="card"><div class="num">${num}</div><div class="icon">${icon}</div><h3>${title}</h3>
  <div class="subh">${sub}</div><p>${desc}</p><ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul></div>`;
}

/* --- Mô phỏng: công thức xác định (giá trị tương lai của khoản tiết kiệm hàng tháng) --- */
function fvSeries(monthly, years, annualPct) {
  const r = annualPct / 100 / 12; const pts = []; let bal = 0;
  for (let m = 0; m <= years * 12; m++) {
    if (m > 0) bal = bal * (1 + r) + monthly;
    if (m % 12 === 0) pts.push(bal);
  }
  return pts;
}

function mountDemo(el, st, opts = {}) {
  const goal = opts.goal || 0;
  el.innerHTML = `<div class="demo">
    <div>
      <div class="slider-row"><label>Tiết kiệm / tháng <b id="v-s"></b></label><input type="range" id="r-s" min="500000" max="50000000" step="500000" value="${st.savings}"></div>
      <div class="slider-row"><label>Thời hạn mục tiêu <b id="v-y"></b></label><input type="range" id="r-y" min="1" max="40" step="1" value="${st.years}"></div>
      <div class="slider-row"><label>Lợi suất kỳ vọng / năm <b id="v-r"></b></label><input type="range" id="r-r" min="0" max="15" step="0.5" value="${st.ret}"></div>
      <div class="shock">
        <button id="sh-inc">⚠️ Sốc thu nhập −20%</button>
        <button id="sh-exp">⚠️ Sốc chi phí +30%</button>
      </div>
    </div>
    <div class="chart-wrap"><div id="chart"></div>
      <div class="legend"><span><i style="background:#c0841b"></i>Conservative</span><span><i style="background:#3d9068"></i>Baseline</span><span><i style="background:#2b6fd6"></i>Optimistic</span></div>
      <div class="results" id="res"></div>
    </div></div>`;
  const $ = id => el.querySelector('#' + id);

  function update() {
    st.savings = +$('r-s').value; st.years = +$('r-y').value; st.ret = +$('r-r').value;
    let eff = st.savings;
    if (st.shock === 'inc') eff *= 0.8;       // thu nhập giảm 20% → khả năng tiết kiệm giảm 20%
    if (st.shock === 'exp') eff *= 0.7;       // chi phí tăng → khả năng tiết kiệm giảm 30%
    $('v-s').textContent = fmtMoney(st.savings); $('v-y').textContent = st.years + ' năm'; $('v-r').textContent = st.ret + '%';
    $('sh-inc').classList.toggle('on', st.shock === 'inc'); $('sh-exp').classList.toggle('on', st.shock === 'exp');
    const cons = fvSeries(eff, st.years, Math.max(0, st.ret - 3));
    const base = fvSeries(eff, st.years, st.ret);
    const opt = fvSeries(eff, st.years, st.ret + 3);
    $('chart').innerHTML = lineChart([cons, base, opt], ['#c0841b', '#3d9068', '#2b6fd6'], goal);
    const f = a => fmtMoney(a[a.length - 1]);
    $('res').innerHTML = `<div class="res">Conservative<strong>${f(cons)}</strong></div><div class="res">Baseline<strong>${f(base)}</strong></div><div class="res">Optimistic<strong>${f(opt)}</strong></div>`;
    if (opts.onChange) opts.onChange(st, { cons, base, opt, eff });
  }
  ['r-s', 'r-y', 'r-r'].forEach(id => $(id).oninput = update);
  $('sh-inc').onclick = () => { st.shock = st.shock === 'inc' ? null : 'inc'; update(); };
  $('sh-exp').onclick = () => { st.shock = st.shock === 'exp' ? null : 'exp'; update(); };
  update();
}

function lineChart(series, colors, goal) {
  const W = 640, H = 320, L = 64, R = 16, T = 16, B = 34;
  const n = series[0].length;
  let max = Math.max(...series.map(s => s[s.length - 1]), goal || 0) * 1.05 || 1;
  const x = i => L + (n > 1 ? i / (n - 1) : 0) * (W - L - R);
  const y = v => H - B - (v / max) * (H - T - B);
  const short = v => v >= 1e9 ? (v / 1e9).toFixed(1) + ' tỷ' : v >= 1e6 ? Math.round(v / 1e6) + ' tr' : Math.round(v / 1e3) + ' k';
  let g = '';
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4;
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e3ede7"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5d6f65">${short(v)}</text>`;
  }
  const step = Math.max(1, Math.ceil((n - 1) / 8));
  for (let i = 0; i < n; i += step) g += `<text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="#5d6f65">${i}</text>`;
  g += `<text x="${W - R}" y="${H - 1}" text-anchor="end" font-size="10" fill="#5d6f65">năm</text>`;
  const lines = series.map((s, k) => `<polyline fill="none" stroke="${colors[k]}" stroke-width="2.6" stroke-linejoin="round" points="${s.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}"/>`).join('');
  const goalLine = goal ? `<line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" stroke="#c0392b" stroke-dasharray="6 5"/><text x="${L + 6}" y="${y(goal) - 6}" font-size="11" fill="#c0392b">Mục tiêu ${short(goal)}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ 3 kịch bản">${g}${goalLine}${lines}</svg>`;
}

/* --- Tài khoản khách hàng --- */
function viewAccount(el) {
  el.innerHTML = `<div class="inner-page"><h2>Tài khoản khách hàng</h2><p class="lead">Thông tin tài khoản của bạn.</p>
    <div class="panel">
      <div class="kv"><span>Tên khách hàng</span><b>${esc(user.name)}</b></div>
      <div class="kv"><span>Email</span><b>${esc(user.email)}</b></div>
      <div class="kv"><span>Trạng thái</span><b>Đang hoạt động</b></div>
    </div></div>`;
}

/* --- Thông tin tài chính --- */
function viewFinance(el) {
  const key = 'finova_profile_' + user.email;
  const p = store.get(key, { income: '', expense: '', assets: '', debts: '', goal: '', goalAmount: '', horizon: '', risk: 'Trung bình' });
  el.innerHTML = `<div class="inner-page"><h2>Thông tin tài chính của khách hàng</h2>
    <p class="lead">Nhập hồ sơ tài chính (đơn vị: VNĐ). Dữ liệu được lưu trên trình duyệt của bạn.</p>
    <form class="panel" id="pf">
      <div id="msg"></div>
      <div class="form-grid">
        ${fld('income', 'Thu nhập hàng tháng', p.income, 'number')}
        ${fld('expense', 'Chi tiêu hàng tháng', p.expense, 'number')}
        ${fld('assets', 'Tổng tài sản', p.assets, 'number')}
        ${fld('debts', 'Tổng nợ / nghĩa vụ tài chính', p.debts, 'number')}
        ${fld('goal', 'Mục tiêu tài chính (VD: mua nhà)', p.goal, 'text')}
        ${fld('goalAmount', 'Số tiền mục tiêu', p.goalAmount, 'number')}
        ${fld('horizon', 'Thời hạn (năm)', p.horizon, 'number')}
        <div class="field"><label>Khẩu vị rủi ro</label><select name="risk">${['Thấp', 'Trung bình', 'Cao'].map(o => `<option ${o === p.risk ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
      </div>
      <button class="btn btn-primary" type="submit">Lưu và phân tích</button>
    </form>
    <div id="analysis"></div></div>`;
  const analyze = d => {
    const inc = +d.income, exp = +d.expense, miss = [];
    ['income', 'expense', 'assets', 'debts', 'goal', 'goalAmount', 'horizon'].forEach(k => { if (d[k] === '' || d[k] == null) miss.push(k); });
    const names = { income: 'thu nhập', expense: 'chi tiêu', assets: 'tài sản', debts: 'nợ', goal: 'mục tiêu', goalAmount: 'số tiền mục tiêu', horizon: 'thời hạn' };
    let html = '';
    if (miss.length) html += `<div class="msg err">Thiếu dữ liệu: ${miss.map(k => names[k]).join(', ')}.</div>`;
    if (d.income !== '' && d.expense !== '') {
      const cf = inc - exp;
      html += `<div class="panel"><h3>Đánh giá dòng tiền hàng tháng</h3><div class="stat">
        <div class="res">Dòng tiền ròng<strong>${fmtMoney(cf)}</strong></div>
        <div class="res">Tỷ lệ tiết kiệm<strong>${inc > 0 ? Math.round(cf / inc * 100) : 0}%</strong></div>
        <div class="res">Tài sản ròng<strong>${fmtMoney((+d.assets || 0) - (+d.debts || 0))}</strong></div></div>
        ${cf < 0 ? '<div class="msg err" style="margin-top:12px">Chi tiêu đang vượt thu nhập – cần điều chỉnh trước khi lập kế hoạch mục tiêu.</div>' : ''}
        ${d.goalAmount && d.horizon && cf > 0 ? `<p style="margin-top:12px;color:var(--muted)">Cần tiết kiệm khoảng <b>${fmtMoney(+d.goalAmount / (+d.horizon * 12))}</b>/tháng (chưa tính lãi) để đạt mục tiêu trong ${d.horizon} năm.</p>` : ''}
      </div>`;
    }
    document.getElementById('analysis').innerHTML = html;
  };
  document.getElementById('pf').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    store.set(key, d);
    document.getElementById('msg').innerHTML = '<div class="msg ok">Đã lưu thông tin.</div>';
    analyze(d);
  };
  if (p.income !== '' || p.expense !== '') analyze(p);
}
function fld(name, label, val, type) {
  return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" ${type === 'number' ? 'min="0"' : ''} value="${esc(val)}"></div>`;
}

/* --- Tiết kiệm và đầu tư --- */
function viewInvest(el) {
  const prof = store.get('finova_profile_' + user.email, {});
  el.innerHTML = `<div class="inner-page" style="max-width:1050px"><h2>Tiết kiệm và đầu tư</h2>
    <p class="lead">Mô phỏng 3 kịch bản và thử cú sốc thu nhập / chi phí.</p>
    <div id="demo"></div><div class="panel" id="insight" style="margin-top:20px"></div></div>`;
  const goal = +prof.goalAmount || 0;
  mountDemo(document.getElementById('demo'), { savings: 5000000, years: +prof.horizon || 10, ret: 6, shock: null }, {
    goal,
    onChange: (st, r) => {
      let t = `<h3>Nhận định</h3><p style="color:var(--muted)">Mức tiết kiệm hiệu dụng: <b>${fmtMoney(r.eff)}</b>/tháng.`;
      if (goal) {
        const hit = [['Conservative', r.cons], ['Baseline', r.base], ['Optimistic', r.opt]].map(([n, a]) => `${n}: ${a[a.length - 1] >= goal ? '✅ đạt' : '❌ chưa đạt'}`).join(' · ');
        t += ` Mục tiêu ${fmtMoney(goal)} → ${hit}.`;
      } else t += ' Nhập "Số tiền mục tiêu" ở mục Thông tin tài chính để so sánh với mục tiêu.';
      t += '</p><p style="margin-top:8px;font-size:.88rem;color:var(--muted)">Kịch bản Conservative / Optimistic lệch −3 / +3 điểm % so với lợi suất kỳ vọng. Đây là ước tính mang tính tham khảo, không phải lời khuyên đầu tư.</p>';
      document.getElementById('insight').innerHTML = t;
    }
  });
}

/* --- Đánh giá --- */
function viewReview(el) {
  const key = 'finova_review_' + user.email;
  let saved = store.get(key, { stars: 0, text: '' });
  el.innerHTML = `<div class="inner-page"><h2>Đánh giá</h2><p class="lead">Cho FINOVA biết trải nghiệm của bạn.</p>
    <form class="panel" id="rf"><div id="msg"></div>
      <div class="stars" id="stars">${[1, 2, 3, 4, 5].map(i => `<span data-i="${i}" class="${i <= saved.stars ? 'on' : ''}">★</span>`).join('')}</div>
      <div class="field" style="margin-top:14px"><label>Nhận xét</label><textarea name="text" rows="4">${esc(saved.text)}</textarea></div>
      <button class="btn btn-primary" type="submit">Gửi đánh giá</button></form></div>`;
  const stars = [...el.querySelectorAll('#stars span')];
  stars.forEach(s => s.onclick = () => { saved.stars = +s.dataset.i; stars.forEach((x, k) => x.classList.toggle('on', k < saved.stars)); });
  document.getElementById('rf').onsubmit = e => {
    e.preventDefault();
    saved.text = new FormData(e.target).get('text');
    store.set(key, saved);
    document.getElementById('msg').innerHTML = '<div class="msg ok">Cảm ơn bạn đã đánh giá!</div>';
  };
}

/* --- Liên hệ và hỗ trợ --- */
function viewSupport(el) {
  el.innerHTML = `<div class="inner-page"><h2>Liên hệ và hỗ trợ</h2><p class="lead">Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
    <div class="panel"><div class="kv"><span>Email hỗ trợ</span><b>support@finova.example</b></div>
      <div class="kv"><span>Giờ làm việc</span><b>Thứ 2 – Thứ 6, 8:00 – 17:30</b></div></div>
    <form class="panel" id="cf"><div id="msg"></div>
      <div class="field"><label>Chủ đề</label><input name="subject" required></div>
      <div class="field"><label>Nội dung</label><textarea name="body" rows="5" required></textarea></div>
      <button class="btn btn-primary" type="submit">Gửi yêu cầu</button></form></div>`;
  document.getElementById('cf').onsubmit = e => {
    e.preventDefault(); e.target.reset();
    document.getElementById('msg').innerHTML = '<div class="msg ok">Đã ghi nhận yêu cầu. Chúng tôi sẽ phản hồi sớm.</div>';
  };
}

/* ---------- Khởi động ---------- */
(async function init() {
  try { user = (await api('/api/me')).user; } catch { user = null; }
  route();
})();
