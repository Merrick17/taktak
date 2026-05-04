import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Apple touch icon — same mark as favicon, sized for iOS home screen. */
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
          background: "linear-gradient(140deg, #FF6B6B 0%, #E84393 42%, #6C5CE7 100%)",
          borderRadius: "20%",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 104,
            fontWeight: 900,
            fontFamily:
              "ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            letterSpacing: -4,
            marginTop: 4,
          }}
        >
          T
        </span>
      </div>
    ),
    { ...size }
  )
}
