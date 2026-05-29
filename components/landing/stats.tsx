const stats = [
  { value: "10,000+", label: "Active investors", sub: "across 80 countries" },
  { value: "$250M+", label: "Assets managed", sub: "and growing daily" },
  { value: "From $10", label: "Entry investment", sub: "start on the Micro tier" },
  { value: "99.8%", label: "Uptime guarantee", sub: "platform reliability" },
]

export default function Stats() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F9F7F4]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col gap-1 ${i !== 0 ? "lg:border-l lg:border-zinc-300/50 lg:pl-8" : ""}`}>
              <span className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tighter">
                {s.value}
              </span>
              <span className="text-sm font-semibold text-zinc-800">{s.label}</span>
              <span className="text-xs text-zinc-400">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
