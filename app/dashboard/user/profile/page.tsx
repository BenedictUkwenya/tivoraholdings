"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, Camera, Save, Loader2 } from "lucide-react"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import type { User as UserType } from "@/types"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      const { data } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (data) {
        setUser(data as UserType)
        setFullName(data.full_name)
        setPhone(data.phone ?? "")
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from("users").update({ full_name: fullName, phone }).eq("id", user.id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setUser({ ...user, full_name: fullName, phone })
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." })
    }
    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 5MB.", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      await supabase.from("users").update({ avatar_url: data.publicUrl }).eq("id", user.id)
      setUser({ ...user, avatar_url: data.publicUrl })
      toast({ title: "Avatar updated", description: "Your profile picture has been updated." })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <UserLayout title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar Card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-foreground font-semibold mb-5">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-[#D4A853]/30">
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-[#D4A853]/20 text-[#D4A853] text-xl font-bold">
                  {user ? getInitials(user.full_name) : "??"}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[#D4A853] animate-spin" />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4A853]/15 border border-[#D4A853]/30 text-[#D4A853] text-sm font-medium hover:bg-[#D4A853]/25 transition-colors">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </div>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <p className="text-muted-foreground/70 text-xs mt-1.5">JPG, PNG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-foreground font-semibold mb-5">Personal Information</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-muted/40 border-border text-foreground pl-10 h-11"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="bg-muted/30 border-border/60 text-muted-foreground pl-10 h-11"
                  />
                </div>
                <p className="text-muted-foreground/70 text-xs mt-1.5">Email cannot be changed</p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-muted/40 border-border text-foreground pl-10 h-11"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <Button type="submit" variant="gold" className="w-full h-11" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Changes</>}
              </Button>
            </form>
          )}
        </div>

        {/* Account Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-foreground font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Account ID", value: user?.id?.slice(0, 8).toUpperCase() ?? "—" },
              { label: "Member Since", value: user ? formatDate(user.created_at) : "—" },
              { label: "Referral Code", value: user?.referral_code ?? "—" },
              { label: "KYC Status", value: user?.kyc_status?.replace("_", " ") ?? "—" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-foreground text-sm font-medium capitalize">{loading ? "—" : item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
