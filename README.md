# Kho hàng học kế toán

Mở `merchant_accounting_tycoon_3d.html` bằng Chrome hoặc Edge. Giữ `warehouse-progression.js` và `learning-game.js` trong cùng thư mục. Cần mạng để tải Three.js, Tailwind, biểu tượng và phông chữ.

## Chơi

- Khi vào game, ca học đang làm sẽ tự mở. Nút **Tiếp tục học / xem sổ** mở lại bài.
- Nút **Hướng dẫn chơi** ở bảng bên phải và trong bài học giải thích điều khiển, nâng/giao pallet, sổ sách, tiến trình và nâng cấp. Chọn **Tiếp tục bài đang học** để trở lại đúng bước cũ.
- Trả lời câu hỏi, xem sổ doanh nghiệp và làm theo từng bước. Số tiền ở HUD là **ngân sách nâng cấp**, không phải tiền doanh nghiệp trong bài.
- Khi đến bước vận chuyển: chọn **Về kho**, dùng WASD hoặc bấm sàn để lái. Đến gần pallet, nhấn **E** để nâng; đưa đến vòng vàng, nhấn **E** để đặt. Có nút nâng/giao hàng trên màn hình.
- Pallet nhập lấy ở khu nhận, cất ở A01. Pallet xuất lấy ở A01, giao ở khu xuất.
- Sau lượt làm quen đầu tiên, có thể xác nhận vận chuyển tự động trong bài để bỏ qua thao tác lái.
- **Esc** đóng bài. Cuộn chuột phóng to/thu nhỏ; nút la bàn đặt lại camera.
- Mỗi ca có lượt hướng dẫn, luyện tập, tự làm 1 và tự làm 2. Dùng gợi ý hoặc trả lời sai ở lượt tự làm sẽ cho luyện lại bằng số liệu mới; không trừ tiền.
- Hoàn thành hai lượt tự làm nhận $2.000 ngân sách và 100 XP, một lần cho mỗi ca. Trạm bài tập và nâng cấp mở theo tiến trình học.
- Tự lưu trên trình duyệt. Dùng cùng trình duyệt, hồ sơ và đường dẫn để tiếp tục. Bản lưu cũ giữ ngân sách/nâng cấp; lộ trình học mới bắt đầu từ ca 0.

## Phạm vi

9 ca: đọc thẻ hàng; mua hàng; bán hàng; lợi nhuận; trả lại/chiết khấu/vận chuyển; FOB/ký gửi; FIFO/bình quân di động; LCNRV; ca tổng hợp.

Tình huống mới được biên soạn theo chủ đề bài giảng. Chưa đối chiếu từng đề trong PDF chương sách và chưa coi là bản sao hay đáp án chính thức của các mã bài tập.

## Kiểm tra

Chạy bằng Node.js:

```
node check-game.cjs
node check-learning.cjs
node check-startup.cjs
```

Các kiểm tra xác nhận logic, số liệu kế toán, lưu/đọc, đường đi và khởi tạo. Kiểm tra khởi tạo dùng DOM/WebGL giả lập, không xác nhận chất lượng hình ảnh, FPS hay trải nghiệm trình duyệt thực tế.
