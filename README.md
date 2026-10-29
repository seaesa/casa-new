# Casa+ — website gạch gốm kiến trúc in 3D

Site tĩnh nhiều trang (Vite + GSAP), dựng từ file Figma "WEBSITE THƯƠNG HIỆU CASA".

| Trang | File |
|---|---|
| Trang chủ | `index.html` |
| Sơ đồ tiến trình | `tien-trinh/index.html` → `/tien-trinh/` (neo: `#cau-chuyen`, `#nghien-cuu`, `#thiet-ke`, `#san-xuat`, `#lap-dat`) |
| Casa xin chào | `gioi-thieu/index.html` → `/gioi-thieu/` |
| Dịch vụ + form liên hệ | `dich-vu/index.html` → `/dich-vu/` |
| Sản phẩm | `san-pham/index.html` → `/san-pham/` (neo: `#phu-dieu`, `#op-tuong`, `#lam-hoa-gio`, `#do-decor`, `#ran-san-ho`) |
| Tài khoản (đăng nhập / đăng ký) | `tai-khoan/index.html` → `/tai-khoan/` |

```bash
npm install
npm run dev      # chạy thử
npm run build    # xuất ra dist/ để deploy (Vercel, Netlify, hosting tĩnh)
```

- Header, menu, tìm kiếm, footer dùng chung: `src/partials/*.html` (chèn bằng `<!-- @include ten -->`).
- Ảnh/video đã tối ưu nằm trong `public/assets/`; file gốc từ Drive và Figma nằm trong `drive/` (không được deploy).
- Form liên hệ: đặt URL nhận dữ liệu (Formspree, Google Apps Script…) vào `data-endpoint` trong `dich-vu/index.html`.
  Khi để trống, nút "Gửi thông tin" mở ứng dụng email với nội dung điền sẵn gửi tới dongxuong@casa-evolution.com.
- URL sạch dạng `/slug/`: mỗi trang là một thư mục chứa `index.html`. URL cũ `/dich-vu.html`, `/dich-vu` được chuyển 301 sang `/dich-vu/`
  (dev/preview: plugin `clean-urls` trong `vite.config.js`; Vercel: `vercel.json`; Netlify/Cloudflare Pages: `public/_redirects`).
- Hero trang chủ tua video theo cuộn: video được cắt sẵn thành 120 khung WebP trong `public/assets/hero/d` (ngang, 1280×720) và `public/assets/hero/m` (dọc, 432×720); logic ở `src/js/forge.js`.
  Đổi video: cắt lại bằng `ffmpeg -i video.mp4 -vf "select='not(mod(n\,3))'" -fps_mode vfr -start_number 0 d/%03d.png` (chỉnh hệ số 3 để ra đúng 120 khung) rồi chuyển sang WebP bằng `cwebp -q 70`.
