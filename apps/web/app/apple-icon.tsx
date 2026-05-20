import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b0f16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "9999px",
            border: "12px solid #ffffff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 110,
            width: 26,
            height: 26,
            borderRadius: "9999px",
            background: "#22d3ee",
          }}
        />
      </div>
    ),
    size,
  );
}
