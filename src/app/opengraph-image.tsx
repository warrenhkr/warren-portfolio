import { ImageResponse } from "next/og";

export const alt = "WARREN HOUNKANRIN — Hardware & Software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#0f1b2d 0%,#1c1750 100%)", color: "#f1f5f9" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
          <div style={{ padding: "10px 22px", borderRadius: 999, border: "2px solid #22d3ee", color: "#22d3ee", fontSize: 28, display: "flex" }}>HARDWARE</div>
          <div style={{ padding: "10px 22px", borderRadius: 999, border: "2px solid #a78bfa", color: "#a78bfa", fontSize: 28, display: "flex" }}>SOFTWARE</div>
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, display: "flex" }}>WARREN HOUNKANRIN</div>
        <div style={{ fontSize: 34, marginTop: 24, color: "#94a3b8", display: "flex", maxWidth: 900 }}>Du monde physique au monde numérique, je transforme les idées en systèmes intelligents.</div>
      </div>
    ),
    size,
  );
}
