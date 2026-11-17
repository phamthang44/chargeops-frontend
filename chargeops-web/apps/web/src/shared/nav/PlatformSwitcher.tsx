import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBolt, IconChevronDown, IconHome, IconPhone, IconShield, IconUsers } from '@chargeops/ui';

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
  icon: ReactNode;
  type: 'route' | 'external';
  target: string;
  colorClass: string;
  bgClass: string;
}

export function PlatformSwitcher() {
  const { t } = useTranslation('common');
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
    ? t('platformSwitcher.roles.admin', 'Quản trị viên')
    : isCurrentOwner
      ? t('platformSwitcher.roles.owner', 'Chủ trạm')
      : isCurrentStaff
        ? t('platformSwitcher.roles.staff', 'Nhân viên trạm')
        : t('platformSwitcher.roles.system', 'Hệ thống');

  const currentIcon = isCurrentAdmin ? (
    <IconShield size={14} />
  ) : isCurrentOwner ? (
    <IconHome size={14} />
  ) : isCurrentStaff ? (
    <IconUsers size={14} />
  ) : (
    <IconBolt size={14} />
  );

  // Neutral like every other header control; the sidebar already carries the console accent.
  const currentBadgeTone = 'border-line bg-surface text-ink hover:border-line-hover hover:bg-canvas';

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
      title: t('platformSwitcher.platforms.admin.title', 'Quản trị hệ thống (Admin Platform)'),
      subtitle: t('platformSwitcher.platforms.admin.subtitle', 'Duyệt trạm, quản lý giấy phép, giám sát & tài khoản toàn sàn'),
      icon: <IconShield size={16} />,
      type: 'route',
      target: '/admin',
      colorClass: 'text-body',
      bgClass: 'border-line bg-canvas text-body',
    },
    {
      id: 'owner',
      title: t('platformSwitcher.platforms.owner.title', 'Chủ trạm sạc (Owner Portal)'),
      subtitle: t('platformSwitcher.platforms.owner.subtitle', 'Vận hành trạm, cài đặt giá TOU, lịch mở cửa & doanh thu'),
      icon: <IconHome size={16} />,
      type: 'route',
      target: '/owner',
      colorClass: 'text-body',
      bgClass: 'border-line bg-canvas text-body',
    },
    {
      id: 'driver',
      title: t('platformSwitcher.platforms.driver.title', 'Ứng dụng Tài xế (Driver Mobile)'),
      subtitle: t('platformSwitcher.platforms.driver.subtitle', 'Tìm trạm sạc, bản đồ trực quan, đặt chỗ & theo dõi phiên sạc'),
      icon: <IconPhone size={16} />,
      type: 'external',
      target: driverUrl,
      badge: isDemo ? 'Tailscale' : 'DEV',
      colorClass: 'text-body',
      bgClass: 'border-line bg-canvas text-body',
    },
    {
      id: 'simulator',
      title: t('platformSwitcher.platforms.simulator.title', 'Bộ mô phỏng trụ sạc (Simulator)'),
      subtitle: t('platformSwitcher.platforms.simulator.subtitle', 'Giả lập cắm sạc xe điện, đồng hồ điện tử & kiểm thử OCPP'),
      icon: <IconBolt size={16} />,
      type: 'external',
      target: '/simulator',
      colorClass: 'text-body',
      bgClass: 'border-line bg-canvas text-body',
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
    <div ref={ref} className="relative hidden min-w-0 lg:block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group flex max-w-full items-center gap-1.5 rounded-ctl border px-2.5 py-[5px] text-[12.5px] font-medium transition-colors duration-150 cursor-pointer ${currentBadgeTone}`}
        title={t('platformSwitcher.triggerTitle', 'Bấm để chuyển đổi góc nhìn nền tảng')}
        aria-label={t('platformSwitcher.triggerAria', { label: currentLabel, defaultValue: `Góc nhìn: ${currentLabel}` })}
        aria-expanded={open}
      >
        <span className="shrink-0 text-muted">{currentIcon}</span>
        <span className="hidden shrink-0 text-muted xl:inline">
          {t('platformSwitcher.viewLabel', 'Góc nhìn:')}
        </span>
        <span className="min-w-0 max-w-[112px] truncate font-semibold">{currentLabel}</span>
        <IconChevronDown
          size={12}
          strokeWidth={2.4}
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-88 origin-top-right overflow-hidden rounded-panel border border-line bg-surface p-2 shadow-[0_16px_36px_rgba(16,17,26,0.15)] backdrop-blur-md"
          style={{ animation: 'popIn .12s ease-out' }}
        >
          {/* Header */}
          <div className="px-2.5 pt-2 pb-2.5 border-b border-line">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted">
                {t('platformSwitcher.popoverTitle', 'Chuyển đổi góc nhìn')}
              </span>
              <span className="rounded-[4px] bg-chip px-1.5 py-0.5 text-[11px] tabular-nums font-medium text-faint">
                {isDemo ? 'DEMO MODE' : 'DEV MODE'}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-body">
              {t('platformSwitcher.popoverSubtitle', 'Chuyển nhanh góc nhìn tại localhost:5173 hoặc mở app tài xế')}
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
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border ${item.bgClass}`}
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
                          {t('platformSwitcher.activeBadge', 'Đang xem')}
                        </span>
                      )}
                      {item.type === 'external' && (
                        <span className="text-[11.5px] tabular-nums text-muted">↗</span>
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
          <div className="mt-1 pt-2 border-t border-line px-2.5 py-1.5 bg-canvas/60 rounded-b-md flex items-center justify-between text-[10.5px] text-muted">
            <span className="truncate">Driver: <span className="tabular-nums text-ink">{driverUrl}</span></span>
            <span className="shrink-0 text-faint ml-2">port 8082</span>
          </div>
        </div>
      )}
    </div>
  );
}
