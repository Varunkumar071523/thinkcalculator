import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const alt = "ThinkCalculator — Calculate. Compare. Decide. Financial calculators for India."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#f8fafc", color: "#0f172a", padding: "72px 88px" }}><div style={{ display: "flex", flexDirection: "column", width: "100%" }}><div style={{ display: "flex", alignItems: "center", gap: 24 }}><div style={{ width: 92, height: 92, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 22, background: "#1e3a5f", color: "white", fontSize: 38, fontWeight: 750 }}>TC</div><span style={{ fontSize: 44, fontWeight: 700 }}>ThinkCalculator</span></div><div style={{ width: 120, height: 8, marginTop: 64, background: "#2563eb" }} /><h1 style={{ margin: "34px 0 0", fontSize: 72, lineHeight: 1.08, letterSpacing: -3, fontWeight: 750 }}>Calculate. Compare. Decide.</h1><p style={{ margin: "30px 0 0", fontSize: 34, color: "#475569" }}>Financial calculators for India</p></div></div>, size)
}
