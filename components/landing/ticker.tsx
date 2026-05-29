"use client"

const TICKERS = [
  { symbol: "BTC/USD", price: "$67,420", change: "+2.4%" },
  { symbol: "ETH/USD", price: "$3,841", change: "+1.8%" },
  { symbol: "USDT/USD", price: "$1.00", change: "+0.0%" },
  { symbol: "BNB/USD", price: "$612", change: "+3.1%" },
  { symbol: "SOL/USD", price: "$182", change: "+4.2%" },
  { symbol: "XRP/USD", price: "$0.67", change: "+1.1%" },
  { symbol: "ADA/USD", price: "$0.52", change: "-0.3%" },
  { symbol: "AVAX/USD", price: "$41.20", change: "+2.7%" },
]

const items = [...TICKERS, ...TICKERS]

export default function Ticker() {
  return (
    <div className="bg-zinc-900 border-y border-zinc-800 overflow-hidden py-2.5">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-xs">
            <span className="text-zinc-400 font-medium">{t.symbol}</span>
            <span className="text-white font-semibold">{t.price}</span>
            <span className={`font-semibold ${t.change.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>
              {t.change}
            </span>
            <span className="text-zinc-700 ml-2">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
