import { Logo } from "./Logo";
import { BoltIcon } from "./Icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-alt">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-muted">
            Nền tảng đặt chỗ &amp; quản lý trạm sạc xe điện cho tài xế và chủ
            trạm tại Việt Nam.
          </p>
        </div>

        <FooterCol
          title="Sản phẩm"
          links={[
            { label: "Cách hoạt động", href: "/#cach-hoat-dong" },
            { label: "Tính năng", href: "/#tinh-nang" },
            { label: "Trạm sạc", href: "/tram-sac" },
            { label: "Tải ứng dụng", href: "/#tai-ung-dung" },
          ]}
        />
        <FooterCol
          title="Đối tác"
          links={[
            { label: "Dành cho chủ trạm", href: "/#doi-tac" },
            { label: "Đăng ký trạm", href: "/#doi-tac" },
          ]}
        />
        <FooterCol
          title="Liên hệ"
          links={[
            { label: "phamthang3564@gmail.com", href: "mailto:phamthang3564@gmail.com" },
          ]}
        />
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ChargeOps. Đồ án tốt nghiệp.</p>
          <p className="inline-flex items-center gap-1">Made in Vietnam <BoltIcon className="h-3.5 w-3.5" /></p>
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
      <h3 className="text-sm font-semibold text-ink-strong">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-ink-muted transition hover:text-primary-dark"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
