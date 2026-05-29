"use client"

import { useState } from "react"
import { Settings, Globe, Shield, Bell, Database, Save, Loader2, DollarSign } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [minDeposit, setMinDeposit] = useState("50")
  const [minWithdrawal, setMinWithdrawal] = useState("50")
  const [referralBonus, setReferralBonus] = useState("25")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [autoApprove, setAutoApprove] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast({ title: "Settings saved", description: "Platform settings have been updated." })
    setSaving(false)
  }

  return (
    <AdminLayout title="Platform Settings">
      <div className="max-w-2xl space-y-6">
        {/* Platform Config */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/25 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#D4A853]" />
            </div>
            <h2 className="text-foreground font-semibold">Transaction Limits</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { label: "Minimum Deposit (USD)", value: minDeposit, setter: setMinDeposit },
              { label: "Minimum Withdrawal (USD)", value: minWithdrawal, setter: setMinWithdrawal },
              { label: "Referral Bonus (USD)", value: referralBonus, setter: setReferralBonus },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">{f.label}</label>
                <Input type="number" min="0" value={f.value} onChange={(e) => f.setter(e.target.value)} className="bg-muted/40 border-border text-foreground h-11" />
              </div>
            ))}
            <Button type="submit" variant="gold" className="h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Settings</>}
            </Button>
          </form>
        </div>

        {/* Automation */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <Database className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-foreground font-semibold">Automation</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Auto-Approve Deposits", desc: "Automatically approve small deposits under $100", value: autoApprove, setter: setAutoApprove },
              { label: "Email Notifications", desc: "Send email alerts for all platform events", value: emailNotifs, setter: setEmailNotifs },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-foreground text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={(v) => { item.setter(v); toast({ title: `${item.label} ${v ? "enabled" : "disabled"}` }) }} />
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="glass-card rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <h2 className="text-foreground font-semibold">Maintenance Mode</h2>
          </div>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div>
              <p className="text-foreground text-sm font-medium">Enable Maintenance Mode</p>
              <p className="text-red-400/70 text-xs">All users will see a maintenance page and cannot access the platform</p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={(v) => {
                setMaintenanceMode(v)
                toast({ title: v ? "⚠️ Maintenance Mode ON" : "Maintenance Mode OFF", description: v ? "Users cannot access the platform." : "Platform is live." })
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
