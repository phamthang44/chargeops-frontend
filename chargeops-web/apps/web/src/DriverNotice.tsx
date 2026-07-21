import { IconBolt } from '@chargeops/ui';
import { useAuth } from '@chargeops/auth';

/**
 * Landing for a token that carries only the DRIVER role (or no console role).
 * The console is operator-only; drivers belong on the mobile app.
 */
export function DriverNotice() {
  const { user, logout } = useAuth();
  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{
        background: 'radial-gradient(120% 120% at 50% 0%, var(--color-brand-faint) 0%, var(--color-canvas) 46%)',
        animation: 'fadeIn .3s ease',
      }}
    >
      <div className="w-full max-w-[440px] rounded-panel border border-line bg-surface p-8 text-center shadow-[0_8px_24px_rgba(16,17,26,.06)]">
        <span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[13px] bg-brand">
          <IconBolt size={24} strokeWidth={2.2} className="text-white" />
        </span>
        <div className="mb-2 text-[19px] font-bold">Vui lòng dùng ứng dụng di động</div>
        <div className="mb-6 text-[13.5px] leading-[1.6] text-muted">
          Tài khoản {user?.email ?? 'này'} là tài khoản tài xế. Cổng quản lý này dành cho chủ
          trạm và quản trị viên — hãy tìm sạc, đặt chỗ và thanh toán trên ứng dụng ChargeOps
          trên điện thoại của bạn.
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded-ctl border border-line px-4 py-2 text-[13px] font-semibold text-body hover:bg-canvas"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
