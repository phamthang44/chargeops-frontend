import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Primary action button (indigo/emerald filled), e.g. "Đăng ký trạm mới". */
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-[22px] font-bold tracking-[-0.01em]">{title}</div>
        {subtitle && <div className="mt-[3px] text-[13.5px] text-muted">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
