import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

/**
 * Resolve the canonical site URL. Order of precedence:
 *   1. NEXT_PUBLIC_APP_URL (with or without protocol)
 *   2. Vercel's auto-provided VERCEL_URL (no protocol)
 *   3. localhost fallback for dev
 */
function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

const baseUrl = getBaseUrl()

const siteName = "TivoraHoldings"
const siteTagline = "Premium Investment Platform"
const siteDescription =
  "TivoraHoldings is a premium investment platform offering five managed tiers — from $10 to $25,000+ — with transparent service, dedicated portfolio management and bank-grade security."

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  generator: "Next.js",
  keywords: [
    "TivoraHoldings",
    "investment platform",
    "managed portfolio",
    "wealth management",
    "crypto investing",
    "BTC investment",
    "ETH investment",
    "USDT investment",
    "passive income",
    "investment tiers",
  ],
  authors: [{ name: "TivoraHoldings" }],
  creator: "TivoraHoldings",
  publisher: "TivoraHoldings",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    creator: "@tivoraholdings",
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#030B18" },
  ],
  width: "device-width",
  initialScale: 1,
}

// Schema.org Organization markup — helps Google show the logo in the
// knowledge panel / search results.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: baseUrl,
  logo: `${baseUrl}/icon.svg`,
  description: siteDescription,
  sameAs: [] as string[],
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: baseUrl,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
