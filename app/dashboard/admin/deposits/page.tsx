"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Eye, Loader2, Search, AlertCircle } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getSignedFileUrl } from "@/lib/storage"
import type { Deposit } from "@/types"

export default function AdminDepositsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [filtered, setFiltered] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [proofModal, setProofModal] = useState<string | null>(null)
  const [proofLoading, setProofLoading] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)

  async function openProof(stored: string) {
    setProofLoading(true)
    setProofError(null)
    setProofModal("loading")
    const signed = await getSignedFileUrl("payment-proofs", stored, 300)
    if (!signed) {
      setProofError("Couldn't load this proof. The file may be missing or you don't have access.")
      setProofModal("error")
    } else {
      setProofModal(signed)
    }
    setProofLoading(false)
  }

  function closeProof() {
    setProofModal(null)
    setProofError(null)
    setProofLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = deposits
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter)
    if (search) list = list.filter((d) =>
      d.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.users?.email?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [deposits, search, statusFilter])

  async function load() {
    const { data } = await supabase
      .from("deposits")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
    if (data) { setDeposits(data as Deposit[]); setFiltered(data as Deposit[]) }
    setLoading(false)
  }

  async function handleApprove(dep: Deposit) {
    setActionLoading(dep.id)
    const { error } = await supabase.rpc("approve_deposit", { deposit_id: dep.id })
    if (error) {
      // Fallback: manual update
      const { error: e2 } = await supabase.from("deposits").update({ status: "approved" }).eq("id", dep.id)
      if (e2) { toast({ title: "Error", description: e2.message, variant: "destructive" }); setActionLoading(null); return }
      // Update user balance manually
      const user = await supabase.from("users").select("balance, total_deposited").eq("id", dep.user_id).single()
      if (user.data) {
        await supabase.from("users").update({
          balance: (user.data.balance ?? 0) + dep.amount,
          total_deposited: (user.data.total_deposited ?? 0) + dep.amount,
        }).eq("id", dep.user_id)
      }
    }
    // Insert notification
    await supabase.from("notifications").insert({
      user_id: dep.user_id,
      title: "Deposit Approved",
      message: `Your deposit of ${formatCurrency(dep.amount)} has been approved.`,
      type: "success",
      is_read: false,
    })
    toast({ title: "Deposit approved", description: `${formatCurrency(dep.amount)} credited to user.` })
    await load()
    setActionLoading(null)
  }

  async function handleReject(dep: Deposit) {
    setActionLoading(dep.id + "-reject")
    const { error } = await supabase.from("deposits").update({ status: "rejected" }).eq("id", dep.id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }) } else {
      await supabase.from("notifications").insert({
        user_id: dep.user_id,
        title: "Deposit Rejected",
        message: `Your deposit of ${formatCurrency(dep.amount)} was rejected. Please contact support.`,
        type: "error",
        is_read: false,
      })
      toast({ title: "Deposit rejected" })
      await load()
    }
    setActionLoading(null)
  }

  return (
    <AdminLayout title="Deposits">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user..." className="bg-muted/40 border-border text-foreground pl-10 h-10" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? "bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/40" : "bg-muted/40 text-muted-foreground border border-border hover:border-border"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Amount", "Currency", "Plan", "Date", "Status", "Proof", "Actions"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium px-4 py-3 first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-10 bg-muted/40 rounded-lg animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted-foreground/70 py-12 text-sm">No deposits found</td></tr>
                ) : filtered.map((dep) => (
                  <tr key={dep.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 first:pl-5">
                      <p className="text-foreground text-xs font-medium">{dep.users?.full_name ?? "—"}</p>
                      <p className="text-muted-foreground text-[10px]">{dep.users?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-[#D4A853] font-semibold">{formatCurrency(dep.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{dep.currency}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{dep.plan ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(dep.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${dep.status === "approved" ? "badge-approved" : dep.status === "rejected" ? "badge-rejected" : "badge-pending"}`}>{dep.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {dep.proof_url ? (
                        <button
                          onClick={() => openProof(dep.proof_url!)}
                          disabled={proofLoading}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/15 transition-colors disabled:opacity-50"
                          title="View proof"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {dep.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(dep)}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === dep.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleReject(dep)}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            {actionLoading === dep.id + "-reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
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

      {/* Proof Modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeProof}
        >
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          {proofModal === "loading" ? (
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl bg-card border border-border px-8 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4A853]" />
              <p className="text-sm text-muted-foreground">Loading proof…</p>
            </div>
          ) : proofModal === "error" ? (
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl bg-card border border-border px-8 py-6 max-w-sm text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm text-foreground font-medium">Can&apos;t load proof</p>
              <p className="text-xs text-muted-foreground">{proofError}</p>
            </div>
          ) : (
            <img
              src={proofModal}
              alt="Payment proof"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-w-2xl max-h-[80vh] rounded-2xl border border-border object-contain bg-card"
            />
          )}
        </div>
      )}
    </AdminLayout>
  )
}
