export function TivoraLogo({
  className = "",
  size = 36,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TivoraHoldings logo mark"
    >
      <rect width="48" height="48" rx="13" fill="url(#logoA)" />
      <path d="M24 10 L40 36 L8 36 Z" fill="white" opacity="0.95" />
      <path d="M24 21 L34 36 L14 36 Z" fill="url(#logoB)" opacity="0.45" />
      <defs>
        <linearGradient id="logoA" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="logoB" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  )
}
