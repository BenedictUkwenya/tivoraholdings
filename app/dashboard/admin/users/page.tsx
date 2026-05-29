"use client"

import { useEffect, useState } from "react"
import { Search, ShieldBan, CheckCircle2, Plus, X, Loader2, Pencil, AlertTriangle } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types"

export default function AdminUsersPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditType, setCreditType] = useState("bonus")
  const [creditDesc, setCreditDesc] = useState("")
  const [crediting, setCrediting] = useState(false)

  // Direct balance edit
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newBalance, setNewBalance] = useState("")
  const [savingBalance, setSavingBalance] = useState(false)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(users.filter((u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.referral_code?.toLowerCase().includes(q)
    ))
  }, [search, users])

  async function load() {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    if (data) { setUsers(data as User[]); setFiltered(data as User[]) }
    setLoading(false)
  }

  async function toggleSuspend(user: User) {
    setActionLoading(user.id)
    const { error } = await supabase.from("users").update({ is_suspended: !user.is_suspended }).eq("id", user.id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: user.is_suspended ? "User unsuspended" : "User suspended" })
      await load()
    }
    setActionLoading(null)
  }

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser || !creditAmount) return
    setCrediting(true)
    const amount = parseFloat(creditAmount)

    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: selectedUser.id,
      type: creditType,
      amount,
      description: creditDesc || `Manual ${creditType} by admin`,
    })
    if (txErr) {
      toast({ title: "Error", description: txErr.message, variant: "destructive" })
      setCrediting(false); return
    }

    const { error: balErr } = await supabase.from("users").update({
      balance: (selectedUser.balance ?? 0) + amount,
      total_earnings: creditType === "earning" || creditType === "bonus"
        ? (selectedUser.total_earnings ?? 0) + amount
        : selectedUser.total_earnings,
    }).eq("id", selectedUser.id)

    if (balErr) { toast({ title: "Balance update failed", description: balErr.message, variant: "destructive" }) }
    else {
      toast({ title: "Credit applied", description: `${formatCurrency(amount)} added to ${selectedUser.full_name}` })
      setSelectedUser(null); setCreditAmount(""); setCreditDesc("")
      await load()
    }
    setCrediting(false)
  }

  function openEditBalance(user: User) {
    setEditingUser(user)
    setNewBalance(String(user.balance ?? 0))
  }

  async function handleSaveBalance(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    const next = parseFloat(newBalance)
    if (Number.isNaN(next) || next < 0) {
      toast({ title: "Invalid balance", description: "Enter a non-negative number.", variant: "destructive" })
      return
    }
    setSavingBalance(true)
    const { error } = await supabase
      .from("users")
      .update({ balance: next })
      .eq("id", editingUser.id)

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" })
    } else {
      toast({
        title: "Balance updated",
        description: `${editingUser.full_name}: ${formatCurrency(editingUser.balance ?? 0)} → ${formatCurrency(next)}`,
      })
      setEditingUser(null)
      setNewBalance("")
      await load()
    }
    setSavingBalance(false)
  }

  return (
    <AdminLayout title="Users">
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="bg-muted/40 border-border text-foreground pl-10 h-10"
            />
          </div>
          <div className="text-muted-foreground text-sm flex items-center">{filtered.length} users</div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Balance", "Deposited", "Joined", "KYC", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-5 py-3">
                      <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
                    </td></tr>
                  ))
                ) : filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 first:pl-5">
                      <p className="text-foreground text-xs font-medium">{u.full_name}</p>
                      <p className="text-muted-foreground text-[10px]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#D4A853] font-semibold text-sm">{formatCurrency(u.balance ?? 0)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatCurrency(u.total_deposited ?? 0)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                        u.kyc_status === "verified" ? "badge-verified" : u.kyc_status === "pending" ? "badge-pending" : "bg-muted text-muted-foreground"
                      }`}>{u.kyc_status?.replace("_", " ") ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${u.is_suspended ? "badge-rejected" : "badge-approved"}`}>
                        {u.is_suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 last:pr-5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSuspend(u)}
                          disabled={actionLoading === u.id}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_suspended ? "text-emerald-400 hover:bg-emerald-500/15" : "text-orange-400 hover:bg-orange-500/15"}`}
                          title={u.is_suspended ? "Unsuspend" : "Suspend"}
                        >
                          {actionLoading === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.is_suspended ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-[#D4A853] hover:bg-[#D4A853]/15 transition-colors"
                          title="Credit Balance (creates transaction)"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditBalance(u)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/15 transition-colors"
                          title="Edit Balance Directly"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
            <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-[#D4A853]/20">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-foreground font-semibold">Credit Balance</h3>
                  <p className="text-muted-foreground text-xs">{selectedUser.full_name}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCredit} className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Transaction Type</label>
                  <select
                    value={creditType}
                    onChange={(e) => setCreditType(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  >
                    {["bonus", "earning", "referral_bonus", "deposit"].map((t) => (
                      <option key={t} value={t} className="bg-popover">{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Amount (USD)</label>
                  <Input
                    type="number" min="0.01" step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="e.g. 500.00"
                    required
                    className="bg-muted/50 border-border text-foreground h-11"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Description (optional)</label>
                  <Input
                    value={creditDesc}
                    onChange={(e) => setCreditDesc(e.target.value)}
                    placeholder="Reason or note"
                    className="bg-muted/50 border-border text-foreground h-11"
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full h-11" disabled={crediting}>
                  {crediting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Apply Credit`}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Balance Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
            <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-foreground font-semibold">Edit Balance</h3>
                  <p className="text-muted-foreground text-xs">{editingUser.full_name}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-5">
                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                  This directly overwrites the user&apos;s balance and does <strong>not</strong> create a transaction record. Use the <strong>+</strong> button if you need an audit trail.
                </p>
              </div>

              <form onSubmit={handleSaveBalance} className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Current Balance</label>
                  <div className="px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground text-sm">
                    {formatCurrency(editingUser.balance ?? 0)}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">New Balance (USD)</label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                    className="bg-muted/50 border-border text-foreground h-11"
                  />
                </div>
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setEditingUser(null)}
                    disabled={savingBalance}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" className="flex-1 h-11" disabled={savingBalance}>
                    {savingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Balance"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
