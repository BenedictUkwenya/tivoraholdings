import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "TivoraHoldings — Premium Investment Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #050F1F 0%, #0A1A33 55%, #1A1208 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg
            width="84"
            height="84"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="48" height="48" rx="11" fill="url(#bg)" />
            <path d="M24 11 L39 35 H9 Z" fill="#FFFFFF" fillOpacity="0.97" />
            <path
              d="M24 22 L33 35 H15 Z"
              fill="url(#fg)"
              fillOpacity="0.55"
            />
            <defs>
              <linearGradient
                id="bg"
                x1="4"
                y1="4"
                x2="44"
                y2="44"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F5B544" />
                <stop offset="1" stopColor="#8A4B0E" />
              </linearGradient>
              <linearGradient
                id="fg"
                x1="14"
                y1="22"
                x2="34"
                y2="35"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F5B544" />
                <stop offset="1" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </svg>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            TivoraHoldings
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              maxWidth: "900px",
              color: "#FFFFFF",
            }}
          >
            <span>Grow your wealth</span>
            <span style={{ color: "#F5B544" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.72)",
              maxWidth: "880px",
            }}
          >
            A premium investment platform with five tiers, transparent service
            and dedicated portfolio management.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            tivoraholdings.com
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(245,181,68,0.5)",
              background: "rgba(245,181,68,0.12)",
              color: "#F5B544",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Premium · Trusted · Transparent
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
