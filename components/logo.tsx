interface LogoProps {
  className?: string
  size?: number
  /** Render without the rounded background — for use on dark headers etc. */
  bare?: boolean
}

/**
 * Brand mark. ViewBox 48×48. All meaningful pixels live inside the inner 80%
 * (Android adaptive-icon safe zone) so it survives circle/squircle masking
 * by browser address bars, OS launchers and search-result favicons.
 */
export function TivoraLogo({
  className = "",
  size = 36,
  bare = false,
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TivoraHoldings"
      className={className}
    >
      <title>TivoraHoldings</title>
      {!bare && (
        <rect width="48" height="48" rx="11" fill="url(#tvgBg)" />
      )}

      {/* Outer peak — solid white, very legible at 16×16 */}
      <path
        d="M24 11 L39 35 H9 Z"
        fill="#FFFFFF"
        fillOpacity={bare ? 1 : 0.97}
      />

      {/* Inner peak — gold gradient, gives depth without losing the silhouette */}
      <path
        d="M24 22 L33 35 H15 Z"
        fill="url(#tvgFg)"
        fillOpacity="0.55"
      />

      <defs>
        <linearGradient
          id="tvgBg"
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
          id="tvgFg"
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
  )
}
