"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TivoraLogo } from "@/components/logo"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Plans", href: "#plans" },
  { label: "How It Works", href: "#how" },
  { label: "FAQ", href: "#faq" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
      setMobileOpen(false)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <TivoraLogo size={34} />
          <span className="font-bold text-[17px] tracking-tight text-zinc-900">
            Tivora<span className="text-amber-600">Holdings</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => scroll(e, link.href)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-100 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-zinc-300 bg-white/90 text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm font-semibold"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="bg-amber-600 text-white hover:bg-amber-700 shadow-sm px-5">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-zinc-200 px-4 pb-6 pt-3 flex flex-col gap-1 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => scroll(e, link.href)}
              className="px-4 py-3 text-sm font-medium text-zinc-700 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-100">
            <Button variant="outline" className="w-full border-zinc-300 text-zinc-800 hover:bg-zinc-50" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="w-full bg-amber-600 text-white hover:bg-amber-700" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
