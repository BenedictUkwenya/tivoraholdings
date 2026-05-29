import Link from "next/link"
import { CheckCircle, Star, ArrowRight } from "lucide-react"

interface Plan {
  name: string
  range: string
  description: string
  badge?: string
  color: "neutral" | "amber" | "dark"
  features: string[]
}

const plans: Plan[] = [
  {
    name: "Micro",
    range: "$10 – $250",
    description: "Try the platform with a small entry deposit.",
    color: "neutral",
    features: [
      "Entry-level access",
      "Email support",
      "Account dashboard",
    ],
  },
  {
    name: "Basic",
    range: "$250 – $500",
    description: "Step up with priority review on every deposit.",
    color: "neutral",
    features: [
      "Everything in Micro",
      "Faster deposit review",
      "Standard analytics",
    ],
  },
  {
    name: "Starter",
    range: "$500 – $4,999",
    description: "A serious starting position with full analytics.",
    color: "neutral",
    features: [
      "Everything in Basic",
      "Weekly portfolio summary",
      "Advanced analytics",
    ],
  },
  {
    name: "Growth",
    range: "$5,000 – $24,999",
    description: "The most popular tier for committed investors.",
    badge: "Most Popular",
    color: "amber",
    features: [
      "Everything in Starter",
      "Priority support",
      "Dedicated account manager",
      "Referral program",
    ],
  },
  {
    name: "Elite",
    range: "$25,000+",
    description: "Premium service and concierge access at the top tier.",
    badge: "Premium Tier",
    color: "dark",
    features: [
      "Everything in Growth",
      "24/7 VIP support",
      "Personal account manager",
      "Exclusive opportunities",
    ],
  },
]

export default function Plans() {
  return (
    <section id="plans" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-3">
            Investment Plans
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 mb-4 leading-tight">
            Five tiers.
            <br />Pick what fits.
          </h2>
          <p className="text-zinc-500 text-lg">
            From a $10 trial deposit to a $25,000+ premium portfolio — every
            tier is managed by our team, with the right level of attention for
            your stage.
          </p>
        </div>

        {/* Cards — 5 plans, responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
          {plans.map((plan) => {
            const isAmber = plan.color === "amber"
            const isDark = plan.color === "dark"

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col gap-5 border transition-all duration-300 ${
                  isAmber
                    ? "bg-white border-amber-300 shadow-xl shadow-amber-100 lg:scale-[1.02]"
                    : isDark
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                }`}
              >
                {/* Top badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        isAmber
                          ? "bg-amber-600 text-white"
                          : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <h3
                    className={`text-lg font-black mb-1 ${
                      isDark ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Investment range */}
                <div
                  className={`pb-4 border-b ${
                    isDark ? "border-zinc-800" : "border-zinc-100"
                  }`}
                >
                  <p
                    className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${
                      isDark ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    Investment range
                  </p>
                  <p
                    className={`text-2xl font-black leading-tight ${
                      isAmber
                        ? "text-amber-600"
                        : isDark
                        ? "text-amber-400"
                        : "text-zinc-900"
                    }`}
                  >
                    {plan.range}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isAmber
                            ? "text-amber-500"
                            : isDark
                            ? "text-amber-400"
                            : "text-emerald-500"
                        }`}
                      />
                      <span
                        className={isDark ? "text-zinc-300" : "text-zinc-600"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/auth/signup"
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-all ${
                    isAmber
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : isDark
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  }`}
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-zinc-400 mt-10 max-w-2xl mx-auto leading-relaxed">
          All investments carry risk. Account performance reflects your
          activity and our team&apos;s management — there are no guaranteed
          returns or fixed monthly payouts.
        </p>
      </div>
    </section>
  )
}
