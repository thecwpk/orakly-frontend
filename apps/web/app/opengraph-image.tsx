import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Orakly Market: YES/NO prediction markets, on-chain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse 90% 60% at 20% 0%, #1a2440 0%, #0b0f16 60%), linear-gradient(180deg, #0b0f16, #07090d)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              border: "4px solid #ffffff",
              position: "relative",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 76,
              left: 122,
              width: 16,
              height: 16,
              borderRadius: 9999,
              background: "#22d3ee",
            }}
          />
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>orakly</span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 9999,
              padding: "6px 12px",
            }}
          >
            LIVE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              margin: 0,
              maxWidth: 980,
            }}
          >
            Trade conviction.
            <br />
            <span style={{ color: "#3ecf8e" }}>YES or NO.</span>
          </h1>
          <p style={{ fontSize: 28, color: "#a8b0c2", margin: 0, maxWidth: 880, lineHeight: 1.35 }}>
            Transparent rules, stablecoin rails, settlement you can verify — across the networks we support.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 16px",
                borderRadius: 9999,
                border: "1px solid rgba(34,211,238,0.35)",
                background: "rgba(34,211,238,0.08)",
                fontSize: 20,
                fontWeight: 600,
                color: "#67e8f9",
              }}
            >
              <span
                style={{ width: 10, height: 10, background: "#22d3ee", display: "block", borderRadius: 2 }}
              />
              Multi-network
            </div>
            <span style={{ fontSize: 20, color: "#94a3b8" }}>orakly.market</span>
          </div>
          <span style={{ fontSize: 18, color: "#6f7a8f", fontFamily: "ui-monospace, monospace" }}>
            yes / no · live odds
          </span>
        </div>
      </div>
    ),
    size,
  );
}
