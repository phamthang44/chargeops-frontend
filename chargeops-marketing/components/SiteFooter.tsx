"use client";

import { Logo } from "./Logo";
import { BoltIcon } from "./Icons";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const copyrightText = t.footer.copyright.replace("{year}", String(currentYear));

  return (
    <footer className="border-t border-white/10 bg-[#050806]">
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-xs sm:text-sm text-white/60 leading-relaxed">
            {t.footer.description}
          </p>
        </div>

        <FooterCol
          title={t.footer.colProduct}
          links={[
            { label: t.footer.links.howItWorks, href: "/#cach-hoat-dong" },
            { label: t.footer.links.features, href: "/#tinh-nang" },
            { label: t.footer.links.stationNetwork, href: "/tram-sac" },
            { label: t.footer.links.architecture, href: "/#kien-truc" },
            { label: t.footer.links.downloadApp, href: "/#tai-ung-dung" },
          ]}
        />
        <FooterCol
          title={t.footer.colOwner}
          links={[
            { label: t.footer.links.console, href: "/#doi-tac" },
            { label: t.footer.links.revenueSim, href: "/#doi-tac" },
            { label: t.footer.links.licenseModel, href: "/#bang-gia-license" },
            { label: t.footer.links.registerStation, href: "mailto:support@chargeops.online?subject=Dang%20ky%20hop%20tac%20tram%20sac%20ChargeOps" },
          ]}
        />
        <FooterCol
          title={t.footer.colLegal}
          links={[
            { label: "support@chargeops.online", href: "mailto:support@chargeops.online" },
            { label: t.footer.links.terms, href: "/dieu-khoan" },
            { label: t.footer.links.privacy, href: "/chinh-sach-bao-mat" },
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 sm:flex-row">
          <p>{copyrightText}</p>
          <LanguageSwitcher variant="footer" />
          <p className="inline-flex items-center gap-1.5 font-medium text-white/80">
            {t.footer.tagline} <BoltIcon className="h-3.5 w-3.5 text-emerald-400" />
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
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-3.5 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-xs sm:text-sm text-white/60 transition hover:text-emerald-400 hover:translate-x-0.5 inline-block"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
