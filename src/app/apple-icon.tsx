import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0F14" }}>
        <svg width="120" height="90" viewBox="0 0 24 18" fill="none">
          <circle cx="8.5" cy="9" r="6.5" stroke="#4FB3A1" strokeWidth="1.4" />
          <circle cx="15.5" cy="9" r="6.5" stroke="#4FB3A1" strokeWidth="1.4" opacity="0.55" />
        </svg>
      </div>
    ),
    size,
  );
}
