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
    "Bản quy định theo SRS v4.7 cho nền tảng đặt chỗ trạm sạc xe điện ChargeOps. Quy định trách nhiệm người dùng, tiêu chuẩn bảo mật hạ tầng và chính sách vận hành.",
  sections: [
    {
      title: "1. Tài khoản và phân quyền người dùng",
      body: [
        "Người dùng đăng ký bằng họ tên, email, số điện thoại và mật khẩu. Driver dùng ứng dụng mobile; Station Owner và Admin dùng web console theo đúng vai trò được cấp.",
        "Station Staff không tự đăng ký công khai. Tài khoản staff được chủ trạm mời hoặc cấp quyền quản lý trong phạm vi trạm được giao.",
        "Hệ thống kiểm soát truy cập bằng token OIDC và mô hình phân quyền theo vai trò (RBAC) nghiêm ngặt giữa DRIVER, OWNER, ADMIN và STATION_STAFF.",
      ],
    },
    {
      title: "2. Cam kết hạ tầng & Tiêu chuẩn bảo mật tài khoản",
      body: [
        "Mật khẩu tài khoản được quản lý độc lập bởi Keycloak và băm bằng thuật toán Argon2id (salted password hashing), đảm bảo không ai kể cả quản trị viên hệ thống có thể xem mật khẩu gốc.",
        "Phiên làm việc và giao thức xác thực sử dụng OpenID Connect Authorization Code Flow kết hợp cơ chế PKCE (S256), loại bỏ nguy cơ đánh tráo authorization code trên thiết bị di động.",
        "Người dùng có trách nhiệm giữ bí mật thông tin đăng nhập và thiết bị cá nhân. Mọi thao tác thực hiện qua tài khoản hợp lệ được tính là thao tác của người dùng.",
      ],
    },
    {
      title: "3. Đặt chỗ và giữ khung giờ sạc",
      body: [
        "Driver chọn trạm, Connector, ngày, giờ bắt đầu và thời lượng sạc. Backend kiểm tra giờ hoạt động, tình trạng trùng lịch và quyền truy cập.",
        "Một Connector không thể có hai booking chồng thời gian. Khi có cạnh tranh đặt chỗ đồng thời, hệ thống sử dụng cơ chế pessimistic locking để đảm bảo tính nhất quán.",
        "Booking mới tạo ở trạng thái Pending Payment và giữ khung giờ tạm thời trong thời gian cấu hình (10 phút theo SRS).",
      ],
    },
    {
      title: "4. Thanh toán sandbox & Hoàn tiền",
      body: [
        "Driver thanh toán trước giá khung giờ sạc. Trong phạm vi dự án hiện tại, cổng thanh toán hoạt động ở chế độ thử nghiệm (Sandbox/Test mode).",
        "ChargeOps ghi nhận chi tiết giao dịch để phục vụ hiển thị lịch sử, kiểm tra trạng thái và audit. Driver có 5 phút grace window sau khi đặt để hủy và hoàn tiền 100%.",
      ],
    },
    {
      title: "5. Check-in QR và trạng thái thiết bị",
      body: [
        "Driver check-in bằng cách quét mã QR trên đúng Connector đã đặt. Mã QR chứa Connector ID chuẩn hóa phục vụ xác thực vị trí sạc.",
        "Dự án không can thiệp phần cứng sạc vật lý thật. Trạng thái cổng sạc và phiên sạc được quản lý theo mô hình trạng thái logic (Simulated State).",
      ],
    },
    {
      title: "6. Hỗ trợ và giải quyết khiếu nại",
      body: [
        "Người dùng có thể gửi ticket hỗ trợ cho các vấn đề liên quan đến booking, giao dịch, tài khoản hoặc sự cố trạm. Ticket trạm được định tuyến cho Owner/Staff, ticket hệ thống được gửi đến Admin.",
      ],
    },
  ],
};

const privacy: LegalPageContent = {
  title: "Chính sách bảo mật dữ liệu",
  eyebrow: "ChargeOps Privacy & Data Security",
  updatedAt: "01/08/2026",
  description:
    "Chính sách bảo mật mô tả chi tiết cách ChargeOps thu thập, lưu trữ, mã hóa và bảo vệ dữ liệu cá nhân, thông tin xác thực và lịch sử giao dịch của khách hàng theo tiêu chuẩn an toàn thông tin hiện hành.",
  sections: [
    {
      title: "1. Thu thập & Quản lý dữ liệu tài khoản",
      body: [
        "ChargeOps thu thập các thông tin cơ bản gồm Họ và tên, Địa chỉ Email, Số điện thoại và Vai trò tài khoản để phục vụ đăng ký, xác thực và liên lạc.",
        "Mật khẩu của bạn được quản lý bởi Keycloak Identity Provider và mã hóa một chiều bằng thuật toán Argon2id kèm Salt ngẫu nhiên. Mật khẩu không bao giờ được lưu dưới dạng văn bản thô (plain-text).",
      ],
    },
    {
      title: "2. Chuẩn xác thực OpenID Connect & Toàn vẹn Token",
      body: [
        "Tiến trình đăng nhập sử dụng chuẩn OpenID Connect (OIDC) Authorization Code Flow kết hợp PKCE S256, ngăn chặn triệt để các cuộc tấn công đánh chặn mã xác thực (Authorization Code Interception).",
        "Mọi Access Token và ID Token (JWT/JWS) phát hành đều được ký số bằng thuật toán bất đối xứng RS256 (RSA với SHA-256), đảm bảo tính toàn vẹn và chống giả mạo dữ liệu phiên làm việc.",
      ],
    },
    {
      title: "3. Bảo mật truyền tải (Transport Security) & Data at Rest",
      body: [
        "Tất cả kết nối giữa ứng dụng Mobile / Web Client và hệ thống Server bắt buộc phải đi qua giao thức mã hóa HTTPS/TLS 1.2 trở lên với các bộ mã hóa (cipher suites) an toàn.",
        "Dữ liệu lưu trữ trong cơ sở dữ liệu PostgreSQL (Data at Rest) bao gồm hồ sơ người dùng, lịch sử đặt chỗ và nhật ký phiên sạc được bảo vệ bằng cơ chế mã hóa lưu trữ ở cấp độ hạ tầng (Volume/Storage Encryption với AES-256).",
        "Trên thiết bị di động của tài xế, Auth Token được lưu trữ an toàn trong vùng nhớ mã hóa phần cứng (SecureStore trên iOS Keychain / EncryptedSharedPreferences trên Android).",
      ],
    },
    {
      title: "4. Dữ liệu đặt chỗ, vị trí & Mã QR",
      body: [
        "Hệ thống lưu thông tin trạm sạc, khung giờ đặt, mã booking, lịch sử phiên sạc và nhật ký check-in QR để vận hành dịch vụ giữ chỗ và giải quyết ticket hỗ trợ.",
        "Ứng dụng chỉ xin quyền Vị trí (Location) khi bạn mở tính năng tìm trạm gần nhất và chỉ xin quyền Camera khi bạn quét mã QR check-in tại trụ sạc.",
      ],
    },
    {
      title: "5. Thời hạn lưu trữ & Quyền của khách hàng đối với dữ liệu",
      body: [
        "Dữ liệu cá nhân được lưu trữ trong suốt thời gian tài khoản hoạt động và chỉ giữ lại nhật ký giao dịch theo thời hạn quy định của pháp luật phục vụ kiểm toán.",
        "Khách hàng có quyền yêu cầu tra cứu, chỉnh sửa thông tin cá nhân hoặc gửi yêu cầu xóa tài khoản và dữ liệu liên quan thông qua kênh hỗ trợ của ChargeOps.",
      ],
    },
  ],
};

export function getLegalPage(kind: LegalPageKind): LegalPageContent {
  return kind === "terms" ? terms : privacy;
}
