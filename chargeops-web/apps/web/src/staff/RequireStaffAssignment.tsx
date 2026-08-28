import { useMemo, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, SsoRedirectOverlay } from '@chargeops/auth';
import { createServices, type CurrentStaffContextResponse } from '@chargeops/api';
import { Button, IconAlertTriangle } from '@chargeops/ui';

export function useStaffContext() {
  const { getToken, user } = useAuth();
  const services = useMemo(() => createServices({ ownerView: true, getToken }), [getToken]);
  const isOwner = user?.roles.includes('station_owner');
  const isAdmin = user?.roles.includes('platform_admin');

  return useQuery<CurrentStaffContextResponse>({
    queryKey: ['staff', 'current-context'],
    queryFn: () => services.staff.currentContext(),
    enabled: !isOwner && !isAdmin,
    staleTime: 30_000,
    retry: 1,
  });
}

export function RequireStaffAssignment({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const isOwner = user?.roles.includes('station_owner');
  const isAdmin = user?.roles.includes('platform_admin');

  // If user is owner or admin navigating to staff, they should go to their own console
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOwner) return <Navigate to="/owner" replace />;

  const staffQ = useStaffContext();

  if (staffQ.isLoading) {
    return <SsoRedirectOverlay />;
  }

  const isStaffActive = staffQ.data?.staff && staffQ.data?.assignmentStatus === 'ACTIVE';

  if (staffQ.isError || !isStaffActive) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-8 bg-canvas"
        style={{ animation: 'fadeIn .25s ease' }}
      >
        <div className="w-full max-w-[460px] rounded-panel border border-line bg-surface p-8 text-center shadow-subtle">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <IconAlertTriangle size={24} />
          </div>
          <h2 className="mb-2 text-[18px] font-bold text-ink">Chưa được phân công tại trạm</h2>
          <p className="mb-6 text-[13px] leading-relaxed text-muted">
            Tài khoản <span className="font-semibold text-ink">{user?.email}</span> hiện không có nhiệm vụ phân công nhân viên đang hoạt động tại bất kỳ trạm sạc nào.
            Nếu bạn là nhân viên mới hoặc bị thu hồi quyền, vui lòng liên hệ Chủ trạm của bạn.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => (window.location.href = '/driver-notice')}>
              Về trang thông báo
            </Button>
            <Button variant="secondary" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
