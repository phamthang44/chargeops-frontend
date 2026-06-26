import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#tram-sac", label: "Trạm sạc" },
  { href: "#doi-tac", label: "Dành cho chủ trạm" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" aria-label="ChargeOps trang chủ">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-body transition hover:text-primary-dark"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a href="#tai-ung-dung" className="btn-primary">
            Tải ứng dụng
          </a>
        </div>
      </div>
    </header>
  );
}
