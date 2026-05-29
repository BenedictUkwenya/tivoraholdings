"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Loader2, Search } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate, truncateAddress } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Withdrawal } from "@/types"

export default function AdminWithdrawalsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [filtered, setFiltered] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = withdrawals
    if (statusFilter !== "all") list = list.filter((w) => w.status === statusFilter)
    if (search) list = list.filter((w) =>
      w.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.users?.email?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [withdrawals, search, statusFilter])

  async function load() {
    const { data } = await supabase.from("withdrawals").select("*, users(full_name, email)").order("created_at", { ascending: false })
    if (data) { setWithdrawals(data as Withdrawal[]); setFiltered(data as Withdrawal[]) }
    setLoading(false)
  }

  async function handleApprove(w: Withdrawal) {
    setActionLoading(w.id)
    const { error } = await supabase.rpc("approve_withdrawal", { withdrawal_id: w.id })
    if (error) {
      const { error: e2 } = await supabase.from("withdrawals").update({ status: "approved" }).eq("id", w.id)
      if (e2) { toast({ title: "Error", description: e2.message, variant: "destructive" }); setActionLoading(null); return }
      const user = await supabase.from("users").select("total_withdrawn").eq("id", w.user_id).single()
      if (user.data) {
        await supabase.from("users").update({ total_withdrawn: (user.data.total_withdrawn ?? 0) + w.amount }).eq("id", w.user_id)
      }
    }
    await supabase.from("notifications").insert({
      user_id: w.user_id,
      title: "Withdrawal Approved",
      message: `Your withdrawal of ${formatCurrency(w.amount)} has been processed.`,
      type: "success",
      is_read: false,
    })
    toast({ title: "Withdrawal approved", description: `${formatCurrency(w.amount)} processed.` })
    await load()
    setActionLoading(null)
  }

  async function handleReject(w: Withdrawal) {
    setActionLoading(w.id + "-reject")
    const user = await supabase.from("users").select("balance").eq("id", w.user_id).single()
    const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", w.id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }) } else {
      // Refund balance
      if (user.data) {
        await supabase.from("users").update({ balance: (user.data.balance ?? 0) + w.amount }).eq("id", w.user_id)
      }
      await supabase.from("notifications").insert({
        user_id: w.user_id,
        title: "Withdrawal Rejected",
        message: `Your withdrawal of ${formatCurrency(w.amount)} was rejected. Your balance has been refunded.`,
        type: "error",
        is_read: false,
      })
      toast({ title: "Withdrawal rejected", description: "Balance refunded to user." })
      await load()
    }
    setActionLoading(null)
  }

  return (
    <AdminLayout title="Withdrawals">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user..." className="bg-muted/40 border-border text-foreground pl-10 h-10" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? "bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/40" : "bg-muted/40 text-muted-foreground border border-border hover:border-border"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Amount", "Currency", "Wallet", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium px-4 py-3 first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-10 bg-muted/40 rounded-lg animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted-foreground/70 py-12 text-sm">No withdrawals found</td></tr>
                ) : filtered.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 first:pl-5">
                      <p className="text-foreground text-xs font-medium">{w.users?.full_name ?? "—"}</p>
                      <p className="text-muted-foreground text-[10px]">{w.users?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-orange-400 font-semibold">{formatCurrency(w.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{w.currency}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{truncateAddress(w.wallet_address ?? "", 8)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(w.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${w.status === "approved" ? "badge-approved" : w.status === "rejected" ? "badge-rejected" : "badge-pending"}`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {w.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleApprove(w)} disabled={!!actionLoading} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-50" title="Approve">
                            {actionLoading === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleReject(w)} disabled={!!actionLoading} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50" title="Reject">
                            {actionLoading === w.id + "-reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
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
