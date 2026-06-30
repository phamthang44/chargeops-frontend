import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BOLT = "M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10B981",
        }}
      >
        <svg width="116" height="116" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="33" fill="#ffffff" opacity="0.14" />
          <path d={BOLT} transform="translate(14,11) scale(0.72)" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
