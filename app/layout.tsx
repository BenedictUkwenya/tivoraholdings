import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TivoraHoldings — Premium Investment Platform",
    template: "%s | TivoraHoldings",
  },
  description:
    "TivoraHoldings is a world-class investment platform offering premium plans, transparent returns, and a secure environment for growing your wealth.",
  keywords: ["investment", "wealth management", "portfolio", "returns", "crypto", "finance"],
  authors: [{ name: "TivoraHoldings" }],
  openGraph: {
    title: "TivoraHoldings — Premium Investment Platform",
    description: "Grow your wealth with the most trusted investment platform.",
    url: baseUrl,
    siteName: "TivoraHoldings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TivoraHoldings",
    description: "Premium investment platform for serious investors.",
  },
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
