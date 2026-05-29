import { Star, Quote } from "lucide-react"

const featured = {
  initials: "JM",
  name: "James Morrison",
  role: "Entrepreneur, New York",
  stars: 5,
  quote:
    "Six months in, my portfolio is up 40%. What got me was the transparency — I can see every transaction, every return, in real-time. I've tried three other platforms before this. None come close.",
}

const others = [
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Software Engineer, Singapore",
    stars: 5,
    quote:
      "I started with the Starter plan just to test it. Three months later I upgraded to Elite. The analytics dashboard alone is worth it.",
  },
  {
    initials: "MO",
    name: "Michael Osei",
    role: "Finance Director, London",
    stars: 5,
    quote:
      "Withdrawals processed within 24 hours, every time. I've recommended this to five colleagues and all of them are active investors now.",
  },
  {
    initials: "RA",
    name: "Rania Al-Rashid",
    role: "Investor, Dubai",
    stars: 5,
    quote:
      "The support team actually answers. I had a question about my deposit at 11pm and got a response in 8 minutes. That kind of service is rare.",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-3">
            Investor Stories
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 leading-tight">
            Don't take
            <br />our word for it.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured quote — spans 1 col but styled large */}
          <div className="lg:row-span-1 bg-zinc-900 rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-4 right-5 opacity-10">
              <Quote className="w-20 h-20 text-amber-400" />
            </div>
            <Stars count={featured.stars} />
            <p className="text-white/90 text-base leading-relaxed relative z-10">
              &ldquo;{featured.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                {featured.initials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{featured.name}</p>
                <p className="text-zinc-400 text-xs">{featured.role}</p>
              </div>
            </div>
          </div>

          {/* Other testimonials */}
          {others.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-amber-300 hover:shadow-md transition-all duration-300"
            >
              <Stars count={t.stars} />
              <p className="text-zinc-600 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 text-xs font-black shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-zinc-900 text-sm font-semibold">{t.name}</p>
                  <p className="text-zinc-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-12 py-5 px-6 bg-white border border-zinc-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">Rated <strong className="text-zinc-900">4.9 / 5</strong> from over 3,200 verified reviews</p>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
