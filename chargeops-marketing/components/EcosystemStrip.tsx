import { BoltIcon } from "./Icons";

export function EcosystemStrip() {
  const steps = ["Tìm trạm", "Chọn khung giờ", "Check-in bằng QR", "Theo dõi đặt chỗ"];

  return (
    <section className="border-y border-black/[0.06] bg-[#FAFBFB] py-8 sm:py-10">
      <div className="container-x flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
            <BoltIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-heading">Một quy trình gọn trong ứng dụng</p>
            <p className="text-[11px] text-ink-muted">Tính năng hiện có của ChargeOps</p>
          </div>
        </div>
        <ol className="flex flex-wrap gap-2 text-xs font-semibold text-ink-body">
          {steps.map((step, index) => (
            <li key={step} className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2">
              <span className="font-mono text-primary-dark">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
