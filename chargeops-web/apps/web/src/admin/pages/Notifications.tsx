import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  NotificationCenter,
  NotificationToastStack,
  NotificationItem,
  IconBell,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconClipboardCheck,
} from '@chargeops/ui';

export function Notifications() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  const initialItems = useMemo<NotificationItem[]>(
    () => [
      {
        id: 'admin-notif-1',
        title: t('notifications.mock.item1.title', 'Hồ sơ đăng ký trạm mới ST-1018 (Trạm Cầu Giấy)'),
        subtitle: t(
          'notifications.mock.item1.subtitle',
          'Chủ trạm Phạm Đức Thắng vừa gửi hồ sơ 4 trụ sạc kèm Giấy phép kinh doanh & PCCC.'
        ),
        time: t('notifications.mock.item1.time', '5 phút trước'),
        tone: 'warn',
        category: 'system',
        read: false,
        stationName: 'Trạm Cầu Giấy (Hà Nội)',
        badge: t('notifications.mock.item1.badge', 'Chờ duyệt'),
        actionLabel: t('notifications.mock.item1.action', 'Xem & Phê duyệt ngay'),
        onSelect: () => {},
      },
      {
        id: 'admin-notif-2',
        title: t('notifications.mock.item2.title', 'Cảnh báo quá nhiệt trụ sạc DC 120kW #CHG-02'),
        subtitle: t(
          'notifications.mock.item2.subtitle',
          'Nhiệt độ đầu súng CCS2 tại Trạm Hà Đông vượt ngưỡng 68°C. Hệ thống đã tự động giới hạn dòng sạc.'
        ),
        time: t('notifications.mock.item2.time', '12 phút trước'),
        tone: 'bad',
        category: 'alert',
        read: false,
        stationName: 'Trạm Hà Đông (Hà Nội)',
        chargerId: 'CHG-02',
        metrics: {
          temperature: '68°C',
          powerKw: 30,
          voltage: '400V',
        },
        actionLabel: t('notifications.mock.item2.action', 'Kiểm tra cấp trụ'),
        onSelect: () => {},
      },
      {
        id: 'admin-notif-3',
        title: t('notifications.mock.item3.title', 'Giấy phép vận hành trạm sắp hết hạn (3 trạm)'),
        subtitle: t(
          'notifications.mock.item3.subtitle',
          'Các trạm sạc tại Nam Từ Liêm, Quận 7 và Hải Châu sẽ hết hạn gói License trong 7 ngày tới.'
        ),
        time: t('notifications.mock.item3.time', '45 phút trước'),
        tone: 'warn',
        category: 'system',
        read: false,
        badge: t('notifications.mock.item3.badge', 'Giấy phép'),
        actionLabel: t('notifications.mock.item3.action', 'Quản lý Giấy phép'),
        onSelect: () => {},
      },
      {
        id: 'admin-notif-4',
        title: t('notifications.mock.item4.title', 'Vé hỗ trợ sự cố khẩn cấp #TK-802 từ tài xế'),
        subtitle: t(
          'notifications.mock.item4.subtitle',
          'Tài xế báo lỗi không thể rút đầu sạc tại Trạm Thủ Đức sau khi phiên sạc kết thúc.'
        ),
        time: t('notifications.mock.item4.time', '1 giờ trước'),
        tone: 'bad',
        category: 'ticket',
        read: true,
        stationName: 'Trạm Thủ Đức (TP.HCM)',
        chargerId: 'CHG-05',
        badge: t('notifications.mock.item4.badge', 'Ưu tiên cao'),
        actionLabel: t('notifications.mock.item4.action', 'Điều phối hỗ trợ'),
        onSelect: () => {},
      },
      {
        id: 'admin-notif-5',
        title: t('notifications.mock.item5.title', 'Cập nhật Kho chính sách (Policy RAG) hoàn tất'),
        subtitle: t(
          'notifications.mock.item5.subtitle',
          'Tài liệu quy định hủy đặt chỗ và phạt chiếm dụng trụ sạc đã được tái tạo embedding thành công.'
        ),
        time: t('notifications.mock.item5.time', '2 giờ trước'),
        tone: 'good',
        category: 'system',
        read: true,
        badge: t('notifications.mock.item5.badge', 'Tri thức RAG'),
        actionLabel: t('notifications.mock.item5.action', 'Xem kho chính sách'),
        onSelect: () => {},
      },
    ],
    [t]
  );

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  // Keep items in sync with initialItems if not mutated yet
  const displayItems = items.length > 0 ? items : initialItems;

  // Trigger simulated live event
  const triggerSimulation = (type: 'station' | 'overheat' | 'ticket' | 'license') => {
    const id = `sim-${Date.now()}`;
    let newNotif: NotificationItem;

    if (type === 'station') {
      newNotif = {
        id,
        title: t('notifications.sim.stationTitle', '📋 Hồ sơ đăng ký trạm mới ST-1020'),
        subtitle: t(
          'notifications.sim.stationSubtitle',
          'Chủ trạm vừa hoàn tất gửi hồ sơ đăng ký trạm sạc tại TP. Đà Nẵng.'
        ),
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
        title: t('notifications.sim.overheatTitle', '🔥 BÁO ĐỘNG: Quá nhiệt Trụ #CHG-08 (74°C)'),
        subtitle: t(
          'notifications.sim.overheatSubtitle',
          'Trạm Tân Bình báo động nhiệt độ cao bất thường. Đề nghị ngắt điện kiểm tra!'
        ),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'bad',
        category: 'alert',
        read: false,
        stationName: 'Trạm Tân Bình',
        chargerId: 'CHG-08',
        metrics: { temperature: '74°C', powerKw: 0 },
        actionLabel: t('notifications.sim.checkTech', 'Kiểm tra kỹ thuật'),
        onSelect: () => navigate('/admin/provisioning'),
        onAction: () => navigate('/admin/provisioning'),
      };
    } else if (type === 'ticket') {
      newNotif = {
        id,
        title: t('notifications.sim.ticketTitle', '🎟️ Khiếu nại tài xế cần hỗ trợ #TK-9944'),
        subtitle: t(
          'notifications.sim.ticketSubtitle',
          'Tài xế VinFast VF9 cần mở khóa trụ sạc khẩn cấp tại Trạm Cầu Giấy.'
        ),
        time: t('notifications.sim.justNow', 'Vừa xong'),
        tone: 'warn',
        category: 'ticket',
        read: false,
        stationName: 'Trạm Cầu Giấy',
        badge: t('notifications.sim.urgent', 'Khẩn cấp'),
        actionLabel: t('notifications.sim.openTicket', 'Mở chi tiết vé'),
        onSelect: () => navigate('/admin/tickets'),
        onAction: () => navigate('/admin/tickets'),
      };
    } else {
      newNotif = {
        id,
        title: t('notifications.sim.licenseTitle', '🛡️ Giấy phép trạm sạc đã hết hạn'),
        subtitle: t(
          'notifications.sim.licenseSubtitle',
          'Gói License của Trạm Nam Từ Liêm đã hết hạn sử dụng. Trạm đã tự ngắt nhận đặt chỗ.'
        ),
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

    setItems((prev) => [newNotif, ...(prev.length > 0 ? prev : initialItems)]);
    setToasts((prev) => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setItems((prev) =>
      (prev.length > 0 ? prev : initialItems).map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setItems((prev) => (prev.length > 0 ? prev : initialItems).map((item) => ({ ...item, read: true })));
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => (prev.length > 0 ? prev : initialItems).filter((item) => item.id !== id));
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Wire navigation for items
  const wiredItems: NotificationItem[] = displayItems.map((item) => {
    if (item.category === 'ticket') {
      return {
        ...item,
        onSelect: () => navigate('/admin/tickets'),
        onAction: () => navigate('/admin/tickets'),
      };
    }
    if (item.category === 'system' && item.badge === t('notifications.mock.item1.badge', 'Chờ duyệt')) {
      return {
        ...item,
        onSelect: () => navigate('/admin/approvals'),
        onAction: () => navigate('/admin/approvals'),
      };
    }
    if (item.badge === t('notifications.mock.item3.badge', 'Giấy phép') || item.badge === t('notifications.items.expiredLicenses.badge', 'Hết hạn')) {
      return {
        ...item,
        onSelect: () => navigate('/admin/licenses'),
        onAction: () => navigate('/admin/licenses'),
      };
    }
    if (item.category === 'alert') {
      return {
        ...item,
        onSelect: () => navigate('/admin/provisioning'),
        onAction: () => navigate('/admin/provisioning'),
      };
    }
    return {
      ...item,
      onSelect: () => navigate('/admin/kb'),
      onAction: () => navigate('/admin/kb'),
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Toast Notification Stack for real-time alerts */}
      <NotificationToastStack toasts={toasts} onDismiss={handleDismissToast} />

      {/* Hero / Header Card */}
      <div className="relative overflow-hidden rounded-[16px] border border-line bg-gradient-to-br from-surface to-surface-2 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
              <IconBell size={13} className="animate-bounce" />
              <span>{t('notifications.hub.badge', 'HỆ THỐNG GIÁM SÁT TOÀN NỀN TẢNG')}</span>
            </div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-ink">
              {t('notifications.hub.title', 'Trung tâm Thông báo & Cảnh báo Admin')}
            </h1>
            <p className="max-w-2xl text-[13px] text-muted">
              {t(
                'notifications.hub.subtitle',
                'Theo dõi sự cố kỹ thuật theo thời gian thực, hồ sơ đăng ký trạm chờ duyệt, trạng thái giấy phép và vé hỗ trợ khẩn cấp.'
              )}
            </p>
          </div>

          {/* Real-time simulation toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-line-2 bg-surface p-2 shadow-xs">
            <div className="px-2 text-[10.5px] font-bold uppercase tracking-wider text-faint">
              {t('notifications.hub.simulateLabel', 'Mô phỏng sự kiện:')}
            </div>
            <button
              onClick={() => triggerSimulation('station')}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-brand/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand transition hover:bg-brand/20"
            >
              <IconClipboardCheck size={13} />
              <span>{t('notifications.hub.simStation', '+ Đăng ký trạm')}</span>
            </button>
            <button
              onClick={() => triggerSimulation('overheat')}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-bad-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-bad-deep transition hover:bg-bad-soft/80"
            >
              <IconAlertTriangle size={13} />
              <span>{t('notifications.hub.simOverheat', '+ Quá nhiệt')}</span>
            </button>
            <button
              onClick={() => triggerSimulation('ticket')}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-warn-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-warn-deep transition hover:bg-warn-soft/80"
            >
              <IconLifebuoy size={13} />
              <span>{t('notifications.hub.simTicket', '+ Ticket')}</span>
            </button>
            <button
              onClick={() => triggerSimulation('license')}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-muted transition hover:bg-surface-3"
            >
              <IconShield size={13} />
              <span>{t('notifications.hub.simLicense', '+ Hết hạn License')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Notification Center Hub */}
      <NotificationCenter
        items={wiredItems}
        onMarkRead={handleMarkAsRead}
        onMarkAllRead={handleMarkAllAsRead}
        onDismiss={handleDismiss}
      />
    </div>
  );
}

