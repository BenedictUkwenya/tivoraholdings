"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Shield, Key, Moon, Globe, Loader2, Check } from "lucide-react"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      setLoading(false)
    }
    load()
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" })
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Password updated", description: "Your password has been changed successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
    setSavingPassword(false)
  }

  return (
    <UserLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-foreground font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Receive updates on deposits, withdrawals, and account activity", value: emailNotifs, setter: setEmailNotifs },
              { label: "Push Notifications", desc: "Receive real-time alerts on your device", value: pushNotifs, setter: setPushNotifs },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={item.value}
                  onCheckedChange={(v) => {
                    item.setter(v)
                    toast({ title: `${item.label} ${v ? "enabled" : "disabled"}` })
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-[#D4A853]" />
            </div>
            <h2 className="text-foreground font-semibold">Security</h2>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border mb-5">
            <div>
              <p className="text-foreground text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-muted-foreground text-xs mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(v) => {
                setTwoFactorEnabled(v)
                toast({ title: `2FA ${v ? "enabled" : "disabled"}`, description: v ? "Two-factor authentication is now active." : "Two-factor authentication has been disabled." })
              }}
            />
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-foreground/80 text-sm font-medium">Change Password</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                className="bg-muted/40 border-border text-foreground h-11"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="bg-muted/40 border-border text-foreground h-11"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full h-11" disabled={savingPassword || !newPassword || !confirmPassword}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Key className="h-4 w-4" /> Update Password</>}
            </Button>
          </form>
        </div>

        {/* Preferences */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Settings className="h-4 w-4 text-purple-400" />
            </div>
            <h2 className="text-foreground font-semibold">Preferences</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Language", value: "English (US)", icon: Globe },
              { label: "Theme", value: "Dark Mode", icon: Moon },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">{item.label}</span>
                </div>
                <span className="text-muted-foreground text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
