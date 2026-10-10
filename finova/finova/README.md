# FINOVA – Goal-Based Personal Finance Planning Engine

Website theo file mô tả CODE 1 + CODE 2. Không cần cài thư viện (chỉ dùng Node.js >= 18).

## Chạy thử trên máy
    npm start          # mở http://localhost:3000

## Deploy lên Render
1. Tạo repo GitHub, đẩy toàn bộ thư mục này lên (file `render.yaml` đã có sẵn).
2. Vào https://dashboard.render.com → New → **Blueprint** (hoặc New → Web Service) → chọn repo.
3. Nếu chọn Web Service: Runtime = Node, Build Command = `npm install`, Start Command = `npm start`.
4. Bấm Deploy, chờ vài phút là có link `https://finova-xxxx.onrender.com`.

## Lưu ý
- Tài khoản lưu trong `data/users.json`. Gói Free của Render có ổ đĩa tạm: dữ liệu sẽ mất khi redeploy/khởi động lại.
  Muốn giữ lâu dài: gắn Persistent Disk (gói trả phí) rồi đặt biến môi trường `DATA_DIR` trỏ tới đường dẫn của disk,
  hoặc chuyển sang cơ sở dữ liệu (Render Postgres).
- Ảnh slideshow lấy từ Unsplash; muốn đổi ảnh, sửa mảng `IMAGES` ở đầu `public/app.js`.
