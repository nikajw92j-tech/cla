import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Nexora — Premium websites, built professionally";

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
          padding: 72,
          background: "radial-gradient(80% 80% at 70% 0%, #2a2366 0%, #07080d 60%)",
          color: "#f2f3f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#8b7bff,#22d3ee)" }} />
          nexora.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>Your Idea. Your Website.</div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: "#8b7bff" }}>Built Professionally.</div>
        </div>
        <div style={{ fontSize: 28, color: "#a3a7c2" }}>Premium web design, development & management · Tbilisi</div>
      </div>
    ),
    size,
  );
}
