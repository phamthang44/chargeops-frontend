import { useState } from 'react';
import {
  NotificationCenter,
  NotificationToastStack,
  NotificationItem,
  NotificationBell,
  IconBell,
  IconBolt,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconArrowRight,
  IconCheckCircle,
} from '@chargeops/ui';
import { useNavigate } from 'react-router-dom';

const INITIAL_MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Cảnh báo quá nhiệt Trụ sạc #CHG-02 (Cổng CCS2)',
    subtitle: 'Nhiệt độ đầu sạc vượt ngưỡng an toàn (68°C). Hệ thống đã tự động giảm công suất xuống 30 kW.',
    time: '2 phút trước',
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
    actionLabel: 'Xử lý sự cố ngay',
    onSelect: () => {},
  },
  {
    id: 'notif-2',
    title: 'Phiên sạc #CHG-9982 hoàn tất',
    subtitle: 'Tài xế Nguyễn Văn A (VinFast VF8 - 30H-889.12) vừa sạc xong 45.2 kWh.',
    time: '8 phút trước',
    tone: 'good',
    category: 'session',
    read: false,
    stationName: 'Trạm Hà Đông (Hà Nội)',
    chargerId: 'CHG-01',
    metrics: {
      progressPct: 100,
      powerKw: 120,
      amount: '+248.600đ',
    },
    actionLabel: 'Xem hóa đơn sạc',
    onSelect: () => {},
  },
  {
    id: 'notif-3',
    title: 'Phiên sạc đang diễn ra (Trụ #03)',
    subtitle: 'Đang nạp năng lượng cho xe Porsche Taycan (30G-771.88). Công suất đỉnh 180 kW.',
    time: '15 phút trước',
    tone: 'good',
    category: 'session',
    read: true,
    stationName: 'Trạm Cầu Giấy (Hà Nội)',
    chargerId: 'CHG-03',
    metrics: {
      progressPct: 68,
      powerKw: 180,
    },
    actionLabel: 'Theo dõi thời gian thực',
    onSelect: () => {},
  },
  {
    id: 'notif-4',
    title: 'Vé hỗ trợ mới #TK-4029 từ tài xế',
    subtitle: 'Tài xế báo lỗi không tự động nhả cáp sạc tại Trụ #04 sau khi đã thanh toán.',
    time: '32 phút trước',
    tone: 'warn',
    category: 'ticket',
    read: false,
    stationName: 'Trạm Hà Đông (Hà Nội)',
    chargerId: 'CHG-04',
    badge: 'Ưu tiên cao',
    actionLabel: 'Phản hồi vé ngay',
    onSelect: () => {},
  },
  {
    id: 'notif-5',
    title: 'Giấy phép vận hành trạm sạc sắp hết hạn',
    subtitle: 'Gói StationPro License của bạn còn 5 ngày sử dụng. Hãy gia hạn để tránh ngắt kết nối OCPP.',
    time: '1 giờ trước',
    tone: 'warn',
    category: 'system',
    read: true,
    badge: 'Hệ thống',
    actionLabel: 'Gia hạn gói License',
    onSelect: () => {},
  },
];

export function NotificationsShowcase() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_MOCK_NOTIFICATIONS);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [demoView, setDemoView] = useState<'center' | 'popover'>('center');

  // Trigger simulated live event
  const triggerSimulation = (type: 'overheat' | 'session' | 'ticket' | 'offline') => {
    const id = `sim-${Date.now()}`;
    let newNotif: NotificationItem;

    if (type === 'overheat') {
      newNotif = {
        id,
        title: '🔥 BÁO ĐỘNG: Quá nhiệt Trụ #CHG-05 (72°C)',
        subtitle: 'Trạm Mỹ Đình báo động nhiệt độ cao bất thường. Cần kiểm tra quạt tản nhiệt!',
        time: 'Vừa xong',
        tone: 'bad',
        category: 'alert',
        read: false,
        stationName: 'Trạm Mỹ Đình',
        chargerId: 'CHG-05',
        metrics: { temperature: '72°C', powerKw: 0 },
        actionLabel: 'Ngắt điện trụ khẩn cấp',
        onSelect: () => {},
      };
    } else if (type === 'session') {
      newNotif = {
        id,
        title: '⚡ Phiên sạc mới hoàn tất #CHG-9990',
        subtitle: 'Tài xế sạc thành công 38 kWh tại Trụ #01. Doanh thu vừa cộng +190.000đ',
        time: 'Vừa xong',
        tone: 'good',
        category: 'session',
        read: false,
        stationName: 'Trạm Hà Đông',
        chargerId: 'CHG-01',
        metrics: { progressPct: 100, powerKw: 90, amount: '+190.000đ' },
        actionLabel: 'Xem doanh thu',
        onSelect: () => {},
      };
    } else if (type === 'ticket') {
      newNotif = {
        id,
        title: '🎟️ Yêu cầu hỗ trợ mới #TK-9912',
        subtitle: 'Khách hàng yêu cầu hỗ trợ hướng dẫn sử dụng ứng dụng thanh toán QR.',
        time: 'Vừa xong',
        tone: 'warn',
        category: 'ticket',
        read: false,
        stationName: 'Trạm Cầu Giấy',
        badge: 'Cần phản hồi',
        actionLabel: 'Mở cửa sổ Chat',
        onSelect: () => {},
      };
    } else {
      newNotif = {
        id,
        title: '⚠️ Trầm ngắt kết nối mạng OCPP',
        subtitle: 'Mất tín hiệu kết nối Internet tại Trạm Nam Từ Liêm trong 3 phút qua.',
        time: 'Vừa xong',
        tone: 'bad',
        category: 'alert',
        read: false,
        stationName: 'Trạm Nam Từ Liêm',
        actionLabel: 'Kiểm tra tín hiệu',
        onSelect: () => {},
      };
    }

    // Add to items list and trigger floating slide-in toast
    setItems((prev) => [newNotif, ...prev]);
    setToasts((prev) => [newNotif, ...prev]);
  };

  const handleMarkRead = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearRead = () => {
    setItems((prev) => prev.filter((item) => !item.read));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Floating live toasts */}
      <NotificationToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Top Showcase Navigation Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line-2 pb-5">
        <div>
          <span className="rounded-full bg-brand/10 border border-brand/20 px-3 py-1 font-mono text-[10.5px] font-extrabold text-brand uppercase tracking-wider">
            UI/UX Showcase & Live Design
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">
            Giao Diện Thông Báo Hiện Đại (Modern Notification Experience)
          </h2>
          <p className="mt-1 text-[13.5px] font-medium text-muted">
            Trải nghiệm thiết kế thông báo đa tầng: Popover Dropdown, Inbox Grid & Toast thời gian thực.
          </p>
        </div>

        {/* View Toggle Mode */}
        <div className="flex items-center gap-2 rounded-xl border border-line-2 bg-surface p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setDemoView('center')}
            className={[
              'rounded-lg px-3.5 py-1.5 text-[12px] font-extrabold transition-all',
              demoView === 'center' ? 'bg-ink text-surface shadow-xs' : 'text-body hover:bg-chip',
            ].join(' ')}
          >
            📋 Trung tâm Thông báo (Full Inbox)
          </button>
          <button
            type="button"
            onClick={() => setDemoView('popover')}
            className={[
              'rounded-lg px-3.5 py-1.5 text-[12px] font-extrabold transition-all',
              demoView === 'popover' ? 'bg-ink text-surface shadow-xs' : 'text-body hover:bg-chip',
            ].join(' ')}
          >
            🔔 Chuông Dropdown (Header Bell)
          </button>
        </div>
      </div>

      {/* DEMO VIEW 1: FULL NOTIFICATION CENTER */}
      {demoView === 'center' && (
        <NotificationCenter
          items={items}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
          onClearRead={handleClearRead}
          onSimulateNotification={triggerSimulation}
        />
      )}

      {/* DEMO VIEW 2: POPOVER DROPDOWN INTERACTIVE PREVIEW */}
      {demoView === 'popover' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line-2 bg-surface p-6 shadow-sm max-w-xl mx-auto text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <IconBell size={24} />
            </div>
            <h3 className="mt-3 text-lg font-bold text-ink">Thử nghiệm Dropdown Popover trên Header</h3>
            <p className="mt-1 text-[13px] text-muted">
              Bấm vào chiếc chuông dưới đây để mở xem popover thông báo viền kép với bộ lọc tab và tìm kiếm.
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 py-4 bg-surface-2 rounded-xl border border-line/50">
              <span className="text-[12.5px] font-extrabold text-ink">Thanh Header mẫu:</span>
              <NotificationBell
                items={items}
                emptyLabel="Không có thông báo mới"
                onOpenCenter={() => setDemoView('center')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
