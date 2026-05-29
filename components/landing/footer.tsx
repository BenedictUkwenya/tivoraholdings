"use client"

import Link from "next/link"
import { Twitter, Linkedin, MessageCircle, Instagram, ArrowRight } from "lucide-react"
import { useState } from "react"
import { TivoraLogo } from "@/components/logo"

const footerLinks = {
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press", href: "#" },
  ],
  Platform: [
    { label: "Investment Plans", href: "#plans" },
    { label: "How It Works", href: "#how" },
    { label: "Portfolio Tracker", href: "/dashboard/user/portfolio" },
    { label: "Referral Program", href: "/dashboard/user/referrals" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Live Chat", href: "/dashboard/user/chat" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Compliance", href: "#" },
  ],
}

const socials = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: MessageCircle, label: "Telegram", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
]

export default function Footer() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="bg-[#F9F7F4] border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2.5 self-start">
              <TivoraLogo size={34} />
              <span className="font-bold text-[17px] tracking-tight text-zinc-900">
                Tivora<span className="text-amber-600">Holdings</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              Empowering everyday investors with institutional-quality returns.
              Simple, transparent, and built to grow with you.
            </p>
            <div className="flex gap-2.5">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:border-amber-300 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs text-zinc-900 font-bold tracking-widest uppercase mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div>
            <h4 className="text-base font-bold text-zinc-900 mb-1">Stay informed</h4>
            <p className="text-sm text-zinc-500">Market insights and platform updates, weekly.</p>
          </div>
          {subscribed ? (
            <p className="text-sm text-emerald-600 font-semibold whitespace-nowrap">✓ You're subscribed!</p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true) }}
              className="flex gap-2 w-full sm:w-auto"
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 sm:w-56 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 flex items-center gap-1.5 transition-colors"
              >
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} TivoraHoldings. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Licensed & Regulated · All investments carry risk
          </p>
        </div>
      </div>
    </footer>
  )
}
