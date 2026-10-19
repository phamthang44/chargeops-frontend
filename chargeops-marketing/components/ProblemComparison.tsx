import { PhoneFrame } from "./PhoneFrame";
import { CheckIcon, BoltIcon, CalendarIcon, RefundIcon, ShieldCheckIcon } from "./Icons";
import { Reveal } from "./Reveal";

export function ProblemComparison() {
  return (
    <section className="py-24 sm:py-32 overflow-hidden">
      <div className="container-x">
        {/* Section Header */}
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> DÀNH CHO TÀI XẾ XE ĐIỆN
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-heading sm:text-4xl lg:text-5xl">
            Chủ động tìm trạm và chọn khung giờ sạc
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-body leading-relaxed">
            ChargeOps giúp bạn xem thông tin trạm, chọn khung giờ và theo dõi đặt chỗ trong cùng một ứng dụng.
          </p>
        </Reveal>

        {/* Asymmetrical Comparison Board */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Traditional Frustrations (5 cols) */}
          <Reveal delay={80} className="lg:col-span-5 flex">
            <div className="w-full rounded-[2rem] border border-black/10 bg-[#F7F8F8] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-danger text-xs font-bold">
                    ✕
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-danger">
                    Khi chưa có kế hoạch trước
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink-heading">
                  Khó chủ động thời gian sạc
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Tình trạng chỗ trống và cách đặt chỗ có thể khác nhau ở từng trạm.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      title: "Khó biết thông tin trước khi đi",
                      desc: "Thông tin vị trí, cổng sạc và khung giờ có thể nằm ở nhiều nơi khác nhau.",
                    },
                    {
                      title: "Khó sắp xếp lịch sạc",
                      desc: "Nếu không đặt trước được, bạn có thể cần linh hoạt thời gian khi tới trạm.",
                    },
                    {
                      title: "Cần xem kỹ giá và điều kiện",
                      desc: "Mỗi trạm có thể áp dụng giá và quy định sử dụng khác nhau.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-black/5 bg-white/70 p-3.5">
                      <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                        <span>•</span> {item.title}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/5 text-center text-xs text-ink-muted font-medium">
                Một nơi để xem thông tin trước khi tới trạm
              </div>
            </div>
          </Reveal>

          {/* ChargeOps Peace of Mind (7 cols) */}
          <Reveal delay={140} className="lg:col-span-7 flex">
            <div className="double-bezel w-full flex flex-col justify-between">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-7 sm:!p-9 border-primary/20">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="pill bg-primary text-white font-bold shadow-glow-emerald">
                      <CheckIcon className="h-3 w-3" /> Các công cụ hiện có
                    </span>
                    <span className="text-xs font-mono font-bold text-primary-dark">TÌM · ĐẶT · THEO DÕI</span>
                  </div>

                  <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold text-ink-heading">
                    Theo dõi kế hoạch sạc rõ ràng hơn
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-ink-body leading-relaxed">
                    ChargeOps hỗ trợ tìm trạm, đặt gói thời gian và xem trạng thái đặt chỗ. Tình trạng thực tế vẫn phụ thuộc vào trạm và thiết bị.
                  </p>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        icon: CalendarIcon,
                        title: "Chọn khung giờ sạc",
                        desc: "Xem khung giờ và giá được hiển thị trước khi xác nhận đặt chỗ.",
                      },
                      {
                        icon: BoltIcon,
                        title: "Xem giá gói trước khi đặt",
                        desc: "Giá gói được hiển thị trong quy trình đặt chỗ; khoản thanh toán hiện được mô phỏng.",
                      },
                      {
                        icon: RefundIcon,
                        title: "Xem khoản hoàn trước khi hủy",
                        desc: "Với đặt chỗ đủ điều kiện, ứng dụng hiển thị khoản hoàn để bạn xác nhận. Kết quả hoàn hiện được mô phỏng.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-3.5 rounded-2xl border border-primary/15 bg-primary-soft/30 p-4 transition-all hover:bg-primary-soft/50 hover:border-primary/30"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-ink-heading">{item.title}</p>
                          <p className="text-xs text-ink-body mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-dark">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>Thông tin và trạng thái đặt chỗ trong một nơi</span>
                  </div>
                  <a href="#tai-ung-dung" className="btn-island-primary text-xs py-2 pl-4 pr-1.5">
                    <span>Trải nghiệm ngay</span>
                    <span className="btn-icon-bubble !h-7 !w-7">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
