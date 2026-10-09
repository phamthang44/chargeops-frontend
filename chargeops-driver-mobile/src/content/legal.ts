export type LegalDocType = 'terms' | 'privacy';

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

const TERMS_VI: LegalDocument = {
  title: 'Điều khoản dịch vụ',
  updatedAt: '09/10/2026',
  intro:
    'Điều khoản dịch vụ cho nền tảng ChargeOps theo SRS v4.9. Điều khoản này quy định cách tài xế sử dụng ứng dụng để tìm trạm, đặt khung giờ sạc, thanh toán mô phỏng, hủy và hoàn tiền theo chính sách v4.9, và quét mã QR check-in.',
  sections: [
    {
      title: '1. Tài khoản và phân quyền',
      body: [
        'Tài xế đăng ký tài khoản bằng Họ và tên, Email, Số điện thoại và Mật khẩu. Tài khoản trong ứng dụng này được gán vai trò DRIVER.',
        'Hệ thống quản lý truy cập API bằng cơ chế mã hóa Token (OpenID Connect / JWT) và kiểm soát phân quyền RBAC nghiêm ngặt.',
      ],
    },
    {
      title: '2. Bảo mật mật khẩu & Tiến trình xác thực PKCE',
      body: [
        'Mật khẩu tài khoản được bảo vệ bởi dịch vụ xác thực chuyên biệt và mã hóa một chiều bằng thuật toán Argon2id (Salted Password Hashing), chống lại các cuộc tấn công vét cạn.',
        'Tiến trình xác thực đăng nhập tuân thủ tiêu chuẩn OpenID Connect Authorization Code Flow kết hợp PKCE S256, đảm bảo an toàn tuyệt đối cho ứng dụng di động.',
      ],
    },
    {
      title: '3. Đặt khung giờ sạc và giữ chỗ',
      body: [
        'Tài xế chọn trạm, cổng sạc, ngày, giờ bắt đầu và thời lượng sạc. Ngày bắt đầu được chọn là hôm nay hoặc ngày mai, đặt trước ít nhất 60 phút theo bước 30 phút.',
        'Một cổng sạc chỉ có một booking hợp lệ tại cùng một khoảng thời gian. Khi có cạnh tranh đặt chỗ, hệ thống sẽ sử dụng cơ chế khóa bi quan (Pessimistic Locking) để đảm bảo không chồng lấn.',
      ],
    },
    {
      title: "4. Thanh toán, hủy và hoàn Simulator",
      body: [
        "Thanh toán toàn bộ giá gói thời gian, không đặt cọc hoặc tính theo điện năng thực đo. Thu và hoàn trong demo là Simulator, không chứng minh giao dịch ngân hàng thật.",
        "Hold mặc định 10 phút từ lúc tạo booking; thử lại thanh toán không gia hạn. Receipt đến muộn, thiếu/thừa hoặc không khớp được đối soát riêng, không tự khôi phục booking.",
        "Grace mặc định 10 phút từ xác nhận payment hợp lệ đầu tiên. Hạn hoàn do đổi ý là min(paymentConfirmedAt + graceMinutes, startAt). Booking CONFIRMED chưa check-in được hoàn 100% giá gói khi máy chủ xử lý trước hạn; đúng hoặc sau hạn hoàn 0%. Đơn cũ giữ snapshot khi cấu hình đổi.",
        "Nếu máy chủ trả 409 BKG_CANCELLATION_CHANGED, booking chưa bị hủy: đọc số tiền mới và xác nhận lại nếu tiếp tục.",
        "Lỗi trạm được Owner nhận trách nhiệm hoặc Admin grant đúng case escalated, đủ điều kiện payment/receipt, hoàn 100% giá gói kể cả giữa phiên hoặc sau no-show; không hoàn trùng. Staff finding hoặc ticket riêng lẻ chưa cấp quyền hoàn.",
        "Nghĩa vụ PENDING khác kết quả SUCCEEDED. Attempt FAILED vẫn để nghĩa vụ PENDING; STARTED hoặc chưa rõ kết quả không được phát attempt mới. Owner retry khi hệ thống cho phép; không hứa retry tự động. Không có payout hoặc ví rút tiền.",
      ],
    },
    {
      title: "5. Check-in và kết thúc phiên",
      body: [
        "Quét QR của đúng cổng và xác nhận trên ứng dụng; quét hoặc xem trước chưa chứng minh check-in thành công.",
        "Check-in từ startAt (bao gồm) đến trước checkInDeadline (loại trừ), mặc định endAt trừ 15 phút. Phiên 14:00–15:00 đóng đúng 14:45; dùng deadline máy chủ của booking.",
        "Tại hoặc sau cutoff, CONFIRMED chưa check-in thành CANCELLED/NO_SHOW; thông thường hoàn 0%. Đến muộn không lùi giờ kết thúc, kết thúc sớm không tự hoàn thời gian chưa dùng. Lỗi trạm đủ căn cứ áp dụng riêng như mục 4.",
        "CHECKED_IN/CHARGING không hủy tự nguyện; có sự cố cần xử lý an toàn qua Incident/resolve-session trước quyết định tài chính. Trạng thái thiết bị/phiên trong demo là mô phỏng.",
      ],
    },
    {
      title: "6. Hỗ trợ và trách nhiệm",
      body: [
        "Gửi ticket để báo sự cố. Staff ACTIVE đúng trạm ghi chứng cứ kỹ thuật, không quyết định hoặc retry hoàn. Owner đúng scope/snapshot nhận trách nhiệm, kể cả case đã escalated.",
        "Admin chỉ rà chính sách tài chính trong đúng case escalated có hiệu lực; không có queue hoàn toàn nền tảng hoặc Manual Record. Đóng ticket không chứng minh đã hoàn tiền.",
      ],
    },
  ],
};

const PRIVACY_VI: LegalDocument = {
  title: 'Chính sách bảo mật dữ liệu',
  updatedAt: '01/08/2026',
  intro:
    'Chính sách này tóm tắt loại dữ liệu ChargeOps thu thập, tiêu chuẩn mã hóa bảo vệ thông tin khách hàng và quyền riêng tư khi tài xế sử dụng ứng dụng.',
  sections: [
    {
      title: '1. Dữ liệu tài khoản & Mã hóa mật khẩu',
      body: [
        'ChargeOps xử lý Họ tên, Email, Số điện thoại và Vai trò tài khoản để đăng ký, đăng nhập và phân quyền dịch vụ.',
        'Mật khẩu của bạn được quản lý bởi dịch vụ xác thực bảo mật và mã hóa an toàn bằng thuật toán Argon2id (salted password hashing). Mật khẩu gốc không bao giờ được lưu dưới dạng thô.',
      ],
    },
    {
      title: '2. Chuẩn xác thực OIDC & Ký số Token RS256',
      body: [
        'Xác thực đăng nhập chạy theo chuẩn OpenID Connect với PKCE S256. Tất cả Token phiên làm việc (JWT/JWS) được ký số bất đối xứng bằng thuật toán RS256 (RSA với SHA-256), chống giả mạo dữ liệu.',
      ],
    },
    {
      title: '3. Mã hóa đường truyền HTTPS & Data at Rest',
      body: [
        'Toàn bộ dữ liệu truyền tải qua mạng giữa ứng dụng mobile và server bắt buộc mã hóa qua giao thức HTTPS/TLS 1.2 trở lên.',
        'Dữ liệu lưu trữ trong cơ sở dữ liệu (PostgreSQL) được mã hóa lưu trữ Data at Rest ở cấp độ hạ tầng (Volume/Storage Encryption với AES-256).',
        'OAuth Token chỉ được giữ tạm thời trong bộ nhớ khi ứng dụng đang chạy và không được ghi vào localStorage, SecureStore hoặc bộ nhớ lâu dài khác. Trên web, sau khi tải lại trang, ứng dụng khôi phục đăng nhập bằng phiên SSO HttpOnly do Keycloak quản lý.',
      ],
    },
    {
      title: '4. Dữ liệu đặt chỗ, vị trí & Camera QR',
      body: [
        'Ứng dụng lưu thông tin trạm sạc, khung giờ, mã booking, lịch sử phiên sạc và mã QR check-in để vận hành dịch vụ và xử lý khiếu nại.',
        'Quyền Vị trí chỉ xin khi tìm trạm gần nhất và quyền Camera chỉ xin khi thực hiện quét mã QR check-in.',
      ],
    },
    {
      title: '5. Thời gian lưu trữ & Quyền riêng tư',
      body: [
        'Dữ liệu được lưu trữ trong thời gian tài khoản hoạt động và tuân thủ các quy định bảo lưu lịch sử giao dịch.',
        'Khách hàng có quyền truy cập, cập nhật hoặc gửi yêu cầu xóa dữ liệu cá nhân thông qua trung tâm hỗ trợ ChargeOps.',
      ],
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  updatedAt: '2026-10-09',
  intro:
    'Terms of Service for ChargeOps based on SRS v4.9. These terms govern how drivers use the app to discover stations, reserve charging slots, complete test payments, cancel and refund per v4.9 policy, and check in via QR code.',
  sections: [
    {
      title: '1. Account and roles',
      body: [
        'Drivers register using full name, email, phone number, and password. This mobile app assigns the DRIVER role.',
        'API access is authenticated via tokens and strictly authorized with Role-Based Access Control (RBAC).',
      ],
    },
    {
      title: '2. Password security & PKCE authentication',
      body: [
        'Passwords are managed by a dedicated secure authentication service using Argon2id salted password hashing, protecting against brute-force and credential stuffing attacks.',
        'Authentication follows OpenID Connect Authorization Code Flow with PKCE (S256), securing mobile authorization flows against code interception.',
      ],
    },
    {
      title: '3. Charging reservations',
      body: [
        'Drivers select a station, connector, date, start time, and duration. Starting date is today or tomorrow, booked at least 60 minutes in advance in 30-minute steps.',
        'A connector can hold only one valid booking at any given time. Concurrent reservation requests are serialized using backend pessimistic locking to avoid overlaps.',
      ],
    },
    {
      title: "4. Payment, cancellation and Simulator refunds",
      body: [
        "Pay the full time-package price, without a deposit or metered-energy settlement. Demo collections/refunds use Simulator and do not prove real bank transactions.",
        "Default hold is 10 minutes from booking creation; payment retries do not extend it. Late, short, excess or unmatched receipts are reconciled separately and do not automatically restore bookings.",
        "Default grace is 10 minutes from the first valid payment confirmation. The change-of-mind refund deadline is min(paymentConfirmedAt + graceMinutes, startAt). A CONFIRMED booking without check-in receives 100% when the server processes cancellation before the deadline; exactly at or after it, the refund is 0%. Old bookings retain snapshots when configuration changes.",
        "409 BKG_CANCELLATION_CHANGED means the booking has not been cancelled: read the new amount and consent again if continuing.",
        "Station failure accepted by the Owner or granted by Admin in the exact escalated case, with valid payment/receipt evidence, qualifies for 100% of the package price even mid-session or after no-show; no duplicate refunds. A Staff finding or ticket alone does not grant entitlement.",
        "A PENDING obligation differs from a SUCCEEDED outcome. A FAILED attempt leaves the obligation PENDING; STARTED or unknown outcomes block new attempts. The Owner may retry when permitted; automatic retries are not promised. There are no payouts or withdrawable wallets.",
      ],
    },
    {
      title: "5. Check-in and session ending",
      body: [
        "Scan the correct connector QR and confirm in the app; scanning or previewing does not prove successful check-in.",
        "Check-in opens at startAt (inclusive) and closes before checkInDeadline (exclusive), by default endAt minus 15 minutes. A 14:00–15:00 session closes exactly at 14:45; use the booking deadline from the server.",
        "At or after cutoff, CONFIRMED without check-in becomes CANCELLED/NO_SHOW, ordinarily with 0% refund. Late arrival does not move the end time; ending early does not automatically refund unused time. Substantiated station failure is separate as explained in section 4.",
        "CHECKED_IN/CHARGING cannot be voluntarily cancelled; incidents require safe Incident/resolve-session handling before financial decisions. Demo equipment/session states are simulated.",
      ],
    },
    {
      title: "6. Support and responsibility",
      body: [
        "Report incidents through tickets. Staff ACTIVE at the correct station records technical evidence, without deciding or retrying refunds. The Owner within scope/snapshot may accept responsibility even during escalation.",
        "Admin reviews financial policy only in the exact active escalated case; there is no platform-wide refund queue or Manual Record. Closing a ticket does not prove a paid refund.",
      ],
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: 'Data Privacy Policy',
  updatedAt: '2026-08-01',
  intro:
    'This policy outlines how ChargeOps collects, stores, encrypts, and protects customer personal data and charging records.',
  sections: [
    {
      title: '1. Account data & Argon2id password hashing',
      body: [
        'ChargeOps processes full name, email, phone number, and account role for identity verification and service provision.',
        'Passwords are stored by the secure authentication service and hashed using Argon2id with random salt. Plain-text passwords are never stored.',
      ],
    },
    {
      title: '2. OIDC authentication & RS256 token signing',
      body: [
        'Mobile authentication complies with OpenID Connect PKCE S256. Access tokens and ID tokens (JWT/JWS) are signed using RS256 (RSA with SHA-256) for tamper-proof security.',
      ],
    },
    {
      title: '3. Transport security & Data at Rest encryption',
      body: [
        'All client-server network traffic is encrypted using HTTPS with TLS 1.2+ protocols.',
        'PostgreSQL database records at rest are encrypted at the infrastructure storage volume layer (AES-256).',
        'OAuth tokens are held only in memory while the app is running and are not written to localStorage, SecureStore, or other persistent storage. On web reload, the app restores sign-in through the HttpOnly SSO session managed by Keycloak.',
      ],
    },
    {
      title: '4. Booking, location & QR data',
      body: [
        'The system records station selections, time ranges, booking codes, charging history, and check-in logs.',
        'Location access is requested only for nearby station discovery, and camera access is requested only for QR code scanning.',
      ],
    },
    {
      title: '5. Retention & customer privacy rights',
      body: [
        'Data is retained during active account lifecycle and stored in compliance with auditing standards.',
        'Customers hold rights to inspect, update, or request erasure of personal data through ChargeOps support.',
      ],
    },
  ],
};

export function legalDocument(type: LegalDocType, language: string): LegalDocument {
  const vi = language !== 'en';
  if (type === 'terms') return vi ? TERMS_VI : TERMS_EN;
  return vi ? PRIVACY_VI : PRIVACY_EN;
}
