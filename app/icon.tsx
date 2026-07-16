import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e3a5f", color: "white" }}><div style={{ width: 330, height: 330, display: "flex", flexDirection: "column", border: "22px solid white", borderRadius: 64, padding: 38 }}><div style={{ height: 62, display: "flex", alignItems: "center", justifyContent: "flex-end", border: "10px solid white", borderRadius: 18, fontSize: 36, fontWeight: 700 }}>TC</div><div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 24 }}>{[1, 2, 3, 4, 5, 6].map((key) => <span key={key} style={{ width: 62, height: 62, borderRadius: 16, background: "white" }} />)}</div></div></div>, size)
}
