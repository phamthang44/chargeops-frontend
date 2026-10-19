"use client";

import { useState } from "react";
import { CalendarIcon, ClockIcon, CheckIcon, BoltIcon } from "./Icons";

interface SlotData {
  id: string;
  time: string;
  type: "past" | "reserved" | "available" | "offpeak";
  label: string;
  rate: number;
  availablePlugs: number;
  discount?: string;
}

const SLOTS: SlotData[] = [
  {
    id: "s1",
    time: "11:30 – 12:30",
    type: "past",
    label: "Đã qua",
    rate: 3200,
    availablePlugs: 0,
  },
  {
    id: "s2",
    time: "14:00 – 15:00",
    type: "reserved",
    label: "Khung giờ vàng",
    rate: 3850,
    availablePlugs: 1,
  },
  {
    id: "s3",
    time: "15:30 – 16:30",
    type: "available",
    label: "Đang mở đặt",
    rate: 3850,
    availablePlugs: 3,
  },
  {
    id: "s4",
    time: "21:30 – 22:30",
    type: "offpeak",
    label: "Giờ thấp điểm",
    rate: 2850,
    availablePlugs: 5,
    discount: "-26%",
  },
];

export function InteractiveSlotScheduler() {
  const [selectedId, setSelectedId] = useState<string>("s2");
  const selectedSlot = SLOTS.find((s) => s.id === selectedId) || SLOTS[1];

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="pill bg-primary-soft text-primary-dark font-bold">
            <CalendarIcon className="h-3.5 w-3.5" /> Mô phỏng chọn khung giờ
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary-dark bg-primary-soft/50 px-2.5 py-0.5 rounded-full border border-primary/20">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Dữ liệu minh họa</span>
          </div>
        </div>

        <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-heading">
          Chọn giờ sạc phù hợp, biết trước giá
        </h3>
        <p className="mt-2 text-sm text-ink-body max-w-xl leading-relaxed">
          Chọn một khung giờ để xem cách màn hình hiển thị thông tin đặt chỗ. Tình trạng và giá bên dưới là dữ liệu minh họa.
        </p>
      </div>

      {/* Interactive Slot Selector Bar */}
      <div className="mt-8 rounded-2xl border border-black/[0.06] bg-surface-alt/80 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-bold text-ink-heading">Trạm mẫu · Hôm nay</span>
          </div>
          <span className="text-ink-muted text-[11px]">Chọn khung giờ để xem giá</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SLOTS.map((slot) => {
            const isSelected = slot.id === selectedId;
            const isPast = slot.type === "past";

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedId(slot.id)}
                className={`text-left p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isPast
                    ? "opacity-40 bg-white/50 border border-black/5 cursor-not-allowed"
                    : isSelected
                    ? "bg-white border-2 border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
                    : "bg-white border border-black/5 hover:border-primary/40 hover:bg-surface-highlight"
                }`}
              >
                {slot.discount && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {slot.discount}
                  </span>
                )}
                <p className="font-mono text-xs font-bold text-ink-heading">{slot.time}</p>
                <p
                  className={`text-[10.5px] mt-1 font-semibold ${
                    isSelected ? "text-primary-dark" : "text-ink-muted"
                  }`}
                >
                  {isPast ? "Đã hết giờ" : isSelected ? "✓ Đang chọn" : `Còn ${slot.availablePlugs} trụ`}
                </p>
                <p className="font-mono text-[10px] text-ink-muted mt-0.5">
                  {slot.rate.toLocaleString("vi-VN")} đ/kWh
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Slot Dynamic Telemetry Bar */}
        <div className="mt-4 pt-3.5 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
              <BoltIcon className="h-3.5 w-3.5" />
            </span>
              <span className="text-ink-body">
              Khung giờ: <strong className="text-ink-heading">{selectedSlot.time}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-primary-dark text-sm">
              {selectedSlot.rate.toLocaleString("vi-VN")} đ/kWh
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-glow-emerald">
              <CheckIcon className="h-3 w-3" /> Khung giờ đang chọn
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
