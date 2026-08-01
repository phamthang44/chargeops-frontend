export type LegalPageKind = "terms" | "privacy";

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalPageContent {
  title: string;
  eyebrow: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}

const terms: LegalPageContent = {
  title: "Điều khoản dịch vụ",
  eyebrow: "ChargeOps Legal",
  updatedAt: "01/08/2026",
  description:
    "Bản nháp theo SRS v4.7 cho nền tảng đặt chỗ trạm sạc xe điện ChargeOps. Nội dung dùng để trình bày trong UI đồ án và cần được rà soát pháp lý trước khi phát hành thật.",
  sections: [
    {
      title: "Tài khoản và phân quyền",
      body: [
        "Người dùng đăng ký bằng họ tên, email, số điện thoại và mật khẩu. Driver dùng ứng dụng mobile; Station Owner và Admin dùng web console theo vai trò được cấp.",
        "Station Staff không tự đăng ký. Tài khoản staff được chủ trạm mời hoặc cấp quyền bổ sung theo phạm vi trạm.",
        "Hệ thống dùng token đăng nhập và RBAC để giới hạn truy cập theo DRIVER, OWNER, ADMIN và STATION_STAFF.",
      ],
    },
    {
      title: "Đặt chỗ và giữ khung giờ",
      body: [
        "Driver chọn trạm, Connector, ngày, giờ bắt đầu và thời lượng sạc. Backend kiểm tra giờ hoạt động, tình trạng trùng lịch và quyền truy cập.",
        "Một Connector không thể có hai booking chồng thời gian. Khi có cạnh tranh đặt chỗ, hệ thống dùng locking để chỉ một yêu cầu thành công.",
        "Booking mới được tạo ở trạng thái Pending Payment và giữ khung giờ tạm thời trong thời gian cấu hình.",
      ],
    },
    {
      title: "Thanh toán sandbox",
      body: [
        "Theo SRS, driver thanh toán trước toàn bộ giá khung giờ sạc. Trong phạm vi đồ án, cổng thanh toán hoạt động ở sandbox/test mode.",
        "ChargeOps không giữ tiền người dùng trong phạm vi đồ án. Dữ liệu giao dịch được ghi nhận để hiển thị trạng thái, lịch sử và phục vụ audit.",
      ],
    },
    {
      title: "Hủy booking và hoàn tiền",
      body: [
        "Driver có grace window 5 phút sau khi đặt để hủy và hoàn 100%. Sau đó, chính sách hoàn tiền theo mốc thời gian trước giờ sạc sẽ được áp dụng.",
        "Nếu thanh toán thất bại hoặc quá hạn, booking bị hủy và khung giờ được trả lại cho Connector.",
      ],
    },
    {
      title: "Check-in QR và giới hạn phần cứng",
      body: [
        "Driver check-in bằng mã QR trên đúng Connector đã đặt. QR encode Connector ID và được dùng để xác nhận đúng cổng sạc.",
        "Dự án không điều khiển phần cứng sạc thật. Trạng thái charger/connector trong hệ thống là trạng thái logic phục vụ booking và mô phỏng.",
      ],
    },
    {
      title: "Hỗ trợ và ticket",
      body: [
        "Người dùng có thể tạo ticket cho vấn đề booking, thanh toán, tài khoản hoặc sự cố trạm. Ticket trạm được định tuyến cho Owner/Staff; ticket nền tảng được định tuyến cho Admin.",
      ],
    },
  ],
};

const privacy: LegalPageContent = {
  title: "Chính sách bảo mật",
  eyebrow: "ChargeOps Privacy",
  updatedAt: "01/08/2026",
  description:
    "Bản nháp theo SRS v4.7, mô tả dữ liệu ChargeOps xử lý để đăng ký tài khoản, xác thực, đặt chỗ, thanh toán sandbox, check-in QR và hỗ trợ người dùng.",
  sections: [
    {
      title: "Dữ liệu tài khoản",
      body: [
        "ChargeOps xử lý họ tên, email, số điện thoại, vai trò, trạng thái tài khoản và thông tin phiên đăng nhập để xác thực và phân quyền.",
        "Khi tích hợp Keycloak, mật khẩu và bước xác minh email được xử lý bởi Keycloak. Ứng dụng chỉ nhận token và các claim hồ sơ cần thiết.",
      ],
    },
    {
      title: "Dữ liệu booking và phiên sạc",
      body: [
        "Hệ thống lưu trạm, Connector, khung giờ, trạng thái booking, lịch sử phiên sạc, giá tại thời điểm đặt, mã booking và dữ liệu check-in.",
        "Dữ liệu này giúp giữ chỗ, tránh trùng khung giờ, hiển thị lịch sử, tính hoàn tiền và xử lý hỗ trợ.",
      ],
    },
    {
      title: "Vị trí, bản đồ và QR",
      body: [
        "Ứng dụng có thể xin quyền vị trí để gợi ý trạm gần người dùng và quyền camera để quét QR check-in.",
        "Các quyền nhạy cảm nên được xin theo ngữ cảnh, chỉ khi người dùng mở tính năng cần đến quyền đó.",
      ],
    },
    {
      title: "Thanh toán và giao dịch",
      body: [
        "Trong đồ án, thanh toán hoạt động ở sandbox/test mode. ChargeOps không lưu số thẻ đầy đủ và không giữ tiền người dùng.",
        "Nếu triển khai thanh toán thật, dữ liệu thanh toán nhạy cảm phải được xử lý bởi nhà cung cấp thanh toán phù hợp và tuân thủ quy định liên quan.",
      ],
    },
    {
      title: "Email, SMS và thông báo",
      body: [
        "Email hoặc SMS có thể được dùng để xác minh tài khoản, thông báo vòng đời booking, khôi phục tài khoản và hỗ trợ vận hành.",
        "Log gửi thông báo nên được giữ tối thiểu đủ để debug, chống lạm dụng và audit.",
      ],
    },
    {
      title: "Lưu trữ và bảo vệ token",
      body: [
        "Mobile app nên lưu token trong SecureStore/Keychain. Backend xác thực JWT theo issuer Keycloak và kiểm tra role trước khi xử lý API.",
      ],
    },
  ],
};

export function getLegalPage(kind: LegalPageKind): LegalPageContent {
  return kind === "terms" ? terms : privacy;
}
