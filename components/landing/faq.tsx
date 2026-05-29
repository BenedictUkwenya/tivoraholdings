"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "How do I get started?",
    a: "Create a free account, verify your email, choose an investment plan, and make your first deposit. The whole process takes under 10 minutes.",
  },
  {
    q: "How are returns generated?",
    a: "TivoraHoldings deploys investor capital across a diversified portfolio of crypto trading strategies, arbitrage opportunities, and fixed-yield instruments managed by our professional trading desk.",
  },
  {
    q: "When can I withdraw my money?",
    a: "You can request a withdrawal at any time. Withdrawals are typically processed within 24–48 hours. The minimum withdrawal amount is $50.",
  },
  {
    q: "What cryptocurrencies can I use to deposit?",
    a: "We currently accept Bitcoin (BTC), Ethereum (ETH), and Tether (USDT). More currencies are coming soon.",
  },
  {
    q: "Is my investment insured?",
    a: "TivoraHoldings maintains insurance coverage on digital assets held in our custody. Detailed coverage information is available in our terms of service.",
  },
  {
    q: "How does the referral program work?",
    a: "You earn a $25 bonus for every person who signs up with your referral code and makes their first deposit. There's no limit to how many referrals you can have.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 mb-4 leading-tight">
            Common questions
          </h2>
          <p className="text-zinc-500">
            Can't find your answer?{" "}
            <a href="/dashboard/user/chat" className="text-amber-600 hover:underline font-medium">
              Chat with our team
            </a>
          </p>
        </div>

        <div className="flex flex-col divide-y divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
              >
                <span className={`text-sm font-semibold ${open === i ? "text-amber-700" : "text-zinc-900"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open === i ? "rotate-180 text-amber-600" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
