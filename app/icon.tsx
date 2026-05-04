import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 512, height: 512 }
export const contentType = "image/png"

/** TakTak favicon: brand gradient + bold “T” (matches header wordmark tone). */
export default function Icon() {
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
          borderRadius: "22%",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 300,
            fontWeight: 900,
            fontFamily:
              "ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            letterSpacing: -10,
            marginTop: 8,
          }}
        >
          T
        </span>
      </div>
    ),
    { ...size }
  )
}
