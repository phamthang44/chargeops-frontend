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
  updatedAt: '08/09/2026',
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
      title: '4. Thanh toán và chính sách hủy, hoàn tiền v4.9',
      body: [
        'Booking mới ở trạng thái Chờ thanh toán (PENDING) và được giữ chỗ tạm thời trong 10 phút kể từ lúc tạo. Quá thời hạn này, booking sẽ hết hạn (EXPIRED).',
        'Ân hạn hủy 10 phút: Sau khi thanh toán thành công, tài xế hủy booking trong vòng 10 phút kể từ thời điểm thanh toán (và trước giờ bắt đầu sạc, chưa check-in) sẽ được hoàn tiền 100% giá gói.',
        'Sau hạn 10 phút ân hạn hoặc nếu không đến nhận chỗ (No-show), mức hoàn tiền là 0% do đổi ý.',
        'Trường hợp sự cố trạm sạc được hệ thống hoặc ban quản trị xác nhận, tài xế sẽ được hỗ trợ hoàn tiền 100% giá gói sạc.',
      ],
    },
    {
      title: '5. Check-in QR và trạng thái trụ sạc',
      body: [
        'Tài xế check-in bằng cách quét mã QR hợp lệ trên đúng cổng sạc đã đặt trước từ thời điểm bắt đầu phiên sạc đến trước giờ kết thúc 15 phút.',
        'Nếu quá hạn chót check-in mà tài xế chưa quét QR, hệ thống sẽ ghi nhận vắng mặt (No-show, hoàn 0%) để giải phóng trụ sạc cho các phương tiện khác.',
        'Trong phạm vi dự án, trạng thái trụ sạc và phiên sạc được mô phỏng theo mô hình trạng thái logic.',
      ],
    },
    {
      title: '6. Hỗ trợ sự cố và giải quyết khiếu nại',
      body: [
        'Người dùng có thể tạo phiếu hỗ trợ (Ticket) đối với các sự cố booking, thanh toán, tài khoản hoặc lỗi sạc tại trạm để được tiếp nhận và xử lý nhanh chóng.',
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
  updatedAt: '2026-09-08',
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
      title: '4. Payment and v4.9 cancellation & refund policy',
      body: [
        'New bookings hold the time range for 10 minutes in Pending Payment. Payments run in test mode for this demo.',
        '10-Minute Grace Window: Drivers can cancel within 10 minutes from payment confirmation (before booking start time and before check-in) for a 100% package refund.',
        'After the 10-minute grace window expires or in case of a no-show, refund is 0% due to change of mind.',
        'In verified station failure incidents, drivers receive a 100% refund in accordance with support procedures.',
      ],
    },
    {
      title: '5. QR check-in & simulated hardware',
      body: [
        'Drivers check in by scanning the valid QR code at the reserved connector between booking start time and 15 minutes before booking end time.',
        'Failing to check in by the deadline marks the booking as CANCELLED (NO_SHOW, 0% refund) to release the charger for other vehicles.',
        'In this project scope, charger states and charging sessions represent logical simulated states.',
      ],
    },
    {
      title: '6. Incident support',
      body: [
        'Users may submit support tickets for booking, payment, account, or station issues. Tickets are routed directly to station owners or platform admins.',
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
