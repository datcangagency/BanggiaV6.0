# Trang dịch vụ và giỏ hàng | Đất Cảng Agency

Trang web tĩnh giới thiệu dịch vụ của Đất Cảng Agency, bảng giá **V6.1 (05/11/2026)**:

- 11 nhóm dịch vụ xếp thành các tab. Mỗi gói ghi rõ **bạn nhận được gì**, chi tiết, lưu ý và phần chưa bao gồm.
- Nhóm **Video quảng cáo** và **TVC** nhúng video YouTube tham khảo (chỉ tải khi khách bấm phát), có ghi chú "video tham khảo mức chất lượng, không phải sản phẩm cuối cùng".
- Khách chọn gói, thêm **Dịch vụ thêm**, cho vào **giỏ hàng** để xem giá tạm tính (chưa VAT, VAT 8%, tổng). Không có gói nào được chọn sẵn.
- Giỏ hàng có thể: gửi qua Zalo/email (khi điền `assets/config.js`), sao chép nội dung, sao chép **link giỏ hàng** (Sale chọn sẵn rồi gửi cho khách), in hoặc lưu PDF.
- Chạy hoàn toàn trên trình duyệt: không máy chủ riêng, không cookie, không lưu và không gửi thông tin khách nhập. Link giỏ hàng chỉ chứa mã gói.
- Giá là tạm tính theo giá niêm yết, chưa phải báo giá chính thức.

Cấu trúc: `index.html` (khung trang), `assets/app.js` (tab, giỏ hàng, video), `assets/data.js` (dữ liệu giá và nội dung, **sinh tự động**, không sửa tay), `assets/config.js` (tên, số Zalo, email, liên hệ), `assets/style.css` (giao diện), `assets/img/` (logo Đất Cảng PNG).

Cách đăng: xem `../HUONG_DAN_DANG_GITHUB.md`.

Xem thử trên máy: bấm đúp `../XEM_THU_TREN_MAY.bat` (cần Python hoặc Node.js), trang mở tại http://localhost:8080. Lưu ý: mở thẳng file `index.html` (địa chỉ file:///…) thì YouTube báo lỗi 153 và không phát video nhúng; trang chạy đúng khi mở qua http/https, tức là trên GitHub Pages hoặc qua file `.bat` trên.
