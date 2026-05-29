"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Eye, Loader2, Shield, Search, AlertCircle } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getSignedFileUrl } from "@/lib/storage"
import type { KYCVerification } from "@/types"

export default function AdminKYCPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [kycs, setKycs] = useState<KYCVerification[]>([])
  const [filtered, setFiltered] = useState<KYCVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [search, setSearch] = useState("")
  const [viewDoc, setViewDoc] = useState<string | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  async function openDoc(stored: string | null) {
    if (!stored) return
    setDocLoading(true)
    setDocError(null)
    setViewDoc("loading")
    const signed = await getSignedFileUrl("kyc-documents", stored, 300)
    if (!signed) {
      setDocError("Couldn't load this document. The file may be missing or you don't have access.")
      setViewDoc("error")
    } else {
      setViewDoc(signed)
    }
    setDocLoading(false)
  }

  function closeDoc() {
    setViewDoc(null)
    setDocError(null)
    setDocLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = kycs
    if (statusFilter !== "all") list = list.filter((k) => k.status === statusFilter)
    if (search) list = list.filter((k) =>
      k.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      k.users?.email?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [kycs, search, statusFilter])

  async function load() {
    const { data } = await supabase.from("kyc_verifications").select("*, users(full_name, email)").order("submitted_at", { ascending: false })
    if (data) { setKycs(data as KYCVerification[]); setFiltered(data as KYCVerification[]) }
    setLoading(false)
  }

  async function handleApprove(kyc: KYCVerification) {
    setActionLoading(kyc.id)
    const { error } = await supabase.from("kyc_verifications").update({ status: "verified", reviewed_at: new Date().toISOString() }).eq("id", kyc.id)
    if (!error) {
      await supabase.from("users").update({ kyc_status: "verified" }).eq("id", kyc.user_id)
      await supabase.from("notifications").insert({ user_id: kyc.user_id, title: "KYC Approved", message: "Your identity has been verified. You now have full platform access.", type: "success", is_read: false })
      toast({ title: "KYC approved" })
      await load()
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setActionLoading(null)
  }

  async function handleReject(kyc: KYCVerification, reason = "Documents could not be verified.") {
    setActionLoading(kyc.id + "-reject")
    const { error } = await supabase.from("kyc_verifications").update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", kyc.id)
    if (!error) {
      await supabase.from("users").update({ kyc_status: "rejected" }).eq("id", kyc.user_id)
      await supabase.from("notifications").insert({ user_id: kyc.user_id, title: "KYC Rejected", message: `Your KYC was rejected: ${reason}`, type: "error", is_read: false })
      toast({ title: "KYC rejected" })
      await load()
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setActionLoading(null)
  }

  return (
    <AdminLayout title="KYC Reviews">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user..." className="bg-muted/40 border-border text-foreground pl-10 h-10" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "verified", "rejected"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? "bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/40" : "bg-muted/40 text-muted-foreground border border-border hover:border-border"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Doc Type", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                    <th key={h} className="text-left text-muted-foreground text-xs font-medium px-4 py-3 first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-10 bg-muted/40 rounded-lg animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted-foreground/70 py-12 text-sm flex-col">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No KYC submissions {statusFilter !== "all" ? `with status: ${statusFilter}` : ""}
                  </td></tr>
                ) : filtered.map((kyc) => (
                  <tr key={kyc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 first:pl-5">
                      <p className="text-foreground text-xs font-medium">{kyc.users?.full_name ?? "—"}</p>
                      <p className="text-muted-foreground text-[10px]">{kyc.users?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{kyc.document_type?.replace("_", " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(kyc.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${kyc.status === "verified" ? "badge-verified" : kyc.status === "rejected" ? "badge-rejected" : "badge-pending"}`}>{kyc.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {kyc.document_front_url && (
                          <button onClick={() => openDoc(kyc.document_front_url)} disabled={docLoading} className="px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] hover:bg-muted disabled:opacity-50">Front</button>
                        )}
                        {kyc.document_back_url && (
                          <button onClick={() => openDoc(kyc.document_back_url)} disabled={docLoading} className="px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] hover:bg-muted disabled:opacity-50">Back</button>
                        )}
                        {kyc.selfie_url && (
                          <button onClick={() => openDoc(kyc.selfie_url)} disabled={docLoading} className="px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] hover:bg-muted disabled:opacity-50">Selfie</button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {kyc.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleApprove(kyc)} disabled={!!actionLoading} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-50">
                            {actionLoading === kyc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleReject(kyc)} disabled={!!actionLoading} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50">
                            {actionLoading === kyc.id + "-reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
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

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDoc}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          {viewDoc === "loading" ? (
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl bg-card border border-border px-8 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4A853]" />
              <p className="text-sm text-muted-foreground">Loading document…</p>
            </div>
          ) : viewDoc === "error" ? (
            <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl bg-card border border-border px-8 py-6 max-w-sm text-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm text-foreground font-medium">Can&apos;t load document</p>
              <p className="text-xs text-muted-foreground">{docError}</p>
            </div>
          ) : (
            <img
              src={viewDoc}
              alt="KYC document"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-w-2xl max-h-[80vh] rounded-2xl border border-border object-contain bg-card"
            />
          )}
        </div>
      )}
    </AdminLayout>
  )
}
