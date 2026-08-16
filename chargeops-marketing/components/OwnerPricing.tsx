import { CheckIcon, BoltIcon, StarIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";

export function OwnerPricing() {
  return (
    <section id="bang-gia-license" className="relative overflow-hidden py-16 sm:py-24 bg-surface">
      <div className="container-x">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="pill bg-primary-soft text-primary-dark">
            <BoltIcon className="h-3.5 w-3.5" /> Bảng giá Subscription cho Chủ trạm
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-strong sm:text-4xl text-balance">
            Chi phí minh bạch, <span className="text-gradient">tối đa hóa lợi nhuận</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-body leading-relaxed">
            Phí License quản trị hệ thống cố định theo trạm — không thu phí ẩn, không giới hạn số lượng trụ sạc, kích hoạt nhanh chóng.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {/* Monthly Plan */}
          <Reveal delay={80} className="flex flex-col justify-between rounded-card border border-line bg-white p-7 sm:p-8 shadow-card transition-all hover:border-primary/40">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink-strong">Gói Tháng</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Hiệu lực 1 tháng lịch</p>
                </div>
                <span className="rounded-full bg-surface-alt border border-line px-3 py-1 text-xs font-semibold text-ink-body">
                  Linh hoạt
                </span>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-ink-strong">500.000</span>
                <span className="text-base font-semibold text-ink-body">đ</span>
                <span className="text-sm text-ink-muted">/ tháng / trạm</span>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Phù hợp cho trạm sạc mới thử nghiệm thị trường và tối ưu dòng tiền ngắn hạn.
              </p>

              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Quyền lợi bao gồm:
                </p>
                <ul className="space-y-2.5 text-sm text-ink-body">
                  {[
                    "Không giới hạn số lượng trụ & cổng sạc",
                    "Hiển thị trạm trên bản đồ tìm kiếm tài xế",
                    "Tự đặt giá bán điện & khung giờ cao điểm (TOU)",
                    "Hệ thống check-in QR & đặt chỗ thời gian thực",
                    "Báo cáo thống kê lượt sạc & doanh thu",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="mailto:phamthang3564@gmail.com?subject=Đăng ký Gói Tháng License Trạm sạc ChargeOps"
                className="btn-secondary w-full text-center"
              >
                Đăng ký Gói Tháng
              </a>
            </div>
          </Reveal>

          {/* Yearly Plan - Best Value */}
          <Reveal delay={160} className="relative flex flex-col justify-between rounded-card border-2 border-primary bg-white p-7 sm:p-8 shadow-glass transition-all">
            {/* Discount Ribbon Badge */}
            <div className="absolute -top-3.5 right-6 rounded-full bg-brand-gradient px-3.5 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 text-yellow-300" />
              <span>Tiết kiệm 1.000.000 đ (~16.7%)</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-ink-strong">Gói Năm</h3>
                  <p className="text-xs text-primary-dark font-medium mt-0.5">Hiệu lực 1 năm lịch liên tục</p>
                </div>
                <span className="rounded-full bg-primary-soft text-primary-dark px-3 py-1 text-xs font-bold">
                  Khuyên dùng
                </span>
              </div>

              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-primary-dark">5.000.000</span>
                  <span className="text-base font-semibold text-primary-dark">đ</span>
                  <span className="text-sm text-ink-muted">/ năm / trạm</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="line-through text-ink-muted">6.000.000 đ</span>
                  <span className="font-semibold text-primary-dark">Chỉ ~416.000 đ / tháng</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Lựa chọn tối ưu cho chủ trạm vận hành lâu dài, duy trì trạng thái tìm kiếm liên tục cho tài xế.
              </p>

              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-dark mb-3">
                  Toàn bộ quyền lợi Gói Tháng, cộng thêm:
                </p>
                <ul className="space-y-2.5 text-sm text-ink-body">
                  {[
                    "Tiết kiệm ngay 1.000.000 đ so với đóng từng tháng",
                    "Ưu tiên hiển thị nổi bật trên bản đồ ChargeOps",
                    "Hỗ trợ cấu hình kỹ thuật & onboard trạm 1-1",
                    "Bảo đảm vận hành thông suốt 365 ngày không lo gián đoạn",
                    "Hỗ trợ kỹ thuật ưu tiên 24/7 từ đội ngũ ChargeOps",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span className="font-medium text-ink-strong">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="mailto:phamthang3564@gmail.com?subject=Đăng ký Gói Năm License Trạm sạc ChargeOps (Ưu đãi 5 triệu)"
                className="btn-primary w-full text-center"
              >
                Đăng ký Gói Năm (Ưu đãi)
              </a>
            </div>
          </Reveal>
        </div>

        {/* Commitment Notes */}
        <Reveal delay={200} className="mt-10 max-w-3xl mx-auto rounded-xl border border-line bg-surface-alt p-4 text-center text-xs sm:text-sm text-ink-muted">
          💡 <span className="font-semibold text-ink-strong">Chính sách vận hành:</span> Phí License được đóng định kỳ theo trạm trực tiếp với ban quản trị ChargeOps. Không phụ thu trên mỗi kWh hay số lượng trụ sạc của trạm.
        </Reveal>
      </div>
    </section>
  );
}
