import Image from "next/image";

/** A polished iPhone-style device frame: notch, side buttons, screen sheen. */
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
    <div
      className={`relative w-[256px] rounded-[2.6rem] border-[11px] border-ink-strong bg-ink-strong shadow-glass sm:w-[290px] ${
        float ? "animate-float-slow" : ""
      } ${className ?? ""}`}
    >
      {/* side buttons */}
      <span className="absolute -left-[13px] top-24 h-12 w-[3px] rounded-l bg-ink-strong" />
      <span className="absolute -left-[13px] top-40 h-12 w-[3px] rounded-l bg-ink-strong" />
      <span className="absolute -right-[13px] top-28 h-16 w-[3px] rounded-r bg-ink-strong" />

      <div className="relative overflow-hidden rounded-[1.85rem] bg-black">
        {/* dynamic-island notch */}
        <span className="absolute left-1/2 top-2.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-ink-strong" />
        <Image
          src={src}
          alt={alt}
          width={600}
          height={1300}
          priority={priority}
          className="h-auto w-full object-cover"
        />
        {/* glass sheen */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10" />
      </div>
    </div>
  );
}
