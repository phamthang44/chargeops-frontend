import Image from "next/image";

/** A high-end machined titanium device frame with dynamic island, double-bezel and specular sheen. */
export function PhoneFrame({
  src,
  alt,
  priority,
  float,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  float?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Ambient emerald backlight glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-[3.5rem] bg-gradient-to-tr from-primary/20 via-primary-light/10 to-transparent blur-2xl opacity-75" />

      {/* Titanium Outer Shell */}
      <div
        className={`relative w-[265px] sm:w-[305px] rounded-[3rem] p-2.5 bg-gradient-to-b from-[#2E3B35] via-[#161F1B] to-[#0D1310] ring-1 ring-white/25 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-haptic ${
          float ? "animate-float-slow" : ""
        }`}
      >
        {/* Inner OLED Display Container */}
        <div className="relative overflow-hidden rounded-[2.35rem] bg-black ring-1 ring-black/80">
          {/* Dynamic Island pill */}
          <div className="absolute left-1/2 top-3 z-20 flex h-5 w-24 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2 ring-1 ring-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0a1510] ring-1 ring-primary/40" />
            <span className="h-2 w-2 rounded-full bg-[#121e18]" />
          </div>

          <Image
            src={src}
            alt={alt}
            width={600}
            height={1300}
            priority={priority}
            className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
          />

          {/* Precision glass specular glare */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12]" />
          {/* Bottom home indicator line */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-white/40 backdrop-blur" />
        </div>
      </div>
    </div>
  );
}
