import { Card } from './Card';
import { IconWrench } from './icons';

/** Placeholder for screens not yet ported from the design. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="p-14 text-center">
      <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-panel bg-chip">
        <IconWrench size={26} strokeWidth={2} className="text-faint" />
      </div>
      <div className="text-[16px] font-semibold">{title}</div>
      <div className="mt-[5px] text-[13px] text-muted">
        Màn hình này sẽ được chuyển từ bản thiết kế trong bước tiếp theo.
      </div>
    </Card>
  );
}
