import { Logo } from "./Logo";
import { BoltIcon } from "./Icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#FAFBFB]">
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-xs sm:text-sm text-ink-muted leading-relaxed">
            Nền tảng hạ tầng đặt chỗ &amp; quản trị trạm sạc xe điện thông minh cho tài xế và đối tác chủ trạm tại Việt Nam.
          </p>

        </div>

        <FooterCol
          title="Sản phẩm"
          links={[
            { label: "Cách hoạt động", href: "/#cach-hoat-dong" },
            { label: "Tính năng", href: "/#tinh-nang" },
            { label: "Mạng lưới trạm sạc", href: "/tram-sac" },
            { label: "Tải ứng dụng", href: "/#tai-ung-dung" },
          ]}
        />
        <FooterCol
          title="Dành cho chủ trạm"
          links={[
            { label: "Quản trị trạm (Console)", href: "/#doi-tac" },
            { label: "Mô phỏng doanh thu", href: "/#doi-tac" },
            { label: "Bảng giá Subscription", href: "/#bang-gia-license" },
            { label: "Đăng ký kết nối trạm", href: "mailto:phamthang3564@gmail.com" },
          ]}
        />
        <FooterCol
          title="Liên hệ & Pháp lý"
          links={[
            { label: "phamthang3564@gmail.com", href: "mailto:phamthang3564@gmail.com" },
            { label: "Điều khoản dịch vụ", href: "/dieu-khoan" },
            { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
          ]}
        />
      </div>

      <div className="border-t border-black/[0.04]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ChargeOps. Đồ án tốt nghiệp ngành Computing.</p>
          <p className="inline-flex items-center gap-1.5 font-medium text-ink-heading">
            Nền tảng tìm trạm và đặt khung giờ sạc xe điện <BoltIcon className="h-3.5 w-3.5 text-primary" />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink-heading">{title}</h3>
      <ul className="mt-3.5 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-xs sm:text-sm text-ink-muted transition hover:text-primary-dark hover:translate-x-0.5 inline-block"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
