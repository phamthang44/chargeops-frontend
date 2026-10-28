# ChargeOps — Automated Product Demo Recording & Marketing Showcase

## 1. Context & Objective

Tôi muốn xây dựng một hệ thống tự động quay video demo sản phẩm ChargeOps để tích hợp vào marketing landing page và phục vụ trình bày đồ án tốt nghiệp.

ChargeOps bao gồm:
- Driver Mobile App (React Native).
- Owner Mobile App (React Native).
- Admin Web (React).
- Backend Spring Boot, Keycloak và các dịch vụ liên quan.
- Charging Simulator phục vụ mô phỏng các phiên sạc.

**Mục tiêu cuối cùng:**

Codex có thể tự động thực hiện toàn bộ workflow:

1. Phân tích source code và các chức năng hiện có.
2. Thiết kế kịch bản demo theo từng user journey.
3. Tự động mở và thao tác trên ứng dụng thật.
4. Ghi lại video các thao tác.
5. Xử lý video để đạt chất lượng trình bày tốt.
6. Tạo các React components để phát video bên trong device mockup.
7. Tích hợp video vào marketing landing page.
8. Cho phép chạy lại workflow khi UI/UX của sản phẩm thay đổi.

Không sử dụng hình ảnh giả lập hoặc dựng lại UI thay cho ứng dụng thực tế.

---

## 2. Environment Discovery

Trước khi triển khai, hãy kiểm tra:

- Cấu trúc repository và các ứng dụng hiện có.
- Framework, build system và phương thức chạy từng ứng dụng.
- Mobile app có hỗ trợ React Native Web hay không.
- Tình trạng Android Emulator và các công cụ automation.
- Khả năng sử dụng Playwright, Maestro, FFmpeg và Computer Use.
- Hệ thống đăng nhập Keycloak.
- Dữ liệu demo và khả năng reset về trạng thái ban đầu.
- Cấu trúc marketing landing page hiện tại.

Không mặc định rằng mọi công cụ đã được cài đặt hoặc mọi tính năng mobile đều chạy được trên browser.

### Recording strategy

**Admin Web:**
- Ưu tiên Playwright để thao tác và quay video.
- Có thể sử dụng browser automation và video recording.

**Driver/Owner Mobile:**
- Nếu React Native Web tương thích đầy đủ: ưu tiên Playwright và Chrome viewport.
- Nếu các chức năng phụ thuộc native APIs: ưu tiên Maestro + Android Emulator.
- Có thể cân nhắc Computer Use và FFmpeg khi cần.

Mục tiêu là tạo một recording pipeline ổn định, có khả năng tái sử dụng.

---

## 3. Mobile Viewport & Device Strategy

Tôi hiện đang sử dụng Chrome DevTools (F12) với preset iPhone 16 Pro Max để kiểm tra giao diện mobile.

Viewport tham chiếu:
- iPhone 16 Pro Max: 440 × 956 CSS pixels.
- iPhone 16: 393 × 852 CSS pixels.
- Android phổ biến: 360 × 800 CSS pixels.
- Tablet: lựa chọn viewport phù hợp với layout thực tế.

Ưu tiên quay video mobile ở tỷ lệ của iPhone 16 Pro Max.

Tuy nhiên, ứng dụng có khả năng responsive trên nhiều kích thước, bao gồm phone và tablet.

Yêu cầu:
- Không cố định toàn bộ thiết kế vào duy nhất iPhone 16 Pro Max.
- Kiểm tra responsive trên một số viewport đại diện.
- Chọn một viewport chính cho video marketing mobile.
- Nếu tablet có layout khác biệt đáng kể, đề xuất thêm video tablet.
- Không kéo giãn hoặc crop sai tỷ lệ video.
- Phân biệt viewport CSS với kích thước video output tính bằng pixel.

---

## 4. Demo Storyboard & User Journeys

Hãy phân tích những tính năng đã hoàn thành trong ChargeOps và đề xuất các kịch bản demo có giá trị trình bày cao.

Các luồng cần xem xét:

**Driver Mobile**
- Tìm kiếm trạm sạc.
- Xem thông tin trạm, charge point và connector.
- Đặt lịch sạc.
- Thanh toán trong môi trường demo.
- Check-in và mô phỏng phiên sạc.
- Xem lịch sử hoặc ticket khi phù hợp.

**Owner Mobile**
- Quản lý thông tin trạm.
- Theo dõi hoạt động và các yêu cầu hỗ trợ.
- Những chức năng Owner thực tế đã hoàn thành.

**Admin Web**
- Dashboard.
- Quản lý trạm.
- Charge Points và Connectors.
- License management.
- Các chức năng quản trị quan trọng.

Không cố quay các chức năng chưa hoàn thiện.

Mỗi kịch bản phải có:
- Trạng thái dữ liệu ban đầu.
- Các thao tác cần thực hiện.
- Điều kiện chờ hoặc xác nhận thành công.
- Thời lượng dự kiến.
- Cách khôi phục trạng thái để chạy lại.

Ưu tiên một video tổng quan sản phẩm 45–90 giây, kết hợp các đoạn demo ngắn theo từng tính năng.

---

## 5. Automated Recording Pipeline

Hãy thiết kế các automation scripts để Codex có thể:

1. Khởi động hoặc kết nối tới ứng dụng.
2. Kiểm tra các dependencies cần thiết.
3. Chuẩn bị dữ liệu demo an toàn.
4. Đăng nhập bằng tài khoản demo.
5. Tự động thao tác theo storyboard.
6. Đợi loading, transitions và animation hoàn tất.
7. Ghi lại màn hình trong quá trình thao tác.
8. Xuất video riêng cho từng user journey.
9. Kiểm tra chất lượng video đầu ra.

Yêu cầu chất lượng:
- Video rõ nét, ưu tiên 1080p hoặc độ phân giải phù hợp với tỷ lệ thiết bị.
- Thao tác mượt, dễ theo dõi.
- Không có các khoảng trống kéo dài vô nghĩa.
- Hạn chế hiển thị thông tin nhạy cảm.
- Không xuất hiện DevTools, terminal hoặc debug overlays trong video.
- Không làm thay đổi business logic chỉ để phục vụ recording.

Quan trọng: Không tự ý thực hiện thanh toán thật, tạo giao dịch ngoài môi trường demo, hoặc gây thay đổi dữ liệu production.

---

## 6. Video Processing

Sử dụng FFmpeg hoặc công cụ phù hợp để xử lý video sau khi quay.

Các khả năng cần đánh giá:
- Trim các đoạn chờ không cần thiết.
- Ghép các cảnh demo theo storyboard.
- Tạo transitions đơn giản.
- Điều chỉnh tốc độ ở các đoạn cần thiết.
- Chuẩn hóa video cho website.
- Tạo poster thumbnail.
- Xuất MP4 tương thích với browser.

Không thêm hiệu ứng quá mức hoặc che khuất giao diện.

Video cần có thể phát độc lập, không phụ thuộc vào công cụ recording.

---

## 7. React Device Mockup Components

Tạo hệ thống components tái sử dụng để giới thiệu sản phẩm trên marketing landing page.

### PhoneMockup

Thiết kế khung điện thoại hiện đại, tham khảo hình dáng iPhone 16 Pro Max.

Yêu cầu:
- Device frame dựng bằng CSS/SVG hoặc asset được cấp quyền sử dụng.
- Video phát bên trong vùng màn hình.
- Bo góc, viền và tỷ lệ hợp lý.
- Responsive theo chiều rộng container.
- Giữ nguyên tỷ lệ video.
- Hỗ trợ autoplay, muted, loop, playsInline.
- Có poster fallback và lazy loading khi phù hợp.
- Không tự động phát video có âm thanh.

### TabletMockup

Tạo component hiển thị tablet nếu có video tablet thực tế.

### BrowserMockup

Tạo component trình bày Admin Web trong một khung browser hiện đại.

Các components phải có thể thay đổi nguồn video dễ dàng mà không cần quay hoặc ghép lại device frame.

---

## 8. Marketing Landing Page Integration

Phân tích thiết kế landing page hiện tại và đề xuất cách tích hợp video demo.

Ưu tiên:

**Hero Section**
- Tiêu đề và value proposition của ChargeOps.
- Phone mockup hiển thị video demo chính.
- Animation nhẹ, cảm giác hiện đại và chuyên nghiệp.

**Product Features Section**
- Hiển thị các user journeys nổi bật.
- Mỗi feature có video demo tương ứng.
- Kết hợp phone, tablet hoặc browser mockup theo chức năng.

**Product Experience Section**
- Showcase Driver, Owner và Admin.
- Bố cục responsive.
- Không làm chậm đáng kể tốc độ tải website.

Thiết kế theo xu hướng SaaS/Product Marketing hiện đại, nhưng ưu tiên tính dễ hiểu, bố cục và chất lượng trải nghiệm hơn hiệu ứng trang trí.

---

## 9. Deliverables

Sau khi triển khai, hệ thống nên có:

- Các script tự động quay demo.
- Storyboard và cấu hình user journeys.
- Các video MP4 đầu ra.
- Video tổng hợp nếu cần.
- Poster thumbnails.
- React PhoneMockup, TabletMockup và BrowserMockup.
- Landing page sections tích hợp video.
- Tài liệu hướng dẫn chạy lại toàn bộ pipeline.

Ưu tiên cấu trúc dễ bảo trì, không lặp mã và không bổ sung dependencies không cần thiết.

---

## 10. Implementation Rules

**Giai đoạn 1 — Discovery & Planning**

Trước tiên hãy:
1. Đọc codebase thực tế.
2. Kiểm tra khả năng automation hiện tại.
3. Xác định giải pháp phù hợp cho mobile và web.
4. Đề xuất storyboard.
5. Đề xuất pipeline, thư viện, cấu trúc file và phương án tích hợp.
6. Xác định giới hạn, rủi ro và các điều kiện tiên quyết.

Chưa triển khai, chưa cài packages và chưa sửa source code ở giai đoạn này.

**Giai đoạn 2 — Proof of Concept**

Sau khi tôi phê duyệt kế hoạch:
- Chọn một luồng mobile đơn giản.
- Tự động quay một video ngắn.
- Kiểm tra chất lượng đầu ra.
- Dựng PhoneMockup và thử hiển thị video.

**Giai đoạn 3 — Full Implementation**

Khi proof of concept hoạt động ổn định:
- Mở rộng các luồng demo còn lại.
- Xử lý video.
- Tích hợp vào landing page.
- Hoàn thiện tài liệu và quy trình chạy lại.

Ưu tiên giải pháp thực tế, hoạt động ổn định hơn là một hệ thống automation phức tạp nhưng khó vận hành.