# Trang chủ ChargeOps: ghi chú dựng lại theo trang tham khảo

Trang tham khảo: **go-electra.com/en/** (mạng sạc nhanh ở Pháp). Bố cục, chuyển động và tương tác được dựng lại từ đầu bằng code riêng. Chữ, ảnh, logo và màu là của ChargeOps.

- Code: `components/home/*`, `lib/home/content.ts` (toàn bộ chữ vi/en), `app/home.css`.
- Ảnh/video: `public/home/`, được tạo bằng Higgsfield. Script nằm ở `media-src/`, chi phí ở `media-src/cost-log.txt`.

## Nhận diện

| | Electra | ChargeOps |
|---|---|---|
| Màu | xanh navy + vàng chanh | `hm.ink #0B2B24`, `hm.brand #10B981`, `hm.deep #0B8A62`, `hm.mint #DDF6EB`, `hm.paper #F6FAF8` |
| Chữ | grotesk hình học | Be Vietnam Pro (`--font-display`), đủ dấu tiếng Việt |
| Khung | góc trên phải bo rất lớn | `.frame-tr`: 16/64px trên mobile, 20/128px từ lg |
| CTA chính | Tải app | "Trải nghiệm Driver Web" → `driver.chargeops.online/?demo=true` |

## Thứ tự section (giữ nguyên như Electra)

1. Thanh thông báo trên cùng (đóng được, nhớ trong `sessionStorage`).
2. Header tĩnh: logo, menu thả xuống, Trợ giúp, CTA. Dưới 1280px chuyển sang CTA + nút menu toàn màn hình.
3. Hero: ảnh lớn trong khung `.frame-tr`, tiêu đề, phụ đề, nút pill.
4. Câu nói kèm minh hoạ (võng + pin).
5. Slider tính năng: 3 video, thanh tiến trình dọc (ngang trên mobile).
6. Câu nói kèm minh hoạ (ghim bản đồ).
7. Bản đồ trạm toàn khung (Leaflet), nút chọn TP.HCM / Hà Nội / Đà Nẵng, thẻ ứng dụng nổi.
8. Số liệu: trụ sạc cắt nền, các thẻ số nổi, đếm số.
9. Khối chia đôi "Một lần đặt chỗ…" (ảnh parallax).
10. Khối chia đôi "Chúng tôi là ChargeOps" (2 ảnh parallax, nút xem video).
11. Dải tối: gói License (bấm để mở 2 thẻ gói, giá mô phỏng).
12. "Trả lại cho bạn": 3 hàng minh hoạ có đường kẻ chạy.
13. Tải ứng dụng: tay cầm điện thoại, thẻ QR, 3 thẻ mint.
14. Dải tối cho chủ trạm.
15. Gallery: kéo được, mũi tên, thanh tiến trình.
16. FAQ dạng accordion (mỗi lần mở một mục).
17. Dải kỹ thuật (OCPP / Keycloak) và nút xem video.
18. Footer tối, kèm chữ "chargeops" khổng lồ.

Các phần tử cố định: widget QR (desktop, góc dưới phải), thanh ứng dụng (dưới lg, đáy màn hình), nút đổi ngôn ngữ (góc dưới trái, nằm trên thanh ứng dụng khi dưới lg), popup khuyến mãi.

## Chuyển động

| Phần tử | Kích hoạt | Thời gian | Easing |
|---|---|---|---|
| Màn chờ | khi tải trang | giữ 750ms, sau đó wipe `clip-path` lên trên | `[0.76,0,0.24,1]` |
| Ảnh hero | khi màn chờ xong | `clip-path inset` mở ra, ảnh scale từ 1.2 về 1 | `[0.16,1,0.3,1]` |
| Chữ và nút hero | khi màn chờ xong | trồi lên lần lượt, delay 0.1→0.44s | `[0.16,1,0.3,1]` |
| Reveal của section | vào khung nhìn (`whileInView`) | 0.8–0.9s, trồi 40px + hiện dần | `[0.16,1,0.3,1]` |
| Ảnh parallax | khi cuộn (`useScroll`) | ảnh cao 150%, dịch theo cuộn | tuyến tính |
| Đổi slide | nút, phím, vuốt | wipe `clip-path` 1.1s, tiêu đề tách từng ký tự | `[0.76,0,0.24,1]` |
| Thanh slide | khi đổi slide | thanh tiến trình chạy dài ra | `[0.16,1,0.3,1]` |
| Hover nút pill | hover hoặc focus | vòng icon trượt sang mép phải, chữ lùi trái, 0.4s | `cubic-bezier(0,0.55,0.45,1)` |
| Đếm số | vào khung nhìn | tăng dần từ 0 | ease-out |
| Thẻ số liệu | vào khung nhìn | nổi lên và lơ lửng | `[0.16,1,0.3,1]` |
| Đường kẻ "Trả lại cho bạn" | vào khung nhìn | `scaleX` từ 0 lên 1 | `[0.16,1,0.3,1]` |
| Chữ khổng lồ ở footer | vào khung nhìn | trồi từ dưới lên | `[0.16,1,0.3,1]` |
| Menu mobile | nút menu | wipe `clip-path`, các mục hiện so le | `[0.76,0,0.24,1]` |
| Popup khuyến mãi | 9 giây sau khi tải, mỗi phiên một lần | scale cộng hiện dần | `[0.16,1,0.3,1]` |

Khi trình duyệt bật giảm chuyển động (reduced motion), Lenis tắt và các chuyển động lớn bị bỏ qua.

## Tương tác

- Cuộn mượt bằng Lenis. Khoá cuộn khi mở menu hoặc popup, và các lớp phủ có `data-lenis-prevent`.
- Menu thả xuống mở khi hover hoặc click, đóng bằng Esc. Link neo cuộn mượt đến section.
- Slider: nút lên/xuống, phím mũi tên, vuốt. Video chỉ tải khi gần tới và chỉ phát khi đang hiện.
- Bản đồ:
  - Không zoom bằng con lăn chuột, để trang vẫn cuộn được.
  - Trên thiết bị cảm ứng, một ngón tay không kéo được bản đồ.
  - Có nút +/−, chip thành phố bay giữa các thành phố, và popup cho từng trạm.
- Gallery: kéo, mũi tên (tự tắt khi tới đầu hoặc cuối), thanh tiến trình.
- FAQ, thẻ gói License, popup video (đóng bằng Esc hoặc nút), popup khuyến mãi.
- Nút đổi ngôn ngữ: component `LanguageSwitcher` với `tone="light"`. Các trang con vẫn dùng `tone="dark"`.

## Khác với Electra, và lý do

- **Bản đồ:** ô bản đồ lấy từ OpenStreetMap, không cần API key. Ô keyless của CARTO giờ trả về hình "API key required". Màu được làm dịu bằng CSS `filter`.
- **Dữ liệu trạm:** lấy từ dữ liệu mẫu `components/stations.ts`, không gọi API. `api.chargeops.online` hiện không truy cập được, và gọi nó sẽ sinh lỗi console. Bản đồ có nhãn "Dữ liệu minh hoạ".
- **App:** Electra có app thật trên store. ChargeOps chỉ có Driver Web, nên mọi nút tải app đều dẫn tới bản dùng thử web. Footer ghi "iOS & Android sắp ra mắt".
- **Giá License** là giá mô phỏng cho đồ án và được ghi rõ trên trang.
- **Ảnh và video do AI tạo.** Footer có ghi chú điều này.

## Chưa làm

- Các trang con (`/tram-sac`, `/tram-sac/[slug]`, `/dieu-khoan`, `/chinh-sach-bao-mat`) vẫn dùng giao diện tối cũ, chưa đồng bộ với trang chủ mới.
