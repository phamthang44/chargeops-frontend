import { useState } from 'react';
import { SsoRedirectOverlay } from '@chargeops/auth';
import { IconArrowRight, IconBolt, IconHome, IconLock, IconShieldCheck } from '@chargeops/ui';

/**
 * Portal launcher — the entry point of the ChargeOps console platform.
 * Picks a portal, simulates the Keycloak SSO bounce, then redirects the
 * browser to the right console app. Real login lives on Keycloak's page;
 * this app never handles credentials.
 */
const OWNER_URL = import.meta.env.VITE_OWNER_URL ?? 'http://localhost:5171';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5172';

export function App() {
  const [redirecting, setRedirecting] = useState(false);

  const enter = (url: string) => {
    setRedirecting(true);
    // Real mode: Keycloak session cookie already exists after first login, so
    // the target console silently obtains its own tokens (SSO) — no re-login.
    setTimeout(() => {
      window.location.href = url;
    }, 900);
  };

  if (redirecting) return <SsoRedirectOverlay />;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{
        background: 'radial-gradient(120% 120% at 50% 0%, #f0f1fb 0%, #f6f7f9 46%)',
        animation: 'fadeIn .3s ease',
      }}
    >
      <div className="w-full max-w-[880px]">
        <div className="mb-2 flex items-center gap-[11px]">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brand">
            <IconBolt size={17} strokeWidth={2.2} className="text-white" />
          </span>
          <span className="text-[24px] font-bold tracking-[-0.02em]">ChargeOps</span>
        </div>
        <div className="mb-1 max-w-[560px] text-[15px] text-muted">
          Nền tảng quản lý trạm sạc xe điện cho nhà vận hành độc lập tại Việt Nam.
        </div>
        <div className="mb-7 font-mono text-[12px] font-medium text-faint">
          CHỌN CỔNG TRUY CẬP · DEMO PROTOTYPE
        </div>

        <div className="grid gap-[18px] md:grid-cols-2">
          {/* Owner portal */}
          <div
            onClick={() => enter(OWNER_URL)}
            className="group cursor-pointer rounded-panel border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,17,26,.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(91,84,232,.14)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[11px] bg-brand-soft">
              <IconHome size={22} className="text-brand" />
            </div>
            <div className="mb-[5px] text-[17px] font-bold">Cổng Chủ trạm</div>
            <div className="mb-[18px] text-[13px] leading-[1.55] text-muted">
              Quản lý trạm, trụ sạc, giá &amp; giờ hoạt động, đặt chỗ và doanh thu của riêng bạn.
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
              Vào cổng <IconArrowRight size={15} strokeWidth={2.2} />
            </div>
          </div>

          {/* Admin portal */}
          <div
            onClick={() => enter(ADMIN_URL)}
            className="group cursor-pointer rounded-panel border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,17,26,.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(91,84,232,.14)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[11px] bg-ink">
              <IconShieldCheck size={22} className="text-white" />
            </div>
            <div className="mb-[5px] text-[17px] font-bold">Cổng Quản trị viên</div>
            <div className="mb-[18px] text-[13px] leading-[1.55] text-muted">
              Duyệt trạm, cấp trụ sạc, giám sát toàn nền tảng: đặt chỗ, giấy phép, người dùng.
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              Vào cổng <IconArrowRight size={15} strokeWidth={2.2} />
            </div>
          </div>
        </div>

        <div className="mt-[22px] flex items-center gap-2 text-[12px] text-faint">
          <IconLock size={14} />
          Đăng nhập thật sự được xử lý qua Keycloak SSO — bản demo bỏ qua bước nhập mật khẩu.
        </div>
      </div>
    </div>
  );
}
