import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ChargeOps — EV charging, reserved.";

const BOLT = "M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 116,
                height: 116,
                borderRadius: 28,
                background: "rgba(255,255,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="78" height="78" viewBox="0 0 100 100">
                <path d={BOLT} transform="translate(14,11) scale(0.72)" fill="#ffffff" />
              </svg>
            </div>
            <div style={{ marginLeft: 28, fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>
              ChargeOps
            </div>
          </div>

          <div style={{ marginTop: 48, fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 860 }}>
            EV charging, reserved.
          </div>
          <div style={{ marginTop: 18, fontSize: 32, color: "rgba(255,255,255,0.9)" }}>
            Find, book &amp; charge — Vietnam
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.9)" }}>chargeops.vn</div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 999,
              padding: "10px 22px",
            }}
          >
            iOS · Android
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
