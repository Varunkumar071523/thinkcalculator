import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 36, background: "#1e3a5f", color: "white", fontSize: 70, fontWeight: 750, letterSpacing: -4 }}>TC</div>, size)
}
