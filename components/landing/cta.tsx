import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
        {/* Decorative amber glow */}
        <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <p className="text-xs text-amber-400 font-bold tracking-widest uppercase">
          Get Started Today
        </p>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight relative z-10">
          The best time to invest
          <br />
          <span className="text-amber-400">was yesterday.</span>
          <br />
          The second best is now.
        </h2>

        <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
          Join 10,000+ investors who chose to grow their wealth with
          TivoraHoldings. Open your account in minutes, no minimum commitment.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-xl font-semibold text-base hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/30"
          >
            Open free account <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#plans"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-base hover:bg-white/15 transition-colors border border-white/20"
          >
            View investment plans
          </a>
        </div>

        <p className="text-zinc-500 text-xs">
          No credit card required · Withdraw anytime · 24/7 support
        </p>
      </div>
    </section>
  )
}
