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
    'Bản nháp dùng cho ChargeOps theo SRS v4.7. Điều khoản này mô tả cách tài xế sử dụng ứng dụng để tìm trạm, đặt khung giờ sạc, thanh toán sandbox và check-in bằng QR.',
  sections: [
    {
      title: '1. Tài khoản và vai trò',
      body: [
        'Tài xế đăng ký tài khoản bằng họ tên, email, số điện thoại và mật khẩu. Tài khoản driver trong ứng dụng này được gán vai trò DRIVER.',
        'Người dùng phải cung cấp thông tin chính xác và tự bảo vệ thông tin đăng nhập. Mọi truy cập API được kiểm soát bằng token và phân quyền RBAC.',
      ],
    },
    {
      title: '2. Đặt khung giờ sạc',
      body: [
        'Tài xế chọn trạm, cổng sạc, ngày, giờ bắt đầu và thời lượng sạc. Hệ thống kiểm tra khung giờ theo giờ hoạt động của trạm và tình trạng đặt chỗ hiện có.',
        'Một cổng sạc chỉ có một booking hợp lệ tại cùng một khoảng thời gian. Nếu có người khác giữ chỗ trước, yêu cầu đặt chỗ có thể bị từ chối.',
      ],
    },
    {
      title: '3. Thanh toán và trạng thái booking',
      body: [
        'Booking được tạo ở trạng thái chờ thanh toán. Khung giờ được giữ tạm trong thời gian cấu hình, hiện theo SRS là 10 phút.',
        'Dự án hiện dùng chế độ sandbox/test cho cổng thanh toán. ChargeOps không giữ tiền người dùng trong phạm vi đồ án này.',
      ],
    },
    {
      title: '4. Hủy và hoàn tiền',
      body: [
        'Trong 5 phút đầu sau khi đặt, tài xế có thể hủy và được hoàn 100% theo grace window của SRS.',
        'Sau grace window, các mức hoàn tiền theo thời gian trước giờ sạc sẽ được áp dụng trong backend và hiển thị trong màn hình booking.',
      ],
    },
    {
      title: '5. Check-in và sử dụng trạm',
      body: [
        'Tài xế check-in bằng cách quét mã QR trên đúng cổng sạc đã đặt. Mã QR đại diện cho Connector ID trong hệ thống.',
        'ChargeOps trong phạm vi đồ án không điều khiển phần cứng thật; trạng thái sạc và cổng sạc là logic hệ thống hoặc mô phỏng.',
      ],
    },
    {
      title: '6. Hỗ trợ',
      body: [
        'Người dùng có thể tạo ticket hỗ trợ cho sự cố booking, thanh toán, tài khoản hoặc trạm sạc. Ticket được định tuyến theo loại vấn đề và phạm vi trạm.',
      ],
    },
  ],
};

const PRIVACY_VI: LegalDocument = {
  title: 'Chính sách bảo mật',
  updatedAt: '01/08/2026',
  intro:
    'Bản nháp dùng cho ChargeOps theo SRS v4.7. Chính sách này tóm tắt loại dữ liệu ứng dụng xử lý khi tài xế đăng ký, tìm trạm, đặt chỗ, thanh toán và nhận hỗ trợ.',
  sections: [
    {
      title: '1. Dữ liệu tài khoản',
      body: [
        'ChargeOps xử lý họ tên, email, số điện thoại, vai trò tài khoản và trạng thái tài khoản để đăng ký, đăng nhập và phân quyền.',
        'Khi tích hợp Keycloak, mật khẩu và phiên đăng nhập được xử lý bởi Keycloak. Ứng dụng mobile chỉ nhận token và thông tin hồ sơ cần thiết.',
      ],
    },
    {
      title: '2. Dữ liệu đặt chỗ và sạc',
      body: [
        'Ứng dụng lưu thông tin trạm, cổng sạc, khung giờ, trạng thái booking, lịch sử phiên sạc, mã booking và thông tin check-in QR.',
        'Dữ liệu này được dùng để giữ chỗ, tránh trùng khung giờ, hiển thị lịch sử và xử lý hỗ trợ.',
      ],
    },
    {
      title: '3. Thanh toán',
      body: [
        'Trong phạm vi đồ án, thanh toán chạy ở sandbox/test mode. ChargeOps chỉ ghi nhận giao dịch phục vụ hiển thị, kiểm thử và audit.',
        'Không lưu thông tin thẻ đầy đủ trong ứng dụng. Việc xử lý thanh toán thật, nếu triển khai, phải đi qua nhà cung cấp thanh toán được cấp phép.',
      ],
    },
    {
      title: '4. Vị trí và QR',
      body: [
        'Ứng dụng có thể dùng vị trí để gợi ý trạm gần bạn và dùng camera để quét mã QR check-in. Các quyền này chỉ nên xin khi cần đến tính năng tương ứng.',
      ],
    },
    {
      title: '5. Email, SMS và thông báo',
      body: [
        'Email hoặc SMS có thể được dùng để xác minh tài khoản, gửi thông báo vòng đời booking và hỗ trợ khôi phục tài khoản.',
      ],
    },
    {
      title: '6. Bảo mật và lưu trữ token',
      body: [
        'Token đăng nhập trên mobile nên được lưu trong SecureStore/Keychain. Backend xác thực access token và áp dụng RBAC cho từng endpoint.',
      ],
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  updatedAt: '2026-08-01',
  intro:
    'Draft for ChargeOps based on SRS v4.7. These terms describe how drivers use the app to discover stations, reserve charging windows, use sandbox payments, and check in with QR codes.',
  sections: [
    {
      title: '1. Account and roles',
      body: [
        'Drivers register with full name, email, phone number, and password. This driver app assigns the DRIVER role.',
        'Users must provide accurate information and protect their credentials. API access is controlled by tokens and RBAC.',
      ],
    },
    {
      title: '2. Charging reservations',
      body: [
        'Drivers choose a station, connector, date, start time, and duration. The system checks operating hours and existing reservations.',
        'A connector can only hold one valid booking for the same time range. Conflicting reservations may be rejected.',
      ],
    },
    {
      title: '3. Payment and booking status',
      body: [
        'Bookings start in Pending Payment. The selected time range is temporarily held for the configured timeout, currently 10 minutes in the SRS.',
        'This project uses sandbox/test payment mode. ChargeOps does not custody user funds in this project scope.',
      ],
    },
    {
      title: '4. Cancellation and refunds',
      body: [
        'Drivers may cancel within the first 5 minutes after booking for a 100% grace refund.',
        'After the grace window, backend refund tiers based on time before charging apply and are shown in the booking screens.',
      ],
    },
    {
      title: '5. QR check-in and station use',
      body: [
        'Drivers check in by scanning the QR code on the correct reserved connector. The QR code represents the Connector ID.',
        'ChargeOps does not control real charger hardware in this project; charger and connector states are logical or simulated.',
      ],
    },
    {
      title: '6. Support',
      body: [
        'Users may create support tickets for booking, payment, account, or station issues. Tickets are routed by issue type and station scope.',
      ],
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: 'Privacy Policy',
  updatedAt: '2026-08-01',
  intro:
    'Draft for ChargeOps based on SRS v4.7. This policy summarizes the data processed when drivers register, discover stations, book charging windows, pay, and request support.',
  sections: [
    {
      title: '1. Account data',
      body: [
        'ChargeOps processes full name, email, phone number, account role, and account status for registration, authentication, and authorization.',
        'When Keycloak is integrated, passwords and login sessions are handled by Keycloak. The mobile app receives only tokens and necessary profile data.',
      ],
    },
    {
      title: '2. Booking and charging data',
      body: [
        'The app stores station, connector, time range, booking status, charging history, booking code, and QR check-in data.',
        'This data is used to reserve time ranges, prevent conflicts, show history, and support user issues.',
      ],
    },
    {
      title: '3. Payment',
      body: [
        'Payments run in sandbox/test mode for this project. ChargeOps records transactions for display, testing, and audit.',
        'The app does not store full card details. Real payment processing must go through a suitable licensed payment provider.',
      ],
    },
    {
      title: '4. Location and QR',
      body: [
        'The app may use location to suggest nearby stations and camera access to scan QR check-in codes. These permissions should be requested only when needed.',
      ],
    },
    {
      title: '5. Email, SMS, and notifications',
      body: [
        'Email or SMS may be used for account verification, booking lifecycle notifications, and account recovery.',
      ],
    },
    {
      title: '6. Token security',
      body: [
        'Mobile tokens should be stored in SecureStore or the platform keychain. Backend APIs validate access tokens and apply RBAC on every protected endpoint.',
      ],
    },
  ],
};

export function legalDocument(type: LegalDocType, language: string): LegalDocument {
  const vi = language !== 'en';
  if (type === 'terms') return vi ? TERMS_VI : TERMS_EN;
  return vi ? PRIVACY_VI : PRIVACY_EN;
}
