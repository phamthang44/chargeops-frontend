import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconChevronDown } from '@chargeops/ui';

export function getDriverAppUrl(): string {
  const custom = import.meta.env.VITE_DRIVER_APP_URL?.trim();
  if (custom) return custom;
  const dev = import.meta.env.VITE_DRIVER_APP_URL_DEV?.trim();
  if (dev) return dev;
  return 'http://localhost:8082';
}

interface PlatformItem {
  id: 'admin' | 'owner' | 'driver' | 'simulator';
  title: string;
  subtitle: string;
  badge?: string;
  icon: string;
  type: 'route' | 'external';
  target: string;
  colorClass: string;
  bgClass: string;
}

export function PlatformSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const driverUrl = getDriverAppUrl();
  const isDemo = import.meta.env.MODE === 'demo';

  const isCurrentAdmin = location.pathname.startsWith('/admin');
  const isCurrentOwner = location.pathname.startsWith('/owner');
  const isCurrentStaff = location.pathname.startsWith('/staff');

  const currentLabel = isCurrentAdmin
    ? 'Quản trị viên'
    : isCurrentOwner
      ? 'Chủ trạm'
      : isCurrentStaff
        ? 'Nhân viên trạm'
        : 'Hệ thống';

  const currentIcon = isCurrentAdmin
    ? '👑'
    : isCurrentOwner
      ? '🏢'
      : isCurrentStaff
        ? '🧑‍💼'
        : '⚡';

  const currentBadgeTone = isCurrentAdmin
    ? 'bg-brand-soft text-brand border-brand-tint'
    : isCurrentOwner
      ? 'bg-owner-soft text-owner-deep border-owner-border'
      : 'bg-chip text-body border-line-2';

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const PLATFORMS: PlatformItem[] = [
    {
      id: 'admin',
      title: 'Quản trị hệ thống (Admin Platform)',
      subtitle: 'Duyệt trạm, quản lý giấy phép, giám sát & tài khoản toàn sàn',
      icon: '👑',
      type: 'route',
      target: '/admin',
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    },
    {
      id: 'owner',
      title: 'Chủ trạm sạc (Owner Portal)',
      subtitle: 'Vận hành trạm, cài đặt giá TOU, lịch mở cửa & doanh thu',
      icon: '🏢',
      type: 'route',
      target: '/owner',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    },
    {
      id: 'driver',
      title: 'Ứng dụng Tài xế (Driver Mobile)',
      subtitle: 'Tìm trạm sạc, bản đồ trực quan, đặt chỗ & theo dõi phiên sạc',
      icon: '🚗',
      type: 'external',
      target: driverUrl,
      badge: isDemo ? 'Tailscale' : 'DEV',
      colorClass: 'text-sky-600 dark:text-sky-400',
      bgClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
    },
    {
      id: 'simulator',
      title: 'Bộ mô phỏng trụ sạc (Simulator)',
      subtitle: 'Giả lập cắm sạc xe điện, đồng hồ điện tử & kiểm thử OCPP',
      icon: '⚡',
      type: 'external',
      target: '/simulator',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    },
  ];

  const handleSelect = (item: PlatformItem) => {
    setOpen(false);
    if (item.type === 'route') {
      navigate(item.target);
    } else {
      window.open(item.target, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-all duration-150 hover:shadow-xs cursor-pointer ${currentBadgeTone}`}
        title="Bấm để chuyển đổi góc nhìn nền tảng"
        aria-expanded={open}
      >
        <span className="text-[13px] leading-none">{currentIcon}</span>
        <span className="font-medium text-ink hidden lg:inline">Góc nhìn:</span>
        <span className="font-bold">{currentLabel}</span>
        <IconChevronDown
          size={12}
          strokeWidth={2.4}
          className={`text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-88 origin-top-right overflow-hidden rounded-panel border border-line-2 bg-surface p-2 shadow-[0_16px_36px_rgba(16,17,26,0.15)] backdrop-blur-md"
          style={{ animation: 'popIn .12s ease-out' }}
        >
          {/* Header */}
          <div className="px-2.5 pt-2 pb-2.5 border-b border-line-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Chuyển đổi góc nhìn
              </span>
              <span className="rounded-[4px] bg-chip px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-faint">
                {isDemo ? 'DEMO MODE' : 'DEV MODE'}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-body">
              Chuyển nhanh góc nhìn tại localhost:5173 hoặc mở app tài xế
            </p>
          </div>

          {/* Platform List */}
          <div className="py-1.5 space-y-1">
            {PLATFORMS.map((item) => {
              const isCurrent =
                (item.id === 'admin' && isCurrentAdmin) ||
                (item.id === 'owner' && isCurrentOwner);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-start gap-2.5 rounded-ctl p-2 text-left transition-all duration-100 cursor-pointer ${
                    isCurrent
                      ? 'bg-canvas ring-1 ring-line-2'
                      : 'hover:bg-chip'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border text-[15px] ${item.bgClass}`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[12.5px] font-bold ${isCurrent ? 'text-ink' : 'text-body'}`}>
                        {item.title}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-good-soft text-good px-1.5 py-0.2 text-[9px] font-bold leading-tight">
                          Đang xem
                        </span>
                      )}
                      {item.type === 'external' && (
                        <span className="text-[10px] font-mono text-muted">↗</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-[1.35] text-muted mt-0.5 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Target Info */}
          <div className="mt-1 pt-2 border-t border-line-3 px-2.5 py-1.5 bg-canvas/60 rounded-b-md flex items-center justify-between text-[10.5px] text-muted">
            <span className="truncate">Driver: <span className="font-mono text-ink">{driverUrl}</span></span>
            <span className="shrink-0 text-faint ml-2">port 8082</span>
          </div>
        </div>
      )}
    </div>
  );
}
