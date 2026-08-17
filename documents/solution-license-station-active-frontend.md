Viewed solution-license-station-active.md:1-210
Searched for "RenewLicenseModal"
Listed directory src
Listed directory pages
Listed directory pages
Viewed Stations.tsx:1-70
Viewed StationCard.tsx:1-150
Viewed Licenses.tsx:1-544
Viewed Approvals.tsx:1-421
Searched for "DriverNotice"
Listed directory packages
Viewed types.ts:1-150
Viewed types.ts:200-350
Viewed types.ts:490-620
Viewed types.ts:620-709
Viewed License.tsx:1-408

Sau khi rà soát kỹ lưỡng tài liệu **[solution-license-station-active.md](file:///d:/Desktop/Workspace/final-year-project/chargeops-backend/chargeops/docs/solution-license-station-active.md)**, dưới đây là **phân tích đánh giá hệ thống** và **toàn bộ giải pháp thiết kế UI/UX & kiến trúc Frontend** tương ứng cho 3 nhóm đối tượng người dùng (**Chủ trạm - Owner**, **Quản trị viên - Admin**, và **Tài xế - Driver**).

---

# I. Rà soát & Đánh giá Tài liệu Backend Policy

Tài liệu đã chốt được một quyết định kiến trúc quan trọng: **Tách biệt hoàn toàn (Decouple)** giữa vòng đời của Trạm sạc (`Station.status`) và Giấy phép kinh doanh (`License.status`), thay vì cố gắng đồng bộ 2 chiều (vốn gây race condition, deadlock và sai lệch dữ liệu).

### 4 điểm mấu chốt Frontend cần nắm bắt:
1. **Khái niệm "Driver Eligibility" (Tính khả dụng cho tài xế) là trạng thái tính toán động (`computed`)**: Không có status `INACTIVE` hay `ELIGIBLE` lưu cứng trong DB. Frontend cần tính toán hoặc nhận biết dựa trên điều kiện:  
   $$\text{DriverEligible} = (\text{Station.status} == \text{ACTIVE}) \land (\text{License is Effectively Active})$$
2. **Trạng thái hợp lệ nhưng dễ gây hiểu lầm**: `Station = ACTIVE` + `License = SUSPENDED / EXPIRED`. Trạm vẫn là một trạm hợp pháp đã được duyệt trên hệ thống, chủ trạm vẫn vào xem/chỉnh sửa được, nhưng **không hiển thị cho tài xế tìm kiếm & không nhận đặt chỗ mới**.
3. **Bảo toàn giao dịch cũ (Zero Driver Penalty)**: Trạm bị mất license chỉ chặn **đơn mới**. Các booking đã thanh toán trước đó hoặc phiên sạc đang cắm dây vẫn tiếp tục hoạt động bình thường cho tới khi kết thúc.
4. **Optimistic Locking & Concurrency (HTTP 409)**: Thao tác cập nhật License có phiên bản (`version`), nếu 2 Admin cùng thao tác hoặc cấp trùng sẽ trả về lỗi xung đột `409 Conflict`.

---

# II. Ma trận Trải nghiệm Người dùng (UX Mental Model)

Để tránh việc Chủ trạm hoặc Admin bị bối rối ("Tại sao trạm của tôi đang `ACTIVE` mà tài xế lại bảo không tìm thấy trạm?"), Frontend cần chuẩn hóa **Mô hình Trạng thái 3 Lớp (3-Layer Status Model)** trên giao diện:

| Tầng trạng thái | Ý nghĩa | Hiển thị trên UI |
| :--- | :--- | :--- |
| **1. Trạng thái Trạm (`Station.status`)** | Hồ sơ kiểm duyệt & trạng thái vật lý | `Chờ duyệt`, `Hoạt động`, `Tạm ngưng`, `Từ chối` |
| **2. Giấy phép (`License.status`)** | Quyền thu tiền & kinh doanh nền tảng | `Còn hạn (Gói Năm/Tháng)`, `Sắp hết hạn`, `Hết hạn`, `Tạm ngưng` |
| **3. Trạng thái đón khách (`Driver Eligibility`)** | Trạm có nhận đơn mới & lên bản đồ không | 🟢 **Đang nhận khách** / 🟡 **Tạm ẩn tìm kiếm** / ⚪ **Chưa mở** |

---

# III. Giải pháp Thiết kế UI/UX Chi tiết theo từng Phân hệ

---

## 1. Phân hệ Chủ trạm (Station Owner Portal)

### Vấn đề UX cần giải quyết:
Chủ trạm nhìn thấy trạm `ACTIVE` nhưng không có lượt đặt chỗ vì License đã hết hạn mà không biết lý do; hoặc lo lắng trạm bị xóa khi License hết hạn.

### Giải pháp thiết kế:

#### A. Thẻ trạm (Station Card & Station Header) - Trạng thái Kép
* **Badge hiển thị kép**: 
  - Bên trái: Huy hiệu trạng thái trạm (`Hoạt động`).
  - Bên cạnh: Huy hiệu khả dụng tài xế:
    - 🟢 **Đang hiển thị trên App** (Station ACTIVE + License Usable).
    - 🟡 **Tạm ẩn khỏi tìm kiếm** (Station ACTIVE + License EXPIRED/SUSPENDED).
* **Cảnh báo hành động (Actionable Callout Banner)** ngay trong thẻ trạm khi License gặp vấn đề:
  > ⚠️ **Trạm đang bị ẩn khỏi bản đồ tài xế** do gói Giấy phép (License) đã hết hạn vào ngày 15/08/2026. Các phiên sạc đang diễn ra vẫn hoàn tất bình thường. Vui lòng [Liên hệ Quản trị viên gia hạn] để tiếp tục đón khách.
* **Cảnh báo sớm đếm ngược (Early Warning)**:
  - Khi `daysLeft <= 30`: Badge màu vàng cam `License còn 12 ngày`.
  - Khi `daysLeft <= 7`: Banner cảnh báo mức độ cao kèm hotline/kênh hỗ trợ gia hạn off-platform.

#### B. Trang Chi tiết Giấy phép (`/owner/license`)
* **Thống kê rõ ràng**:
  - Gói hiện tại, ngày bắt đầu $\rightarrow$ ngày kết thúc.
  - Số ngày còn lại (Days Left) với thanh tiến trình trực quan.
* **Thông điệp minh bạch về việc hoàn tất phiên cũ**:
  - Ghi rõ điều khoản: *"Khi License hết hạn, các lịch hẹn tài xế đã đặt trước đó vẫn được giữ nguyên và bảo đảm hoàn thành. Trạm chỉ tạm ngừng nhận các lượt đặt chỗ mới."*

---

## 2. Phân hệ Quản trị viên (Platform Admin Portal)

### Vấn đề UX cần giải quyết:
1. Đảm bảo quy tắc: **Chỉ được Approve trạm khi trạm đã có License có hiệu lực**.
2. Xử lý đồng thời (2 Admin cùng thao tác gây lỗi 409 Conflict).
3. Minh bạch lịch sử thay đổi trạng thái và tác nhân (`SYSTEM` scheduler vs `ADMIN`).

### Giải pháp thiết kế:

#### A. Màn hình Phê duyệt trạm (`/admin/approvals`)
* **Kiểm tra điều kiện tiên quyết (Pre-condition Gate)**:
  - Nếu trạm **Chưa có License hiệu lực**:
    - Nút `Phê duyệt trạm` bị **Disable** (hoặc chuyển thành dạng hướng dẫn).
    - Hiển thị nút chính nổi bật: **`Cấp License trước khi duyệt`** (mở `IssueLicenseModal`).
    - Banner cảnh báo: *"Trạm cần có gói License hiệu lực trước khi Quản trị viên có thể hoàn tất phê duyệt hồ sơ theo quy định."*
  - Sau khi Admin ghi nhận cấp License thành công $\rightarrow$ Nút `Phê duyệt trạm` tự động kích hoạt (Enable) với trạng thái sẵn sàng.

#### B. Quản lý License & Xử lý Xung đột Concurrency (`/admin/licenses`)
* **Xử lý xung đột Optimistic Lock (409 Conflict)**:
  - Khi Admin A và Admin B cùng mở trang và cùng bấm *Tạm ngưng* hoặc *Gia hạn*:
  - Frontend bắt mã lỗi `409 CONFLICT` $\rightarrow$ Hiển thị Modal/Toast thân thiện:
    > ℹ️ **Dữ liệu đã được cập nhật bởi quản trị viên khác**  
    > Trạng thái của gói License này vừa có thay đổi mới nhất từ hệ thống. Trang sẽ tự động tải lại dữ liệu để đảm bảo tính chính xác.
  - Tự động gọi `queryClient.invalidateQueries(['licenses'])` để làm mới bảng.
* **Lỗi trùng Active License (`ACTIVE_LICENSE_ALREADY_EXISTS`)**:
  - Khi cố gắng cấp thêm 1 License `ACTIVE` cho trạm đang có 1 License `ACTIVE` khác:
  - Hiển thị thông báo: *"Trạm này hiện đã có một License đang hoạt động. Nếu muốn thay đổi kỳ hạn, vui lòng sử dụng chức năng Gia hạn hoặc Tạm ngưng gói hiện tại."*
* **Audit Trail / Timeline Drawer**:
  - Thể hiện rõ ràng `SYSTEM` (do bộ quét tự động chuyển `EXPIRED`) hay do `Admin Name` thực hiện thao tác thủ công.

---

## 3. Phân hệ Tài xế & Đặt chỗ (Driver App & Booking Flow)

### Vấn đề UX cần giải quyết:
1. Bản đồ/tìm kiếm không được hiển thị trạm không đủ điều kiện.
2. Trường hợp tài xế mở link trạm cũ (cache/deep link) khi trạm vừa hết hạn License.
3. Tài xế đã đặt chỗ hoặc đang cắm sạc không bị hoang mang nếu trạm vừa hết hạn.

### Giải pháp thiết kế:

#### A. Tìm kiếm & Bản đồ (Discovery / Map)
* API tự động lọc bỏ trạm `driverEligible == false`.
* Nếu người dùng tìm kiếm theo tên cụ thể của một trạm không khả dụng: Trả về trạng thái *"Trạm hiện đang tạm ngưng đón khách mới. Gợi ý trạm sạc khả dụng gần nhất..."*.

#### B. Trang Chi tiết Trạm (Deep Link / Cache fallback)
* Nếu tài xế truy cập trực tiếp vào trạm có `Station ACTIVE` nhưng `License Inactive`:
  - **Banner thông báo thân thiện**: *"Trạm sạc hiện đang tạm bảo trì dịch vụ đặt chỗ mới. Vui lòng chọn trạm khác trong khu vực."*
  - **Nút "Đặt chỗ ngay" / "Bắt đầu sạc"**: Chuyển sang trạng thái `Disabled` với nhãn `Tạm ngưng nhận đặt chỗ`.
  - Hiển thị danh sách **Trạm sạc tương đương ở gần** (Nearby Alternatives).

#### C. Đối với Đơn đặt trước & Phiên sạc đang diễn ra (Existing Bookings / Charging)
* **Màn hình "Phiên sạc của tôi" / "Lịch đặt chỗ"**:
  - Giữ nguyên 100% chức năng: Quét mã QR check-in, theo dõi tiến độ sạc kW/h, thanh toán và kết thúc sạc bình thường.
  - Tag thông báo nhỏ nhẹ nhàng: *"Phiên sạc của bạn được đảm bảo phục vụ bình thường."*

#### D. Interceptor bắt lỗi khi tạo Booking (`createBooking`)
* Nếu xảy ra trường hợp sát giờ (Race Condition: Tài xế bấm Đặt chỗ đúng giây License bị tạm ngưng/hết hạn) $\rightarrow$ Backend trả lỗi từ chối:
* Frontend chuyển đổi mã lỗi thành Dialog rõ ràng:
  > **Không thể tạo đặt chỗ**  
  > Trạm sạc vừa tạm ngưng nhận thêm lịch hẹn mới. Tài khoản của bạn **chưa bị trừ tiền**.  
  > `[Tìm trạm khác gần đây]` `[Đóng]`

---

# IV. Bản đặc tả Kỹ thuật Frontend (Frontend Implementation Blueprint)

### 1. Hàm Tiện ích Kiểm tra Eligibility dùng chung (`packages/api` hoặc `shared/utils`):
```typescript
export function isStationDriverEligible(station: Station, license?: LicenseSummary | License | null): {
  isEligible: boolean;
  reason?: 'STATION_NOT_ACTIVE' | 'LICENSE_MISSING' | 'LICENSE_EXPIRED' | 'LICENSE_SUSPENDED' | 'LICENSE_NOT_STARTED';
} {
  if (station.status !== 'ACTIVE' && station.status !== 'active') {
    return { isEligible: false, reason: 'STATION_NOT_ACTIVE' };
  }
  
  if (!license) {
    return { isEligible: false, reason: 'LICENSE_MISSING' };
  }

  const now = new Date().getTime();
  const status = String(license.status).toUpperCase();

  if (status === 'SUSPENDED') return { isEligible: false, reason: 'LICENSE_SUSPENDED' };
  if (status === 'EXPIRED' || status === 'CANCELLED') return { isEligible: false, reason: 'LICENSE_EXPIRED' };
  
  if (license.startAt && new Date(license.startAt).getTime() > now) {
    return { isEligible: false, reason: 'LICENSE_NOT_STARTED' };
  }

  if (license.expiresAt && new Date(license.expiresAt).getTime() <= now) {
    return { isEligible: false, reason: 'LICENSE_EXPIRED' };
  }

  return { isEligible: true };
}
```

### 2. Component UI đề xuất: `DriverEligibilityBadge`
```tsx
export function DriverEligibilityBadge({ isEligible, reason }: { isEligible: boolean; reason?: string }) {
  if (isEligible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-good-deep">
        <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
        Đang nhận khách
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-warn-deep">
      <span className="h-2 w-2 rounded-full bg-warn" />
      Tạm ẩn khỏi App
    </span>
  );
}
```

---

# V. Tóm tắt các bước tiếp theo

1. **Owner UI**: Cập nhật [StationCard.tsx](file:///d:/Desktop/Workspace/final-year-project/chargeops-frontend/chargeops-web/apps/web/src/owner/features/stations/StationCard.tsx) và [License.tsx](file:///d:/Desktop/Workspace/final-year-project/chargeops-frontend/chargeops-web/apps/web/src/owner/pages/License.tsx) để bổ sung huy hiệu trạng thái nhận khách (Driver Eligibility) và banner cảnh báo sớm khi License hết hạn.
2. **Admin UI**: Cập nhật [Approvals.tsx](file:///d:/Desktop/Workspace/final-year-project/chargeops-frontend/chargeops-web/apps/web/src/admin/pages/Approvals.tsx) để khóa nút Approve nếu thiếu active license, và xử lý mã lỗi 409 Optimistic Lock trong [Licenses.tsx](file:///d:/Desktop/Workspace/final-year-project/chargeops-frontend/chargeops-web/apps/web/src/admin/pages/Licenses.tsx).
3. **Driver Flow**: Tinh chỉnh UI khi xem trạm chi tiết và cơ chế bắt lỗi khi đặt chỗ.