"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { User, Transaction, Deposit } from "@/types"

const COLORS = ["#D4A853", "#10B981", "#3B82F6", "#8B5CF6"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border px-3 py-2 text-xs shadow-xl" style={{ background: "hsl(var(--popover))" }}>
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-[#D4A853] font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function PortfolioPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      const uid = session.user.id

      const [u, tx, dep] = await Promise.all([
        supabase.from("users").select("*").eq("id", uid).single(),
        supabase.from("transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
        supabase.from("deposits").select("*").eq("user_id", uid).eq("status", "approved"),
      ])

      if (u.data) setUser(u.data as User)
      if (tx.data) setTransactions(tx.data as Transaction[])
      if (dep.data) setDeposits(dep.data as Deposit[])
      setLoading(false)
    }
    load()
  }, [])

  // Monthly earnings chart
  const monthlyData = (() => {
    const months: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      months[d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })] = 0
    }
    transactions.forEach((t) => {
      if (["earning", "referral_bonus", "bonus"].includes(t.type)) {
        const key = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        if (key in months) months[key] += t.amount
      }
    })
    return Object.entries(months).map(([month, amount]) => ({ month, amount }))
  })()

  // Type distribution
  const typeDistribution = (() => {
    const totals: Record<string, number> = {}
    transactions.forEach((t) => {
      totals[t.type] = (totals[t.type] ?? 0) + t.amount
    })
    return Object.entries(totals).map(([name, value]) => ({ name: name.replace("_", " "), value }))
  })()

  // Deposit by currency
  const byCurrency = (() => {
    const totals: Record<string, number> = {}
    deposits.forEach((d) => {
      totals[d.currency] = (totals[d.currency] ?? 0) + d.amount
    })
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  })()

  const roi = user && user.total_deposited > 0
    ? ((user.total_earnings / user.total_deposited) * 100).toFixed(2)
    : "0.00"

  return (
    <UserLayout title="Portfolio">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Net Portfolio Value", value: formatCurrency((user?.balance ?? 0) + (user?.total_earnings ?? 0)), color: "text-[#D4A853]" },
            { label: "Total ROI", value: `${roi}%`, color: "text-emerald-400" },
            { label: "Total Invested", value: formatCurrency(user?.total_deposited ?? 0), color: "text-blue-400" },
            { label: "Total Withdrawn", value: formatCurrency(user?.total_withdrawn ?? 0), color: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1.5">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Earnings + Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground font-semibold">Monthly Earnings</h3>
                <p className="text-muted-foreground text-xs">Last 6 months</p>
              </div>
              <Badge className="bg-[#D4A853]/15 text-[#D4A853] border-[#D4A853]/30 text-xs">6M</Badge>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#D4A853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Transaction Breakdown</h3>
            {typeDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground/70 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {typeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deposit by Currency */}
        {byCurrency.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Deposits by Currency</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {byCurrency.map((item, i) => (
                <div key={item.name} className="p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ background: COLORS[i % COLORS.length] }} />
                  <p className="text-muted-foreground text-xs uppercase">{item.name}</p>
                  <p className="text-foreground font-semibold text-sm">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Log */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4">Transaction Log</h3>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground/70 text-sm text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Type", "Description", "Amount"].map((h) => (
                      <th key={h} className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground text-xs whitespace-nowrap">{formatDate(tx.created_at)}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium capitalize bg-muted/50 text-muted-foreground">
                          {tx.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs max-w-[180px] truncate">{tx.description}</td>
                      <td className={`py-3 text-right text-sm font-semibold ${tx.type === "withdrawal" ? "text-red-400" : "text-emerald-400"}`}>
                        {tx.type === "withdrawal" ? "-" : "+"}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
