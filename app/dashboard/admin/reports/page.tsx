"use client"

import { useEffect, useState } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#D4A853", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444"]

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border px-3 py-2 text-xs shadow-xl" style={{ background: "hsl(var(--popover))" }}>
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-[#D4A853] font-semibold">{typeof payload[0].value === "number" && payload[0].value > 100 ? formatCurrency(payload[0].value) : payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function AdminReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [currencyDist, setCurrencyDist] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0 })

  useEffect(() => {
    async function load() {
      const [deps, withs, users] = await Promise.all([
        supabase.from("deposits").select("amount, status, currency, created_at"),
        supabase.from("withdrawals").select("amount, status, created_at"),
        supabase.from("users").select("id, created_at"),
      ])

      const approvedDeps = deps.data?.filter((d: any) => d.status === "approved") ?? []
      const approvedWiths = withs.data?.filter((w: any) => w.status === "approved") ?? []

      // Monthly revenue
      const months: Record<string, { revenue: number; withdrawals: number }> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months[d.toLocaleDateString("en-US", { month: "short" })] = { revenue: 0, withdrawals: 0 }
      }
      approvedDeps.forEach((d: any) => {
        const key = new Date(d.created_at).toLocaleDateString("en-US", { month: "short" })
        if (key in months) months[key].revenue += d.amount
      })
      approvedWiths.forEach((w: any) => {
        const key = new Date(w.created_at).toLocaleDateString("en-US", { month: "short" })
        if (key in months) months[key].withdrawals += w.amount
      })

      // User growth
      const userMonths: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        userMonths[d.toLocaleDateString("en-US", { month: "short" })] = 0
      }
      users.data?.forEach((u: any) => {
        const key = new Date(u.created_at).toLocaleDateString("en-US", { month: "short" })
        if (key in userMonths) userMonths[key]++
      })

      // Currency distribution
      const currencies: Record<string, number> = {}
      approvedDeps.forEach((d: any) => {
        currencies[d.currency] = (currencies[d.currency] ?? 0) + d.amount
      })

      setMonthlyRevenue(Object.entries(months).map(([month, v]) => ({ month, revenue: v.revenue, withdrawals: v.withdrawals })))
      setUserGrowth(Object.entries(userMonths).map(([month, users]) => ({ month, users })))
      setCurrencyDist(Object.entries(currencies).map(([name, value]) => ({ name, value })))
      setSummary({
        totalRevenue: approvedDeps.reduce((s: number, d: any) => s + d.amount, 0),
        totalUsers: users.data?.length ?? 0,
        totalDeposits: approvedDeps.length,
        totalWithdrawals: approvedWiths.length,
      })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue (AUM)", value: formatCurrency(summary.totalRevenue), color: "text-[#D4A853]" },
            { label: "Total Users", value: summary.totalUsers, color: "text-blue-400" },
            { label: "Approved Deposits", value: summary.totalDeposits, color: "text-emerald-400" },
            { label: "Approved Withdrawals", value: summary.totalWithdrawals, color: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 border border-border">
              <p className="text-muted-foreground text-xs mb-1.5">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue vs Withdrawals */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-1">Revenue vs Withdrawals</h3>
          <p className="text-muted-foreground text-xs mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A853" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#D4A853" strokeWidth={2} fill="url(#revGrad)" dot={false} name="Revenue" />
              <Area type="monotone" dataKey="withdrawals" stroke="#F97316" strokeWidth={2} fill="url(#withGrad)" dot={false} name="Withdrawals" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Growth */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowth} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Currency Distribution */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Deposits by Currency</h3>
            {currencyDist.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground/70 text-sm">No deposit data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={currencyDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {currencyDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground uppercase">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
