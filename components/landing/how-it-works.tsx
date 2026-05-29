const steps = [
  {
    num: "01",
    title: "Create your account",
    body: "Sign up in under two minutes. No paperwork, no lengthy verification before you start — just an email and password.",
  },
  {
    num: "02",
    title: "Choose a plan",
    body: "Pick the tier that matches your budget and goals. Starter from $500, Growth from $5,000, or Elite from $25,000.",
  },
  {
    num: "03",
    title: "Make your deposit",
    body: "Fund your account with BTC, ETH, or USDT. Upload your payment proof and it's reviewed within a few hours.",
  },
  {
    num: "04",
    title: "Watch it grow",
    body: "Your returns are tracked daily. Withdraw anytime or reinvest to compound your earnings over time.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — sticky header */}
          <div className="lg:sticky lg:top-28">
            <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 mb-6 leading-tight">
              From sign-up to
              <br />
              <span className="text-amber-600">first return</span>
              <br />
              in 4 steps.
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
              We made the process as straightforward as possible — because
              complicated investing platforms help no one.
            </p>

            {/* Visual accent */}
            <div className="mt-10 w-16 h-1.5 bg-amber-400 rounded-full" />
            <div className="mt-2 w-8 h-1.5 bg-zinc-200 rounded-full" />
          </div>

          {/* Right — steps */}
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex gap-5 p-6 rounded-2xl border border-zinc-200 bg-white hover:border-amber-300 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex-shrink-0">
                  <span className="text-5xl font-black text-zinc-100 group-hover:text-amber-100 transition-colors leading-none select-none">
                    {step.num}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <h3 className="text-base font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
