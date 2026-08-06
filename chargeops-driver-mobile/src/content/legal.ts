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
  updatedAt: '01/08/2026',
  intro:
    'Điều khoản dịch vụ cho nền tảng ChargeOps theo SRS v4.7. Điều khoản này quy định cách tài xế sử dụng ứng dụng để tìm trạm, đặt khung giờ sạc, thanh toán và quét mã QR check-in.',
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
        'Mật khẩu tài khoản được bảo vệ bởi dịch vụ xác thực chuyên biệt và mã hóa một chiều bằng thuật toán Argon2id (Salted Password Hashing), chống lại các cuộc tấn công dò quét mật khẩu.',
        'Tiến trình xác thực đăng nhập tuân thủ tiêu chuẩn OpenID Connect Authorization Code Flow kết hợp PKCE S256, đảm bảo an toàn tuyệt đối cho ứng dụng di động.',
      ],
    },
    {
      title: '3. Đặt khung giờ sạc',
      body: [
        'Tài xế chọn trạm, cổng sạc, ngày, giờ bắt đầu và thời lượng sạc. Hệ thống kiểm tra khung giờ theo giờ hoạt động của trạm và tình trạng đặt chỗ hiện có.',
        'Một cổng sạc chỉ có một booking hợp lệ tại cùng một khoảng thời gian. Khi có cạnh tranh đặt chỗ, hệ thống sẽ sử dụng cơ chế khóa dữ liệu (Locking) để chỉ chấp nhận một yêu cầu duy nhất.',
      ],
    },
    {
      title: '4. Thanh toán và hoàn tiền',
      body: [
        'Booking mới ở trạng thái Chờ thanh toán và giữ khung giờ tạm thời trong 10 phút. Dự án hiện sử dụng chế độ Sandbox cho cổng thanh toán.',
        'Tài xế có 5 phút grace window sau khi đặt để hủy và được hoàn tiền 100%. Sau 5 phút, các mốc hoàn tiền theo thời gian trước giờ sạc sẽ được tự động áp dụng.',
      ],
    },
    {
      title: '5. Check-in QR và trạng thái trụ sạc',
      body: [
        'Tài xế check-in bằng cách quét mã QR trên đúng cổng sạc đã đặt. Mã QR đại diện cho Connector ID trong hệ thống.',
        'Trong phạm vi đồ án, trạng thái trụ sạc và phiên sạc là mô hình trạng thái logic (Simulated State).',
      ],
    },
    {
      title: '6. Hỗ trợ sự cố',
      body: [
        'Người dùng có thể tạo ticket hỗ trợ cho các sự cố booking, thanh toán, tài khoản hoặc trạm sạc. Ticket được tự động định tuyến đến chủ trạm hoặc quản trị viên.',
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
  updatedAt: '2026-08-01',
  intro:
    'Terms of Service for ChargeOps based on SRS v4.7. These terms govern how drivers use the app to discover stations, reserve slots, complete sandbox payments, and check in via QR code.',
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
        'Drivers select a station, connector, date, start time, and duration. The system validates operating hours and availability.',
        'A connector can hold only one valid booking at any given time. Concurrent reservation requests are serialized using backend pessimistic locking.',
      ],
    },
    {
      title: '4. Payment and refunds',
      body: [
        'New bookings hold the time range for 10 minutes in Pending Payment. Payments run in Sandbox test mode for this project.',
        'Drivers enjoy a 5-minute grace window for 100% refund upon cancellation. Subsequent cancellation fees apply according to SRS refund tiers.',
      ],
    },
    {
      title: '5. QR check-in & simulated hardware',
      body: [
        'Drivers check in by scanning the QR code at the reserved connector. The QR code encodes the unique Connector ID.',
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
