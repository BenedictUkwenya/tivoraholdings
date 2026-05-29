"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, Users, Gift, TrendingUp, ArrowRight, Share2 } from "lucide-react"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { User, Referral } from "@/types"

export default function ReferralsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }

      const [userData, refData] = await Promise.all([
        supabase.from("users").select("*").eq("id", session.user.id).single(),
        supabase
          .from("referrals")
          .select("*, referred_user:referred_id(full_name, email, created_at)")
          .eq("referrer_id", session.user.id)
          .order("created_at", { ascending: false }),
      ])

      if (userData.data) setUser(userData.data as User)
      if (refData.data) setReferrals(refData.data as Referral[])
      setLoading(false)
    }
    load()
  }, [])

  const referralLink = user
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/signup?ref=${user.referral_code}`
    : ""

  const totalBonus = referrals.reduce((s, r) => s + r.bonus_amount, 0)
  const paidBonus = referrals.filter((r) => r.status === "paid").reduce((s, r) => s + r.bonus_amount, 0)

  function copyCode() {
    if (!user) return
    navigator.clipboard.writeText(user.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <UserLayout title="Referrals">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Referrals", value: referrals.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/20" },
            { label: "Total Bonus Earned", value: formatCurrency(totalBonus), icon: Gift, color: "text-[#D4A853]", bg: "bg-[#D4A853]/15 border-[#D4A853]/20" },
            { label: "Paid Out", value: formatCurrency(paidBonus), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20" },
          ].map((s) => (
            <div key={s.label} className={`glass-card rounded-2xl p-5 border ${s.bg}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-muted-foreground text-xs mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Referral Code & Link */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-foreground font-semibold mb-5 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#D4A853]" /> Your Referral Details
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">Referral Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-3 font-mono text-[#D4A853] font-bold text-lg tracking-widest">
                  {loading ? "Loading..." : user?.referral_code ?? "—"}
                </div>
                <Button variant="outline" size="icon" onClick={copyCode} className="h-12 w-12 rounded-xl">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">Referral Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-3 text-muted-foreground text-sm truncate">
                  {loading ? "Loading..." : referralLink}
                </div>
                <Button variant="outline" size="icon" onClick={copyLink} className="h-12 w-12 rounded-xl">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/20">
            <p className="text-[#D4A853] text-sm font-medium mb-1">How it works</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Share your referral code with friends. When they sign up and make their first deposit, you earn a bonus automatically credited to your account.
            </p>
          </div>
        </div>

        {/* Referral History */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-foreground font-semibold mb-5">Referral History</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground/70 text-sm">No referrals yet</p>
              <p className="text-muted-foreground/40 text-xs mt-1">Share your code to start earning bonuses</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">User</th>
                    <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">Joined</th>
                    <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">Bonus</th>
                    <th className="text-left text-muted-foreground text-xs font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-foreground text-xs font-medium">{ref.referred_user?.full_name ?? "—"}</p>
                        <p className="text-muted-foreground text-[10px]">{ref.referred_user?.email ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {ref.referred_user?.created_at ? formatDate(ref.referred_user.created_at) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-[#D4A853] font-semibold text-sm">
                        {formatCurrency(ref.bonus_amount)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                          ref.status === "paid" ? "badge-approved" : "badge-pending"
                        }`}>
                          {ref.status}
                        </span>
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
