"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/types"

export default function AdminTransactionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = transactions
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter)
    if (search) list = list.filter((t) => t.description?.toLowerCase().includes(search.toLowerCase()))
    setFiltered(list)
  }, [transactions, search, typeFilter])

  async function load() {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200)
    if (data) { setTransactions(data as Transaction[]); setFiltered(data as Transaction[]) }
    setLoading(false)
  }

  const typeColors: Record<string, string> = {
    deposit: "bg-blue-500/20 text-blue-400",
    withdrawal: "bg-orange-500/20 text-orange-400",
    earning: "bg-emerald-500/20 text-emerald-400",
    referral_bonus: "bg-purple-500/20 text-purple-400",
    bonus: "bg-[#D4A853]/20 text-[#D4A853]",
  }

  return (
    <AdminLayout title="Transactions">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description..." className="bg-muted/40 border-border text-foreground pl-10 h-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "deposit", "withdrawal", "earning", "referral_bonus", "bonus"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${typeFilter === t ? "bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/40" : "bg-muted/40 text-muted-foreground border border-border hover:border-border"}`}>{t.replace("_", " ")}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Type", "Amount", "Description", "Date"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium px-4 py-3 first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-8 bg-muted/40 rounded-lg animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted-foreground/70 py-12 text-sm">No transactions found</td></tr>
                ) : filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 first:pl-5 font-mono text-muted-foreground/70 text-[10px]">{tx.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${typeColors[tx.type] ?? "bg-muted text-muted-foreground"}`}>{tx.type.replace("_", " ")}</span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${tx.type === "withdrawal" ? "text-orange-400" : "text-emerald-400"}`}>{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[240px] truncate">{tx.description}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(tx.created_at)}</td>
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
