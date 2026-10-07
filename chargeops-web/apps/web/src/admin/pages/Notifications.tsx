import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  NotificationCenter,
  NotificationToastStack,
  type NotificationItem,
  IconBell,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconClipboardCheck,
} from '@chargeops/ui';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../shared/notifications/useNotifications';
import { resolveNotificationI18n, type AppNotification } from '@chargeops/api';

export function Notifications() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<AppNotification[]>([]);
  const [derivedItems, setDerivedItems] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  const params = useMemo(
    () => ({
      context: 'admin',
      page,
      size: 20,
    }),
    [page],
  );

  const { items: serverNotifs = [], meta, isLoading, isFetching } = useNotifications(params);
  const markAsRead = useMarkAsRead({ context: 'admin' });
  const markAllAsRead = useMarkAllAsRead({ context: 'admin' });
  const dismiss = useDeleteNotification({ context: 'admin' });

  // Accumulate items for pagination
  useEffect(() => {
    if (serverNotifs.length > 0) {
      setAccumulatedItems((prev) => {
        if (page === 1) return serverNotifs;
        const existingIds = new Set(prev.map((i) => i.id));
        const nextItems = serverNotifs.filter((i) => !existingIds.has(i.id));
        return [...prev, ...nextItems];
      });
    } else if (page === 1) {
      setAccumulatedItems([]);
    }
  }, [serverNotifs, page]);

  // Dev simulation only for testing/staging
  const triggerSimulation = (type: 'station' | 'overheat' | 'ticket' | 'license') => {
    const id = `sim-${Date.now()}`;
    let newNotif: NotificationItem;

    if (type === 'station') {
      newNotif = {
        id,
        source: 'derived',
        title: t('notifications.sim.stationTitle', '📋 Hồ sơ đăng ký trạm mới ST-1020'),
        subtitle: t('notifications.sim.stationSubtitle', 'Chủ trạm vừa hoàn tất gửi hồ sơ đăng ký trạm sạc tại TP. Đà Nẵng.'),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'warn',
        category: 'system',
        read: false,
        stationName: 'Trạm Hải Châu (Đà Nẵng)',
        badge: t('notifications.items.pendingStations.badge', 'Chờ duyệt'),
        actionLabel: t('notifications.sim.reviewNow', 'Xét duyệt ngay'),
        onSelect: () => navigate('/admin/approvals'),
        onAction: () => navigate('/admin/approvals'),
      };
    } else if (type === 'overheat') {
      newNotif = {
        id,
        source: 'derived',
        title: t('notifications.sim.overheatTitle', '🔥 BÁO ĐỘNG: Quá nhiệt Trụ #CHG-08 (74°C)'),
        subtitle: t('notifications.sim.overheatSubtitle', 'Cảm biến nhiệt độ cổng sạc CCS2 tại Trạm Cầu Giấy báo động vượt ngưỡng.'),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'bad',
        category: 'alert',
        read: false,
        stationName: 'Trạm Cầu Giấy (Hà Nội)',
        chargerId: 'CHG-08',
        metrics: { temperature: '74°C', powerKw: 60, voltage: '420V' },
        badge: t('notifications.sim.urgent', 'Khẩn cấp'),
        actionLabel: t('notifications.sim.checkTech', 'Kiểm tra kỹ thuật'),
        onSelect: () => navigate('/admin/provisioning'),
        onAction: () => navigate('/admin/provisioning'),
      };
    } else if (type === 'ticket') {
      newNotif = {
        id,
        source: 'derived',
        title: t('notifications.sim.ticketTitle', '🎟️ Khiếu nại tài xế cần hỗ trợ #TK-9944'),
        subtitle: t('notifications.sim.ticketSubtitle', 'Tài xế yêu cầu hỗ trợ sự cố trừ tiền sai nhưng không thể bắt đầu sạc.'),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'warn',
        category: 'ticket',
        read: false,
        stationName: 'Trạm Hà Đông (Hà Nội)',
        chargerId: 'CHG-01',
        badge: t('notifications.sim.urgent', 'Khẩn cấp'),
        actionLabel: t('notifications.sim.openTicket', 'Mở chi tiết vé'),
        onSelect: () => navigate('/admin/tickets'),
        onAction: () => navigate('/admin/tickets'),
      };
    } else {
      newNotif = {
        id,
        source: 'derived',
        title: t('notifications.sim.licenseTitle', '🛡️ Giấy phép trạm sạc đã hết hạn'),
        subtitle: t('notifications.sim.licenseSubtitle', 'Gói License của Trạm Nam Từ Liêm đã hết hạn sử dụng. Trạm đã tự ngắt nhận đặt chỗ.'),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'bad',
        category: 'system',
        read: false,
        stationName: 'Trạm Nam Từ Liêm',
        badge: t('notifications.items.expiredLicenses.badge', 'Hết hạn'),
        actionLabel: t('notifications.sim.viewLicenses', 'Xem danh sách Giấy phép'),
        onSelect: () => navigate('/admin/licenses'),
        onAction: () => navigate('/admin/licenses'),
      };
    }

    setDerivedItems((prev) => [newNotif, ...prev]);
    setToasts((prev) => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    if (id.startsWith('sim-')) {
      setDerivedItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      return;
    }
    markAsRead.mutate(id);
    setAccumulatedItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
    setDerivedItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setAccumulatedItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleDismiss = (id: string) => {
    if (id.startsWith('sim-')) {
      setDerivedItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    dismiss.mutate(id);
    setAccumulatedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const mappedPersistedItems = useMemo<NotificationItem[]>(() => {
    const list = page === 1 ? serverNotifs : accumulatedItems;
    return list.map((n) => {
      let displayTime = n.time;
      if (!displayTime && n.createdAt) {
        try {
          const diffMs = Date.now() - new Date(n.createdAt).getTime();
          const diffMins = Math.floor(diffMs / 60_000);
          if (diffMins < 1) displayTime = 'Vừa xong';
          else if (diffMins < 60) displayTime = `${diffMins} phút trước`;
          else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) displayTime = `${diffHours} giờ trước`;
            else displayTime = `${Math.floor(diffHours / 24)} ngày trước`;
          }
        } catch {
          displayTime = undefined;
        }
      }

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`/admin${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_CASE' && n.target.escalationId) {
          navigate(`/admin/tickets?escalationId=${n.target.escalationId}`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`/admin/tickets/${n.target.ticketId}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`/admin/stations`);
        } else if (n.target?.type === 'OPEN_REFUND') {
          navigate(`/admin/tickets`);
        } else if (n.category === 'ticket') {
          navigate('/admin/tickets');
        } else {
          navigate('/admin/dashboard');
        }
      };

      return {
        id: n.id,
        source: 'persisted',
        title: resolveNotificationI18n(n.title, t),
        subtitle: resolveNotificationI18n(n.subtitle, t),
        body: resolveNotificationI18n(n.body, t),
        time: displayTime,
        tone: n.tone ?? n.severity,
        read: n.read,
        category: n.category,
        stationName: n.stationName,
        chargerId: n.chargerId,
        metrics: n.metrics,
        badge: n.badge,
        actionLabel: n.actionLabel || n.primaryAction?.label,
        onSelect: navigateToTarget,
        onAction: navigateToTarget,
      };
    });
  }, [page, serverNotifs, accumulatedItems, navigate, t]);

  const allDisplayItems = useMemo(
    () => [...derivedItems, ...mappedPersistedItems],
    [derivedItems, mappedPersistedItems],
  );

  const hasMore = Boolean(meta?.hasNextPage);

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <NotificationToastStack toasts={toasts} onDismiss={handleDismissToast} />

      {/* Hero / Header Card */}
      <div className="relative overflow-hidden rounded-[16px] border border-line bg-gradient-to-br from-surface to-surface-2 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
              <IconBell size={13} className="animate-bounce" />
              <span>{t('notifications.hub.badge', 'HỆ THỐNG THÔNG BÁO & CẢNH BÁO ADMIN')}</span>
            </div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">
              {t('notifications.hub.title', 'Trung tâm Thông báo & Cảnh báo Admin')}
            </h1>
            <p className="max-w-2xl text-[13px] text-muted">
              {t(
                'notifications.hub.subtitle',
                'Theo dõi sự cố kỹ thuật theo thời gian thực, hồ sơ đăng ký trạm chờ duyệt, trạng thái giấy phép và vé hỗ trợ khẩn cấp.',
              )}
            </p>
          </div>

          {/* Dev-only simulation toolbar */}
          {import.meta.env.DEV && (
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-line-2 bg-surface p-2 shadow-xs">
              <div className="px-2 text-[10.5px] font-bold uppercase tracking-wider text-faint">
                {t('notifications.hub.simulateLabel', 'Mô phỏng sự kiện (Dev):')}
              </div>
              <button
                type="button"
                onClick={() => triggerSimulation('station')}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-brand/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand transition hover:bg-brand/20"
              >
                <IconClipboardCheck size={13} />
                <span>{t('notifications.hub.simStation', '+ Đăng ký trạm')}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('overheat')}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-bad-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-bad-deep transition hover:bg-bad-soft/80"
              >
                <IconAlertTriangle size={13} />
                <span>{t('notifications.hub.simOverheat', '+ Quá nhiệt')}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('ticket')}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-warn-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-warn-deep transition hover:bg-warn-soft/80"
              >
                <IconLifebuoy size={13} />
                <span>{t('notifications.hub.simTicket', '+ Ticket')}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('license')}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-muted transition hover:bg-surface-3"
              >
                <IconShield size={13} />
                <span>{t('notifications.hub.simLicense', '+ Hết hạn License')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Notification Center Hub */}
      <NotificationCenter
        items={allDisplayItems}
        onMarkRead={handleMarkAsRead}
        onMarkAllRead={handleMarkAllAsRead}
        onDismiss={handleDismiss}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isFetching && page > 1}
      />
    </div>
  );
}
