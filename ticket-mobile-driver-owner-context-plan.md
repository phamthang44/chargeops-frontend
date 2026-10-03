# Đề xuất: tách góc nhìn Driver và Owner trong ticket mobile

## Vấn đề quan sát được

Trong ảnh `TKT-20261003-0008`, tin của người báo cáo được đẩy sang phải và tô xanh như thể do người đang xem gửi, còn tin Chủ trạm nằm bên trái. Với tài khoản đang vào mobile để xem với tư cách Chủ trạm, cách trình bày này đảo ngược góc nhìn và dễ khiến người xem hiểu sai ai đã nói gì.

Đây không chỉ là lỗi màu sắc. Màn hình mobile hiện được thiết kế cho Driver: danh sách ghi “Phiếu hỗ trợ của tôi”, chi tiết có nút Driver xác nhận giải quyết/mở lại, và ô trả lời luôn tạo tin nhắn tạm với `authorKind: REPORTER`. Một tài khoản có cả quyền Driver và Owner vẫn dùng không gian Driver trên app này.

## Nguyên nhân trong code hiện tại

1. `MyTicketsScreen` gọi `GET /api/v1/tickets`; API chung cho phép tài khoản đa vai trò thấy cả ticket mình báo cáo **và** ticket thuộc trạm mình sở hữu. Vì vậy ticket của Driver khác có thể lọt vào danh sách “của tôi” trên mobile.
2. `TicketDetailScreen` truyền `isSelf={item.authorKind === 'REPORTER'}`. `TicketMessageBubble` còn dùng điều kiện `isSelf || message.authorKind === 'REPORTER'`. Bất kỳ tin `REPORTER` nào cũng bị hiển thị như tin của người đang xem, bất kể ID tác giả.
3. `TicketMessageResponse` chỉ có tên hiển thị và `authorKind`, chưa có `authorId`; client không thể so danh tính tác giả với profile hiện tại. Tên hiển thị không phải khóa định danh đáng tin cậy.
4. Các nút xác nhận đóng, mở lại, escalation và gửi tin trên màn hình Driver chưa được ràng buộc theo `ticket.reporterId === profile.id`. Nếu ticket vào được từ quyền Owner, UI vẫn gợi ý thao tác của Reporter; backend có thể từ chối muộn.

## Quyết định UX đề xuất

Tách **vai trò đang thao tác** khỏi **vai trò được cấp cho tài khoản** và khỏi **vai trò của tác giả từng tin**:

- **Không gian Driver — “Phiếu tôi đã báo”**: chỉ có ticket với `reporterId` bằng profile hiện tại. Driver xem tin của chính mình bên phải; tin Owner/Staff/Admin bên trái, giữ badge vai trò. Chỉ Reporter thấy hành động xác nhận giải quyết, “Vấn đề vẫn còn”, hoặc gửi escalation theo quy tắc nghiệp vụ.
- **Không gian Owner — “Yêu cầu tại trạm của tôi”**: chỉ có ticket thuộc trạm mình sở hữu, lấy qua `/api/v1/owner/tickets/*`. Ở đây tin của chính Owner nằm bên phải; tin Driver/Staff/Admin nằm bên trái và hiện tên cùng badge. Header thể hiện tên người báo cáo, trạm, mã ticket và người xử lý. Hành động là nhận/gán ticket, trao đổi với tư cách Owner, ghi kết luận và giải quyết khi đủ quyền/trạng thái; không hiện nút dành riêng cho Reporter.
- Nếu tài khoản có cả hai quyền, hiển thị hai điểm vào hoặc bộ chuyển không gian có nhãn rõ ràng. Không tự đổi ngữ cảnh chỉ vì ticket có `reporterId` trùng tài khoản. Nếu cùng người vừa là Reporter vừa là Owner của ticket, không gian được chọn quyết định endpoint và bộ hành động; danh tính của từng tin vẫn dựa vào `authorId`.

## Hướng triển khai

### 1. Chặn hiểu nhầm ngay ở luồng Driver

- Backend cung cấp danh sách/chi tiết ticket **theo Reporter** dành cho mobile Driver, hoặc một scope server kiểm tra `reporter_id = currentProfile.id`. Không lọc sau khi phân trang ở client vì sẽ sai tổng số/trang và vẫn tải nhầm dữ liệu. `GET /api/v1/tickets` chung tiếp tục phục vụ các use case hiện có nếu còn cần.
- Mobile Driver dùng scope này cho `MyTicketsScreen` và `TicketDetailScreen`. Khi mở trực tiếp ticket không do mình báo cáo, trả về trạng thái không có quyền trong không gian Driver và hướng người dùng sang không gian Owner nếu họ có quyền.
- Trong thời gian chưa có Owner mobile, không hiển thị ticket Owner trong “Phiếu tôi đã báo”; thông báo ngắn rằng xử lý ticket trạm hiện ở Owner Console. Đây là bước an toàn trước khi xây đủ luồng Owner mobile.

### 2. Nhận diện chính xác từng người gửi

- Thêm `authorId` vào `TicketMessageResponse` và model mobile, giữ `authorKind` để mô tả vai trò **khi tin được gửi**.
- `isSelf = message.authorId === profile.id`; không suy từ `authorKind`, tên hiển thị, màu bong bóng hoặc vị trí. Tin của người khác luôn hiện tên và badge, kể cả `REPORTER`.
- Với tin cũ/response chưa có `authorId`, hiển thị kiểu trung tính có tên + badge, không tự nhận là “của tôi”. API mới cần trả ID cho cả lịch sử tin đã lưu.
- Tin tạm khi gửi lấy đúng `authorId` và `authorKind` của ngữ cảnh hiện tại; sau phản hồi server thì thay bằng bản ghi server. Không mặc định `REPORTER` trong không gian Owner.

### 3. Xây không gian Owner mobile riêng

- Chỉ hiện điểm vào nếu session có quyền Owner; dùng endpoint `/api/v1/owner/tickets/*` và quyền server tương ứng cho list/detail/reply/action.
- Thiết kế màn hình danh sách, chi tiết và chat Owner với nhãn “Yêu cầu tại trạm”, thông tin Reporter và handler rõ ràng. Dùng lại component hiển thị tin nhắn sau khi sửa nhận diện `isSelf`.
- Map hành động theo trạng thái, escalation và handler hiện hành; ẩn hoặc vô hiệu hóa action không hợp lệ ở UI, để backend là chốt quyền cuối cùng.
- Khi chuyển giữa hai không gian, đặt lại cache/query key và điều hướng về danh sách đúng ngữ cảnh để không hiển thị dữ liệu cũ.

## Tiêu chí nghiệm thu

1. Owner A mở ticket do Driver B báo: tin B ở bên trái với nhãn “Người báo cáo” và tên B; tin A ở bên phải với nhãn “Bạn · Chủ trạm” hoặc nhận diện tương đương.
2. Cùng tài khoản có Driver + Owner: “Phiếu tôi đã báo” chỉ liệt kê ticket người đó tạo; “Yêu cầu tại trạm” chỉ liệt kê ticket thuộc trạm của người đó. Tổng số và phân trang đều đúng.
3. Tin Staff/Admin/người báo cáo khác không bao giờ hiện như tin của người đang xem. Tin cũ thiếu `authorId` không bị nhận nhầm là tin của mình.
4. Nút “Đồng ý, đã giải quyết” và “Vấn đề vẫn còn” chỉ xuất hiện cho Reporter hợp lệ trong không gian Driver. Owner dùng action Owner, có lỗi quyền/trạng thái rõ ràng khi dữ liệu thay đổi.
5. Kiểm tra tài khoản chỉ Driver, chỉ Owner, đa vai trò; ticket trạm khác, ticket nền tảng, ticket tự báo tại trạm mình sở hữu; polling và tin tạm sau khi gửi.

## Phạm vi tài liệu này

Đây là đề xuất trước khi sửa code. Chưa thay đổi API, quyền truy cập, giao diện hay dữ liệu ticket. Khi triển khai cần đối chiếu thêm response detail Owner hiện tại và hợp đồng quyền backend để tránh mang hành động của Driver sang không gian Owner.
