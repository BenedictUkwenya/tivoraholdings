"use client"

import Link from "next/link"
import { ArrowRight, Layers, ShieldCheck, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
  { plan: "Micro", range: "$10 – $250" },
  { plan: "Starter", range: "$500 – $4,999" },
  { plan: "Growth", range: "$5,000 – $24,999", featured: true },
  { plan: "Elite", range: "$25,000+" },
]

export default function Hero() {
  return (
    <section id="home" className="pt-16 min-h-screen bg-white flex items-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#18181B 1px, transparent 1px), linear-gradient(to right, #18181B 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      {/* Warm amber glow top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/60 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — editorial content */}
          <div className="flex flex-col gap-8">
            {/* Label */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Trusted by 10,000+ investors worldwide
            </div>

            {/* Headline — editorial style, not centered */}
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl sm:text-6xl lg:text-[70px] font-black leading-[1.0] tracking-tighter text-zinc-900">
                Your money
                <br />
                should work
                <br />
                <span className="relative inline-block">
                  <span className="text-amber-600">as hard</span>
                  <span className="text-zinc-900"> as you.</span>
                  {/* underline accent */}
                  <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                    <path d="M0 5 Q50 1 100 4 Q150 7 200 3" stroke="#D97706" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
            </div>

            <p className="text-lg text-zinc-500 max-w-lg leading-relaxed">
              TivoraHoldings gives every investor a managed account they can
              grow with — starting from just $10. Five clear tiers, transparent
              service, and our team handling the heavy lifting.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-amber-600 text-white hover:bg-amber-700 gap-2 px-7 text-base shadow-md"
                asChild
              >
                <Link href="/auth/signup">
                  Open an account <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-7 text-base border-zinc-300 text-zinc-700" asChild>
                <a href="#plans">See plans</a>
              </Button>
            </div>

            {/* Trust signals — inline, no icons spam */}
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { icon: ShieldCheck, label: "Bank-grade security" },
                { icon: BadgeCheck, label: "Regulated & audited" },
                { icon: Layers, label: "Five tiers from $10" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — tiers table (more editorial, less "floating widget") */}
          <div className="hidden lg:block">
            {/* Big decorative number */}
            <div className="mb-6">
              <p className="text-[120px] font-black leading-none text-zinc-900/[0.04] select-none">
                5
              </p>
              <p className="text-sm text-zinc-400 -mt-6 ml-1 font-medium">Investment tiers</p>
            </div>

            {/* Tiers table */}
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">Investment Tiers</p>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  All tiers active
                </span>
              </div>
              <div className="divide-y divide-zinc-100">
                {tiers.map((t) => (
                  <div
                    key={t.plan}
                    className={`px-5 py-3.5 flex items-center justify-between ${
                      t.featured ? "bg-amber-50/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          t.featured
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {t.plan[0]}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">{t.plan}</p>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        t.featured ? "text-amber-700" : "text-zinc-700"
                      }`}
                    >
                      {t.range}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100">
                <Link
                  href="/auth/signup"
                  className="text-sm text-amber-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Open your account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Social proof strip */}
            <div className="mt-4 flex items-center gap-3 px-2">
              <div className="flex -space-x-2">
                {["JM", "SC", "MO", "RK", "AB"].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-zinc-600"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                <strong className="text-zinc-800">4,800+</strong> investors joined this month
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
