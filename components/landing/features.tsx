import { Shield, TrendingUp, Zap, Globe, HeadphonesIcon } from "lucide-react"

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header — left aligned, editorial */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-3">
            Why TivoraHoldings
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 mb-4 leading-tight">
            Everything you need.
            <br />
            <span className="text-amber-600">Nothing you don't.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            We built TivoraHoldings for people who want serious returns without
            the complexity of traditional investment firms.
          </p>
        </div>

        {/* Bento grid — asymmetric, more interesting */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: large + small + small */}
          <div className="md:col-span-2 bg-[#F9F7F4] border border-zinc-200 rounded-2xl p-7 flex flex-col gap-4 hover:border-amber-300 hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">A tier for every investor</h3>
            <p className="text-zinc-500 leading-relaxed">
              Five clearly defined tiers — from a $10 trial deposit to a
              $25,000+ premium portfolio. Pick the one that fits where you are
              today, and move up whenever you&apos;re ready.
            </p>
            {/* Mini tier display — ranges, not return promises */}
            <div className="flex gap-3 mt-2">
              {[
                { l: "Micro", v: "$10+" },
                { l: "Growth", v: "$5K+" },
                { l: "Elite", v: "$25K+" },
              ].map((r) => (
                <div key={r.l} className="flex-1 bg-white rounded-xl p-3 border border-zinc-200 text-center">
                  <p className="text-xs text-zinc-400 mb-0.5">{r.l}</p>
                  <p className="text-lg font-black text-amber-600">{r.v}</p>
                  <p className="text-[10px] text-zinc-400">entry</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col gap-4 hover:border-amber-700/50 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Bank-grade security</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              256-bit encryption, multi-factor authentication, and cold storage
              protect your assets at every layer.
            </p>
          </div>

          {/* Row 2: small + small + large */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-7 flex flex-col gap-4 hover:border-amber-400 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Fund in minutes</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              BTC, ETH, or USDT. No delays, no hidden fees — your deposit is
              active the moment it&apos;s confirmed.
            </p>
          </div>

          <div className="bg-[#F9F7F4] border border-zinc-200 rounded-2xl p-7 flex flex-col gap-4 hover:border-amber-300 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-zinc-200 flex items-center justify-center">
              <Globe className="w-5 h-5 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Invest from anywhere</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              80+ countries, 24/7, no borders. Your portfolio works while you
              sleep.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-7 flex flex-col gap-4 hover:border-amber-300 hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Real humans, real support</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Our investment specialists are available around the clock — not
              chatbots. Call, email, or chat anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
