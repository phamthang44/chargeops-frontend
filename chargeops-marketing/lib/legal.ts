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

const termsFallback: LegalPageContent = {
  title: "Điều khoản dịch vụ",
  eyebrow: "ChargeOps Terms of Service",
  updatedAt: "08/09/2026",
  description:
    "Điều khoản sử dụng ChargeOps theo quy chuẩn Booking v4.9: tài khoản, đặt gói sạc theo thời gian, thanh toán mô phỏng, hủy và hoàn tiền, check-in bằng mã QR.",
  sections: [
    {
      title: "1. Tài khoản và phân quyền người dùng",
      body: [
        "Tài khoản tài xế (DRIVER), chủ trạm (STATION_OWNER) và quản trị viên (ADMIN) được cấp quyền theo đúng chức năng nhiệm vụ. Nhân viên vận hành (Staff) được chủ trạm phân công vào trạm; quyền Staff chỉ có hiệu lực khi phân công còn ACTIVE, không phải một vai trò tài khoản độc lập.",
        "Hệ thống quản lý phiên đăng nhập và truy cập API bằng giao thức OpenID Connect (OIDC) kết hợp kiểm soát phân quyền chặt chẽ theo vai trò (RBAC) và phân công trạm cụ thể.",
        "Người dùng có trách nhiệm bảo mật thông tin đăng nhập và thiết bị của mình, đồng thời báo cho bộ phận hỗ trợ khi phát hiện truy cập hoặc giao dịch bất thường.",
      ],
    },
    {
      title: "2. Sử dụng tài khoản an toàn & Chuẩn bảo mật",
      body: [
        "Mật khẩu tài khoản được quản lý độc lập bởi Keycloak và băm bằng thuật toán Argon2id (salted password hashing), đảm bảo an toàn tuyệt đối.",
        "Phiên làm việc và giao thức xác thực sử dụng OpenID Connect Authorization Code Flow kết hợp cơ chế PKCE S256, loại bỏ nguy cơ đánh tráo authorization code trên thiết bị di động.",
        "Người dùng tuyệt đối không chia sẻ mật khẩu, mã xác thực hoặc thông tin phiên đăng nhập cho người khác.",
      ],
    },
    {
      title: "3. Đặt khung giờ sạc và giữ chỗ (Booking)",
      body: [
        "Tài xế lựa chọn trạm, cổng sạc (Connector) và gói thời gian. Ngày bắt đầu được chọn là hôm nay hoặc ngày mai; đặt trước ít nhất 60 phút, giờ bắt đầu theo bước 30 phút. Thời lượng có sàn 30 phút và tăng theo bước 30 phút.",
        "Hệ thống kiểm tra điều kiện hoạt động của trạm, hiệu lực license, thiết bị, biểu giá, giờ hoạt động và lịch trống trước khi nhận đặt chỗ. Khi có yêu cầu đồng thời trên cùng cổng sạc, hệ thống áp dụng cơ chế khóa bi quan (Pessimistic Locking) để tránh giữ chỗ chồng lấn.",
        "Đặt chỗ mới ở trạng thái Chờ thanh toán (PENDING) và được giữ trong 10 phút kể từ lúc tạo. Khi đến hạn mà thanh toán chưa được hệ thống xác nhận, đặt chỗ hết hạn (EXPIRED) và tự động giải phóng khung giờ.",
      ],
    },
    {
      title: "4. Thanh toán và chính sách hủy, hoàn tiền v4.9",
      body: [
        "Tài xế thanh toán đủ giá gói thời gian trước khi sử dụng, không đặt cọc và không quyết toán theo điện năng thực đo. ChargeOps không thu phí dịch vụ hoặc hoa hồng trên booking. Trong phạm vi demo hiện tại, thu tiền, hoàn tiền và chi trả được mô phỏng.",
        "Ân hạn hủy 10 phút được tính từ lần đầu hệ thống xác nhận thanh toán hợp lệ. Đặt chỗ CONFIRMED, chưa check-in, được hoàn 100% giá gói khi yêu cầu hủy được hệ thống xử lý trước cả hai mốc: hết 10 phút ân hạn và trước giờ bắt đầu đã đặt.",
        "Sau ân hạn, tài xế vẫn có thể hủy khi đặt chỗ còn CONFIRMED, nhưng hoàn 0% do đổi ý. Vắng mặt (No-show) cũng hoàn 0%, trừ trường hợp được xác nhận là lỗi trạm.",
        "Sự cố trạm được xác nhận đủ điều kiện hoàn 100% giá gói trong phạm vi MVP, kể cả sự cố giữa phiên hoặc được xác nhận sau khi đặt chỗ bị ghi nhận no-show.",
      ],
    },
    {
      title: "5. Check-in QR và Trạng thái thiết bị",
      body: [
        "Tài xế quét mã QR hợp lệ của đúng cổng sạc đã đặt và xác nhận check-in trên ứng dụng. Quét mã hoặc xem trước thông tin chưa đồng nghĩa check-in thành công; hệ thống còn kiểm tra đặt chỗ, thời hạn và mã xác nhận.",
        "Check-in được phép từ giờ bắt đầu đã đặt đến trước thời điểm kết thúc đã đặt trừ 15 phút. Tại đúng hạn chót này, đặt chỗ CONFIRMED chưa check-in bị ghi nhận vắng mặt (CANCELLED, lý do NO_SHOW). Đến muộn không làm lùi giờ kết thúc hoặc kéo dài phiên.",
        "Trong phạm vi dự án hiện tại, trạng thái thiết bị và phiên sạc được mô phỏng theo mô hình trạng thái logic (Simulated Hardware State).",
      ],
    },
    {
      title: "6. Hỗ trợ sự cố và giải quyết khiếu nại",
      body: [
        "Người dùng có thể tạo phiếu yêu cầu hỗ trợ (Ticket) đối với các sự cố liên quan đến giao dịch, thanh toán, tài khoản hoặc lỗi thiết bị tại trạm.",
        "Chủ trạm và nhân viên được phân công còn hiệu lực tiếp nhận vấn đề vận hành trong phạm vi trạm. Quản trị viên xử lý vấn đề hệ thống, tranh chấp, đối soát và thực hiện hoàn tiền theo thẩm quyền.",
      ],
    },
  ],
};

const privacyFallback: LegalPageContent = {
  title: "Chính sách bảo mật dữ liệu",
  eyebrow: "ChargeOps Privacy & Data Security",
  updatedAt: "08/09/2026",
  description:
    "Chính sách bảo mật mô tả chi tiết cách ChargeOps thu thập, lưu trữ, mã hóa và bảo vệ dữ liệu cá nhân, thông tin xác thực và lịch sử giao dịch của khách hàng theo quy chuẩn an toàn thông tin.",
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
        "Tất cả kết nối giữa ứng dụng Mobile / Web Client và hệ thống Server bắt buộc phải đi qua giao thức mã hóa HTTPS/TLS 1.2 trở lên với các bộ mã hóa an toàn.",
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
      title: "5. Phân quyền truy cập dữ liệu (RBAC Data Isolation)",
      body: [
        "Tài xế chỉ truy cập đặt chỗ và phiếu hỗ trợ của mình. Chủ trạm truy cập dữ liệu thuộc trạm và thông tin tài chính của mình theo quyền được cấp.",
        "Nhân viên có phân công còn hiệu lực chỉ truy cập dữ liệu vận hành và phiếu hỗ trợ thuộc trạm được giao; quyền này tuyệt đối không bao gồm số tiền, doanh thu, thông tin thanh toán hoặc tài khoản ngân hàng.",
        "Quản trị viên truy cập dữ liệu theo chức năng quản trị, hỗ trợ, giải quyết tranh chấp và đối soát.",
      ],
    },
    {
      title: "6. Quyền của khách hàng đối với dữ liệu cá nhân",
      body: [
        "Dữ liệu cá nhân được lưu trữ trong suốt thời gian tài khoản hoạt động và chỉ giữ lại nhật ký giao dịch theo thời hạn quy định của pháp luật phục vụ kiểm toán.",
        "Khách hàng có quyền yêu cầu tra cứu, chỉnh sửa thông tin cá nhân hoặc gửi yêu cầu xóa tài khoản và dữ liệu liên quan thông qua kênh hỗ trợ của ChargeOps.",
      ],
    },
  ],
};

export function parseMarkdownToSections(content: string): LegalSection[] {
  const sections: LegalSection[] = [];
  const lines = content.split('\n');
  let currentTitle = '';
  let currentBody: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Match headings like ### 1. Title or ## 1. Title
    const headingMatch = line.match(/^(?:#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentTitle && currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody });
        currentBody = [];
      }
      currentTitle = headingMatch[1].trim().replace(/\*\*/g, '');
      continue;
    }

    // Skip h1, dividers, blockquotes, or meta lines
    if (line.startsWith('# ') || line.startsWith('---') || line.startsWith('>')) {
      continue;
    }

    if (line.length > 0) {
      if (currentTitle) {
        // Strip markdown list bullets like "1. " or "- " and bold formatting
        const cleaned = line.replace(/^(\d+\.|\-|\*)\s+/, '').replace(/\*\*/g, '');
        if (cleaned.length > 0) {
          currentBody.push(cleaned);
        }
      }
    }
  }

  if (currentTitle && currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody });
  }

  return sections;
}

function formatDate(isoString?: string): string {
  if (!isoString) return '08/09/2026';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export async function getLegalPage(kind: LegalPageKind): Promise<LegalPageContent> {
  const fallback = kind === "terms" ? termsFallback : privacyFallback;
  const slug = kind === "terms" ? "terms-of-service" : "privacy-policy";
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:8080";

  try {
    const res = await fetch(`${apiBase}/api/v1/legal-documents/${slug}`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const payload = await res.json();
      const data = payload?.data || payload;
      if (data && typeof data.content === "string" && data.content.trim().length > 0) {
        const sections = parseMarkdownToSections(data.content);
        return {
          title: data.title || fallback.title,
          eyebrow: data.eyebrow || fallback.eyebrow,
          description: data.summary || fallback.description,
          updatedAt: formatDate(data.updatedAt || data.effectiveFrom),
          sections: sections.length > 0 ? sections : fallback.sections,
        };
      }
    }
  } catch {
    // Graceful fallback when backend is unreachable during build or offline
  }

  return fallback;
}
