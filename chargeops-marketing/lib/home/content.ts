/**
 * Copy for the home page (vi + en).
 * Every claim here mirrors facts already stated elsewhere in the project
 * (lib/i18n/dictionaries, components/stations.ts). Prices and station data are
 * the project's simulated/demo figures and are labelled as such on the page.
 */

export const DRIVER_DEMO_URL = "https://driver.chargeops.online/?demo=true";
export const OWNER_REGISTER_URL = "https://console.chargeops.online/owner/register";
export const CONSOLE_URL = "https://console.chargeops.online";
export const SUPPORT_EMAIL = "support@chargeops.online";

type NavLink = { label: string; href: string; desc?: string; external?: boolean };
type NavGroup = { label: string; links: NavLink[] };

export type HomeCopy = {
  announcement: { text: string; link: string };
  nav: {
    findStation: string;
    groups: NavGroup[];
    help: string;
    cta: string;
    menu: string;
    closeMenu: string;
    home: string;
    language: string;
  };
  hero: { title: string; subtitle: string; cta: string; imageAlt: string };
  intro: { line1: string; line2: string };
  slider: {
    slides: { title: string; alt: string }[];
    cta: string;
    prev: string;
    next: string;
    label: string;
  };
  near: { line1: string; line2: string };
  map: {
    badge: string;
    cities: string;
    cardTitle: string;
    cardText: string;
    cardCta: string;
    close: string;
    search: string;
    available: string;
    viewStation: string;
    zoomIn: string;
    zoomOut: string;
  };
  stats: {
    stationsLabel: string;
    connectorsLabel: string;
    note: string;
    chargerAlt: string;
  };
  booking: { title: string; p1: string; p2: string; cta: string; imageAlt: string };
  about: { title: string; body: string; cta: string; altA: string; altB: string };
  plans: {
    title: string;
    body: string;
    cta: string;
    ctaClose: string;
    note: string;
    items: { name: string; price: string; unit: string; badge?: string; features: string[]; cta: string }[];
  };
  givingBack: { label: string; rows: { title: string; text: string }[] };
  app: {
    eyebrow: string;
    title: string;
    lines: string[];
    qrLabel: string;
    features: string[];
    handAlt: string;
  };
  partner: { title: string; body: string; cta: string; mail: string };
  gallery: { title: string; prev: string; next: string; alts: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  strip: { text: string; cta: string };
  footer: {
    cols: { title: string; links: NavLink[] }[];
    appTitle: string;
    appWeb: string;
    appSoon: string;
    help: string;
    copyright: string;
    legal: NavLink[];
    aiNote: string;
  };
  widget: { scan: string; barTitle: string; barText: string; barCta: string };
  promo: { badge: string; title: string; body: string; cta: string; close: string; imageAlt: string };
  video: { open: string; close: string; title: string };
};

const vi: HomeCopy = {
  announcement: {
    text: "Bản dùng thử Driver Web đã mở: tìm trạm, giữ khung giờ và lấy mã QR check-in, không cần cài app",
    link: "Thử ngay",
  },
  nav: {
    findStation: "Tìm trạm sạc",
    groups: [
      {
        label: "Dành cho tài xế",
        links: [
          { label: "Đặt chỗ hoạt động thế nào", href: "#trai-nghiem", desc: "Giữ trụ 15–30 phút trước khi tới" },
          { label: "Ứng dụng ChargeOps", href: "#ung-dung", desc: "Tìm trạm, đặt chỗ, check-in QR" },
          { label: "Bản đồ trạm sạc", href: "#ban-do", desc: "Trạm mẫu tại TP.HCM, Hà Nội, Đà Nẵng" },
        ],
      },
      {
        label: "Dành cho chủ trạm",
        links: [
          { label: "Gói License vận hành", href: "#goi-license", desc: "Từ 500.000đ / tháng / trạm" },
          { label: "Đăng ký kết nối trạm", href: "#doi-tac", desc: "Gửi hồ sơ, Admin duyệt" },
          { label: "Web Console", href: CONSOLE_URL, desc: "Quản trị trạm và biểu giá", external: true },
        ],
      },
      {
        label: "Vì sao ChargeOps",
        links: [
          { label: "Về ChargeOps", href: "#ve-chargeops", desc: "Đồ án tốt nghiệp ngành Computing" },
          { label: "Câu hỏi thường gặp", href: "#cau-hoi", desc: "Hủy, hoàn tiền, check-in" },
        ],
      },
    ],
    help: "Trợ giúp",
    cta: "Dùng thử Driver Web",
    menu: "Mở menu",
    closeMenu: "Đóng menu",
    home: "ChargeOps trang chủ",
    language: "Đổi ngôn ngữ",
  },
  hero: {
    title: "Đặt trước chỗ sạc. Đến là cắm.",
    subtitle: "Tìm trạm, giữ khung giờ và check-in bằng mã QR cho tài xế xe điện tại Việt Nam",
    cta: "Trải nghiệm Driver Web",
    imageAlt: "Trạm sạc ChargeOps dưới mái gỗ, tài xế ngồi nghỉ trong lúc xe đang sạc",
  },
  intro: {
    line1: "Sạc xe nhẹ nhàng như một giờ nghỉ.",
    line2: "Không xếp hàng, không đoán mò, đến là cắm.",
  },
  slider: {
    slides: [
      { title: "Giữ trước trụ sạc 15–30 phút trước khi bạn tới", alt: "Tài xế lái xe điện qua đường ven sông lúc hoàng hôn" },
      { title: "Đến nơi, quét mã QR để check-in đúng trụ đã đặt", alt: "Cắm đầu sạc CCS2 vào xe tại trụ ChargeOps" },
      { title: "Đổi ý trong 10 phút đầu? Hủy và được hoàn 100%", alt: "Tài xế xem điện thoại trong quán cà phê khi xe đang sạc bên ngoài" },
    ],
    cta: "Xem video demo 80s",
    prev: "Slide trước",
    next: "Slide tiếp",
    label: "Trải nghiệm đặt chỗ sạc",
  },
  near: { line1: "Trạm sạc ngay quanh bạn", line2: "hoặc sắp có gần bạn" },
  map: {
    badge: "Dữ liệu minh họa",
    cities: "Chọn thành phố",
    cardTitle: "Mọi trạm sạc trong túi bạn",
    cardText: "Miễn phí · chạy ngay trên trình duyệt",
    cardCta: "Mở bản dùng thử",
    close: "Đóng",
    search: "Tìm trạm sạc",
    available: "cổng khả dụng",
    viewStation: "Xem trạm",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
  },
  stats: {
    stationsLabel: "Trạm mẫu trên bản đồ",
    connectorsLabel: "Cổng sạc có thể đặt chỗ",
    note: "Số liệu từ dữ liệu demo của ChargeOps",
    chargerAlt: "Trụ sạc nhanh DC mang thương hiệu ChargeOps",
  },
  booking: {
    title: "Một lần đặt chỗ, cả chặng đường nhẹ đầu.",
    p1: "Xem loại cổng, công suất kW và đơn giá trước khi xác nhận. Ứng dụng giữ trụ cho xe bạn trong 15–30 phút.",
    p2: "Đến trạm, mở mã QR là xong.",
    cta: "Thử đặt chỗ mô phỏng",
    imageAlt: "Tay cầm điện thoại hiển thị mã QR đặt chỗ cạnh trụ sạc",
  },
  about: {
    title: "Chúng tôi là ChargeOps, giúp mỗi lần sạc chủ động hơn",
    body: "ChargeOps là nền tảng đặt chỗ và quản trị trạm sạc, xây dựng như một đồ án tốt nghiệp ngành Computing: ứng dụng cho tài xế, Web Console cho chủ trạm, cổng Admin để duyệt trạm và trình mô phỏng sạc theo chuẩn OCPP.",
    cta: "Xem video demo 80s",
    altA: "Mái che bằng gỗ của một trạm sạc ChargeOps",
    altB: "Cận cảnh mặt bên trụ sạc ChargeOps",
  },
  plans: {
    title: "Vận hành trạm sạc với License ChargeOps",
    body: "Hai gói cho chủ trạm: 500.000đ mỗi tháng hoặc 5.000.000đ mỗi năm cho một trạm. Cấu hình giá theo khung giờ, theo dõi trụ và đối soát đặt chỗ trên Web Console.",
    cta: "Xem 2 gói License",
    ctaClose: "Thu gọn",
    note: "* Biểu phí mô phỏng mô hình kinh tế phần mềm cho đồ án tốt nghiệp, không phải hợp đồng thương mại thu phí thực tế.",
    items: [
      {
        name: "Gói tháng",
        price: "500.000đ",
        unit: "/ tháng / trạm",
        features: [
          "Quản lý tối đa 6 cổng sạc tại 1 trạm",
          "Biểu giá theo khung giờ (TOU)",
          "Giám sát trạng thái trụ thời gian thực",
          "Đối soát booking và lịch sử phiên sạc",
        ],
        cta: "Đăng ký thử nghiệm",
      },
      {
        name: "Gói năm",
        price: "5.000.000đ",
        unit: "/ năm / trạm",
        badge: "Tiết kiệm ~17%",
        features: [
          "Toàn bộ tính năng của gói tháng",
          "Hỗ trợ kỹ thuật ưu tiên",
          "Cảnh báo lỗi trụ qua Telegram / Email",
          "Xuất báo cáo tài chính và năng lượng",
        ],
        cta: "Đăng ký thử nghiệm",
      },
    ],
  },
  givingBack: {
    label: "Trả lại cho bạn",
    rows: [
      { title: "Thời gian", text: "Giữ chỗ trước nên không phải xếp hàng giờ tan tầm hay chạy vòng tìm trụ trống." },
      { title: "Năng lượng", text: "Lúc xe nạp điện cũng là lúc bạn nghỉ ngơi: một khoảng nghỉ đã được lên lịch sẵn." },
      { title: "Sự yên tâm", text: "Chính sách hủy rõ ràng: trong 10 phút đầu sau thanh toán được hoàn 100%." },
    ],
  },
  app: {
    eyebrow: "Miễn phí · chạy trên trình duyệt",
    title: "Quét mã để mở ChargeOps",
    lines: ["Một ứng dụng cho cả hành trình sạc", "Tài khoản tài xế mẫu có sẵn"],
    qrLabel: "Quét để dùng thử",
    features: ["Giữ chỗ theo khung giờ", "Check-in bằng mã QR", "Theo dõi trạng thái đặt chỗ"],
    handAlt: "Điện thoại hiển thị bản đồ trạm sạc trong ứng dụng ChargeOps",
  },
  partner: {
    title: "Bạn có bãi xe, quán cà phê hay trung tâm thương mại?",
    body: "Kết nối trạm sạc với ChargeOps để tài xế tìm thấy và đặt chỗ trước. Gửi hồ sơ trên Web Console, quản trị viên xác minh và phê duyệt.",
    cta: "Đăng ký kết nối trạm",
    mail: "Hoặc email cho chúng tôi",
  },
  gallery: {
    title: "Khám phá thế giới ChargeOps",
    prev: "Ảnh trước",
    next: "Ảnh tiếp",
    alts: [
      "Trạm sạc ChargeOps tại TP.HCM",
      "Tài xế lái xe điện lúc hoàng hôn",
      "Cắm sạc tại trụ ChargeOps",
      "Nghỉ chân ở quán cà phê khi xe đang sạc",
      "Mái che gỗ của trạm sạc",
      "Mặt bên trụ sạc ChargeOps",
      "Trạm sạc trên phố Hà Nội",
      "Điểm dừng sạc ven biển Đà Nẵng",
      "Mã QR đặt chỗ trên điện thoại",
    ],
  },
  faq: {
    title: "Câu hỏi thường gặp khi sạc cùng ChargeOps",
    items: [
      {
        q: "ChargeOps là gì?",
        a: "ChargeOps là hệ thống đặt chỗ và quản trị trạm sạc xe điện: ứng dụng cho tài xế tìm trạm và giữ khung giờ, Web Console cho chủ trạm, cổng Admin để duyệt trạm. Đây là đồ án tốt nghiệp ngành Computing, dữ liệu trên trang là dữ liệu minh họa.",
      },
      {
        q: "Giữ chỗ hoạt động thế nào?",
        a: "Bạn chọn trạm, cổng sạc và khung giờ, xem giá trước rồi xác nhận. Trụ sạc được giữ riêng cho xe bạn trong 15–30 phút để không ai chiếm chỗ khi bạn đang trên đường tới.",
      },
      {
        q: "Nếu tôi muốn hủy thì sao?",
        a: "Trong 10 phút đầu sau khi thanh toán, bạn có thể hủy trên app và được hoàn 100% tiền tạm ứng. Sau thời gian này vị trí đã được khóa cho xe bạn, nên hủy do đổi ý sẽ không được hoàn.",
      },
      {
        q: "Quét mã QR có tự bắt đầu phiên sạc không?",
        a: "Không. Quét mã QR giúp xác nhận đúng trụ và đúng lượt đặt chỗ để check-in. Phiên sạc và việc điều khiển thiết bị phụ thuộc vào trạm được kết nối.",
      },
      {
        q: "Tôi là chủ trạm, làm sao tham gia?",
        a: "Gửi hồ sơ đăng ký trạm trên Web Console. Quản trị viên xác minh License và phê duyệt, sau đó bạn cấu hình giá, giờ hoạt động và theo dõi trụ. Gói License mô phỏng: 500.000đ/tháng hoặc 5.000.000đ/năm cho một trạm.",
      },
    ],
  },
  strip: {
    text: "ChargeOps mô phỏng thiết bị sạc theo chuẩn OCPP 1.6J / 2.0.1 và phân quyền ba vai trò Driver, Owner, Admin qua Keycloak OIDC.",
    cta: "Xem video demo",
  },
  footer: {
    cols: [
      {
        title: "Tài xế",
        links: [
          { label: "Tìm trạm sạc", href: "/tram-sac" },
          { label: "Đặt chỗ hoạt động thế nào", href: "#trai-nghiem" },
          { label: "Bản đồ trạm", href: "#ban-do" },
          { label: "Câu hỏi thường gặp", href: "#cau-hoi" },
        ],
      },
      {
        title: "Chủ trạm",
        links: [
          { label: "Gói License", href: "#goi-license" },
          { label: "Đăng ký kết nối trạm", href: OWNER_REGISTER_URL, external: true },
          { label: "Web Console", href: CONSOLE_URL, external: true },
        ],
      },
      {
        title: "ChargeOps",
        links: [
          { label: "Về chúng tôi", href: "#ve-chargeops" },
          { label: "Trạm tại TP.HCM, Hà Nội, Đà Nẵng", href: "/tram-sac" },
          { label: "Email hỗ trợ", href: `mailto:${SUPPORT_EMAIL}` },
        ],
      },
    ],
    appTitle: "Ứng dụng",
    appWeb: "Dùng thử trên web",
    appSoon: "iOS & Android sắp ra mắt",
    help: "Trợ giúp",
    copyright: "© {year} ChargeOps. Đồ án tốt nghiệp ngành Computing.",
    legal: [
      { label: "Điều khoản dịch vụ", href: "/dieu-khoan" },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
    ],
    aiNote: "Ảnh và video minh họa trên trang được tạo bằng AI.",
  },
  widget: {
    scan: "Quét để dùng thử",
    barTitle: "Dùng thử ChargeOps",
    barText: "Miễn phí · không cần cài app",
    barCta: "Mở bản dùng thử",
  },
  promo: {
    badge: "Mới",
    title: "Đặt chỗ sạc mô phỏng, miễn phí trên web",
    body: "Tài khoản tài xế mẫu có sẵn. Thử tìm trạm, giữ khung giờ và lấy mã QR check-in trong vài phút.",
    cta: "Thử ngay",
    close: "Đóng",
    imageAlt: "Tay cầm điện thoại hiển thị mã QR đặt chỗ",
  },
  video: { open: "Xem video demo", close: "Đóng video", title: "Video demo ChargeOps" },
};

const en: HomeCopy = {
  announcement: {
    text: "The Driver Web demo is open: find a station, hold a time slot and get your QR check-in, no install needed",
    link: "Try it",
  },
  nav: {
    findStation: "Find a station",
    groups: [
      {
        label: "For drivers",
        links: [
          { label: "How booking works", href: "#trai-nghiem", desc: "Hold a charger 15–30 min ahead" },
          { label: "The ChargeOps app", href: "#ung-dung", desc: "Find, book, check in with QR" },
          { label: "Station map", href: "#ban-do", desc: "Sample stations in HCMC, Hanoi, Da Nang" },
        ],
      },
      {
        label: "For station owners",
        links: [
          { label: "Operating licenses", href: "#goi-license", desc: "From 500,000 VND / month / station" },
          { label: "Connect your station", href: "#doi-tac", desc: "Submit, then admin approval" },
          { label: "Web Console", href: CONSOLE_URL, desc: "Manage stations and pricing", external: true },
        ],
      },
      {
        label: "Why ChargeOps",
        links: [
          { label: "About ChargeOps", href: "#ve-chargeops", desc: "A Computing capstone project" },
          { label: "FAQ", href: "#cau-hoi", desc: "Cancelling, refunds, check-in" },
        ],
      },
    ],
    help: "Help",
    cta: "Try Driver Web",
    menu: "Open menu",
    closeMenu: "Close menu",
    home: "ChargeOps home",
    language: "Change language",
  },
  hero: {
    title: "Book your charger. Arrive and plug in.",
    subtitle: "Find stations, hold a time slot and check in with a QR code, built for EV drivers in Vietnam",
    cta: "Try Driver Web",
    imageAlt: "A ChargeOps station under a wooden canopy while drivers relax as their cars charge",
  },
  intro: {
    line1: "Charging that feels like a short break.",
    line2: "No queues, no guessing, just plug in.",
  },
  slider: {
    slides: [
      { title: "Hold a charger 15–30 minutes before you arrive", alt: "A driver in an electric car on a riverside road at sunset" },
      { title: "On arrival, scan the QR code to check in at your charger", alt: "Plugging a CCS2 connector into a car at a ChargeOps charger" },
      { title: "Changed your mind in the first 10 minutes? Cancel for a 100% refund", alt: "A driver on his phone in a cafe while his car charges outside" },
    ],
    cta: "Watch the 80s demo",
    prev: "Previous slide",
    next: "Next slide",
    label: "The booking experience",
  },
  near: { line1: "Stations already near you", line2: "or coming close by" },
  map: {
    badge: "Sample data",
    cities: "Choose a city",
    cardTitle: "Every station in your pocket",
    cardText: "Free · runs in your browser",
    cardCta: "Open the demo",
    close: "Close",
    search: "Find a station",
    available: "connectors available",
    viewStation: "View station",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
  stats: {
    stationsLabel: "Sample stations on the map",
    connectorsLabel: "Bookable connectors",
    note: "Figures from ChargeOps demo data",
    chargerAlt: "A ChargeOps branded DC fast charger",
  },
  booking: {
    title: "One booking, a lighter journey.",
    p1: "See the connector type, kW power and price before you confirm. The app holds the charger for your car for 15–30 minutes.",
    p2: "At the station, open your QR code and you're in.",
    cta: "Try a demo booking",
    imageAlt: "A hand holding a phone with a booking QR code next to a charger",
  },
  about: {
    title: "We're ChargeOps, making every charge more predictable",
    body: "ChargeOps is a charging reservation and station management platform, built as a Computing capstone project: an app for drivers, a Web Console for owners, an Admin portal for approvals and an OCPP charging simulator.",
    cta: "Watch the 80s demo",
    altA: "The wooden canopy of a ChargeOps station",
    altB: "Close-up of a ChargeOps charger side panel",
  },
  plans: {
    title: "Run your station with a ChargeOps license",
    body: "Two plans for owners: 500,000 VND per month or 5,000,000 VND per year per station. Time-of-use pricing, live charger status and booking reconciliation in the Web Console.",
    cta: "See the 2 plans",
    ctaClose: "Collapse",
    note: "* Simulated pricing for a capstone project's software business model, not a real commercial contract.",
    items: [
      {
        name: "Monthly",
        price: "500,000 VND",
        unit: "/ month / station",
        features: [
          "Up to 6 connectors at 1 station",
          "Time-of-use (TOU) pricing",
          "Real-time charger status",
          "Booking and session history reconciliation",
        ],
        cta: "Join the pilot",
      },
      {
        name: "Yearly",
        price: "5,000,000 VND",
        unit: "/ year / station",
        badge: "Save ~17%",
        features: [
          "Everything in Monthly",
          "Priority technical support",
          "Charger fault alerts via Telegram / Email",
          "Financial and energy report exports",
        ],
        cta: "Join the pilot",
      },
    ],
  },
  givingBack: {
    label: "Giving you back",
    rows: [
      { title: "Your time", text: "Your slot is held, so no rush-hour queues and no circling for a free charger." },
      { title: "Your energy", text: "While your car charges, you recharge too: a break that's already scheduled." },
      { title: "Your peace of mind", text: "A clear cancellation policy: a 100% refund within 10 minutes of paying." },
    ],
  },
  app: {
    eyebrow: "Free · runs in the browser",
    title: "Scan to open ChargeOps",
    lines: ["One app for the whole charging trip", "A sample driver account is ready"],
    qrLabel: "Scan to try",
    features: ["Book by time slot", "Check in with a QR code", "Track your booking status"],
    handAlt: "A phone showing the charging station map in the ChargeOps app",
  },
  partner: {
    title: "Own a car park, a cafe or a shopping mall?",
    body: "Connect your charging station to ChargeOps so drivers can find it and book ahead. Apply in the Web Console; an admin verifies and approves it.",
    cta: "Connect your station",
    mail: "Or email us",
  },
  gallery: {
    title: "Discover the ChargeOps world",
    prev: "Previous photo",
    next: "Next photo",
    alts: [
      "A ChargeOps station in Ho Chi Minh City",
      "A driver at sunset in an electric car",
      "Plugging in at a ChargeOps charger",
      "A cafe break while the car charges",
      "The wooden canopy of a station",
      "The side of a ChargeOps charger",
      "A station on a Hanoi street",
      "A seaside charging stop in Da Nang",
      "A booking QR code on a phone",
    ],
  },
  faq: {
    title: "Questions about charging with ChargeOps",
    items: [
      {
        q: "What is ChargeOps?",
        a: "ChargeOps is an EV charging reservation and station management system: an app for drivers to find stations and hold time slots, a Web Console for owners and an Admin portal for approvals. It's a Computing capstone project; the data on this page is sample data.",
      },
      {
        q: "How does holding a slot work?",
        a: "Pick a station, connector and time slot, check the price and confirm. The charger is held for your car for 15–30 minutes so nobody takes it while you're on the way.",
      },
      {
        q: "What if I need to cancel?",
        a: "Within 10 minutes of paying you can cancel in the app for a 100% refund of the deposit. After that the slot is locked for your car, so cancelling for a change of plans isn't refunded.",
      },
      {
        q: "Does scanning the QR code start charging?",
        a: "No. Scanning confirms the right charger and booking for check-in. The charging session and device control depend on the connected station.",
      },
      {
        q: "I own a station. How do I join?",
        a: "Submit a station application in the Web Console. An admin verifies the license and approves it, then you set prices, opening hours and monitor chargers. Simulated license: 500,000 VND/month or 5,000,000 VND/year per station.",
      },
    ],
  },
  strip: {
    text: "ChargeOps simulates chargers over OCPP 1.6J / 2.0.1 and separates the Driver, Owner and Admin roles with Keycloak OIDC.",
    cta: "Watch the demo",
  },
  footer: {
    cols: [
      {
        title: "Drivers",
        links: [
          { label: "Find a station", href: "/tram-sac" },
          { label: "How booking works", href: "#trai-nghiem" },
          { label: "Station map", href: "#ban-do" },
          { label: "FAQ", href: "#cau-hoi" },
        ],
      },
      {
        title: "Station owners",
        links: [
          { label: "Licenses", href: "#goi-license" },
          { label: "Connect your station", href: OWNER_REGISTER_URL, external: true },
          { label: "Web Console", href: CONSOLE_URL, external: true },
        ],
      },
      {
        title: "ChargeOps",
        links: [
          { label: "About us", href: "#ve-chargeops" },
          { label: "Stations in HCMC, Hanoi, Da Nang", href: "/tram-sac" },
          { label: "Support email", href: `mailto:${SUPPORT_EMAIL}` },
        ],
      },
    ],
    appTitle: "App",
    appWeb: "Try it on the web",
    appSoon: "iOS & Android coming soon",
    help: "Help",
    copyright: "© {year} ChargeOps. A Computing capstone project.",
    legal: [
      { label: "Terms of service", href: "/dieu-khoan" },
      { label: "Privacy policy", href: "/chinh-sach-bao-mat" },
    ],
    aiNote: "Photos and videos on this page are AI-generated illustrations.",
  },
  widget: {
    scan: "Scan to try",
    barTitle: "Try ChargeOps",
    barText: "Free · no install needed",
    barCta: "Open the demo",
  },
  promo: {
    badge: "New",
    title: "Demo charger booking, free on the web",
    body: "A sample driver account is ready. Find a station, hold a time slot and get your QR check-in in a few minutes.",
    cta: "Try it now",
    close: "Close",
    imageAlt: "A hand holding a phone with a booking QR code",
  },
  video: { open: "Watch the demo", close: "Close video", title: "ChargeOps demo video" },
};

export const HOME_COPY = { vi, en } as const;
