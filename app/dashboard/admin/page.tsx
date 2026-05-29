"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, ArrowDownCircle, ArrowUpCircle, DollarSign, Shield, MessageCircle, ChevronRight } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAdminPendingCounts } from "@/lib/hooks/use-admin-pending-counts"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

const ChartTooltip = ({ active, payload, label }: any) => {
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

export default function AdminDashboard() {
  const supabase = createClient()
  const pending = useAdminPendingCounts()
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, totalDeposited: 0, totalWithdrawn: 0, pendingDeposits: 0, pendingWithdrawals: 0 })
  const [recentDeposits, setRecentDeposits] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, depsRes, withRes] = await Promise.all([
        supabase.from("users").select("id, full_name, email, created_at, balance").order("created_at", { ascending: false }).limit(5),
        supabase.from("deposits").select("*, users(full_name, email)").order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("id, amount, status").order("created_at", { ascending: false }),
      ])

      const allDeps = await supabase.from("deposits").select("amount, status, created_at")
      const allWithdrawals = await supabase.from("withdrawals").select("amount, status")

      const totalDeposited = allDeps.data?.filter((d: any) => d.status === "approved").reduce((s: number, d: any) => s + d.amount, 0) ?? 0
      const totalWithdrawn = allWithdrawals.data?.filter((w: any) => w.status === "approved").reduce((s: number, w: any) => s + w.amount, 0) ?? 0
      const pendingDeposits = allDeps.data?.filter((d: any) => d.status === "pending").length ?? 0
      const pendingWithdrawals = allWithdrawals.data?.filter((w: any) => w.status === "pending").length ?? 0

      const months: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months[d.toLocaleDateString("en-US", { month: "short" })] = 0
      }
      allDeps.data?.filter((d: any) => d.status === "approved").forEach((d: any) => {
        const key = new Date(d.created_at).toLocaleDateString("en-US", { month: "short" })
        if (key in months) months[key] += d.amount
      })
      const chart = Object.entries(months).map(([month, volume]) => ({ month, volume }))

      setStats({
        users: usersRes.data?.length ?? 0,
        deposits: allDeps.data?.length ?? 0,
        withdrawals: allWithdrawals.data?.length ?? 0,
        totalDeposited, totalWithdrawn, pendingDeposits, pendingWithdrawals,
      })
      setRecentDeposits(depsRes.data ?? [])
      setRecentUsers(usersRes.data ?? [])
      setChartData(chart)
      setLoading(false)
    }

    // Get real totals from all records
    async function loadAll() {
      const [users, deps, withs] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("deposits").select("id, amount, status, created_at, users(full_name, email)").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("id, amount, status").order("created_at", { ascending: false }),
      ])
      const allUsers = await supabase.from("users").select("id, full_name, email, created_at, balance").order("created_at", { ascending: false }).limit(5)

      const totalDeposited = deps.data?.filter((d: any) => d.status === "approved").reduce((s: number, d: any) => s + d.amount, 0) ?? 0
      const totalWithdrawn = withs.data?.filter((w: any) => w.status === "approved").reduce((s: number, w: any) => s + w.amount, 0) ?? 0

      const months: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months[d.toLocaleDateString("en-US", { month: "short" })] = 0
      }
      deps.data?.filter((d: any) => d.status === "approved").forEach((d: any) => {
        const key = new Date(d.created_at).toLocaleDateString("en-US", { month: "short" })
        if (key in months) months[key] += d.amount
      })

      setStats({
        users: users.count ?? 0,
        deposits: deps.data?.length ?? 0,
        withdrawals: withs.data?.length ?? 0,
        totalDeposited, totalWithdrawn,
        pendingDeposits: deps.data?.filter((d: any) => d.status === "pending").length ?? 0,
        pendingWithdrawals: withs.data?.filter((w: any) => w.status === "pending").length ?? 0,
      })
      setRecentDeposits(deps.data?.slice(0, 5) ?? [])
      setRecentUsers(allUsers.data ?? [])
      setChartData(Object.entries(months).map(([month, volume]) => ({ month, volume })))
      setLoading(false)
    }
    loadAll()
  }, [])

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/20" },
    { label: "Total Deposits", value: formatCurrency(stats.totalDeposited), icon: ArrowDownCircle, color: "text-[#D4A853]", bg: "bg-[#D4A853]/15 border-[#D4A853]/20" },
    { label: "Total Withdrawn", value: formatCurrency(stats.totalWithdrawn), icon: ArrowUpCircle, color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20" },
    { label: "AUM", value: formatCurrency(stats.totalDeposited - stats.totalWithdrawn), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20" },
  ]

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-6">
        {/* Action queue — items needing admin attention */}
        {(() => {
          const items = [
            {
              count: pending.deposits,
              singular: "Pending Deposit",
              plural: "Pending Deposits",
              href: "/dashboard/admin/deposits",
              icon: ArrowDownCircle,
              tone: "border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15 text-orange-500 dark:text-orange-300",
              hint: "Review and approve",
            },
            {
              count: pending.withdrawals,
              singular: "Pending Withdrawal",
              plural: "Pending Withdrawals",
              href: "/dashboard/admin/withdrawals",
              icon: ArrowUpCircle,
              tone: "border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-500 dark:text-red-300",
              hint: "Review and process",
            },
            {
              count: pending.kyc,
              singular: "KYC Submission",
              plural: "KYC Submissions",
              href: "/dashboard/admin/kyc",
              icon: Shield,
              tone: "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 text-blue-500 dark:text-blue-300",
              hint: "Verify identity documents",
            },
            {
              count: pending.messages,
              singular: "Unread Message",
              plural: "Unread Messages",
              href: "/dashboard/admin/messages",
              icon: MessageCircle,
              tone: "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/15 text-purple-500 dark:text-purple-300",
              hint: "Reply to support requests",
            },
          ].filter((i) => i.count > 0)

          if (items.length === 0) return null

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-colors ${item.tone}`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {item.count} {item.count === 1 ? item.singular : item.plural}
                      </p>
                      <p className="text-xs opacity-70">{item.hint}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )
              })}
            </div>
          )
        })()}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className={`glass-card rounded-2xl p-5 border ${s.bg}`}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-muted-foreground text-xs mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart + Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-1">Monthly Deposit Volume</h3>
            <p className="text-muted-foreground text-xs mb-4">Last 6 months (approved only)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="volume" fill="#D4A853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Recent Users</h3>
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />)
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                    <div className="w-8 h-8 rounded-full bg-[#D4A853]/20 flex items-center justify-center text-[#D4A853] text-xs font-bold flex-shrink-0">
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs font-medium truncate">{u.full_name}</p>
                      <p className="text-muted-foreground text-[10px] truncate">{u.email}</p>
                    </div>
                    <span className="text-[#D4A853] text-xs font-medium whitespace-nowrap">{formatCurrency(u.balance ?? 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4">Recent Deposits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Amount", "Currency", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-3"><div className="h-8 bg-muted/40 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : recentDeposits.map((dep) => (
                  <tr key={dep.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="text-foreground text-xs">{dep.users?.full_name ?? "—"}</p>
                      <p className="text-muted-foreground text-[10px]">{dep.users?.email ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4 text-[#D4A853] font-semibold text-sm">{formatCurrency(dep.amount)}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs uppercase">{dep.currency}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(dep.created_at)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        dep.status === "approved" ? "badge-approved" : dep.status === "rejected" ? "badge-rejected" : "badge-pending"
                      }`}>{dep.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
