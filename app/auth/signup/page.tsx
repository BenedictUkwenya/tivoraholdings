"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TivoraLogo } from "@/components/logo"
import { signup } from "@/lib/api/auth"

interface PasswordStrength {
  hasMinLength: boolean
  hasNumber: boolean
  hasSpecial: boolean
}
function getStrength(pw: string): PasswordStrength {
  return { hasMinLength: pw.length >= 8, hasNumber: /\d/.test(pw), hasSpecial: /[!@#$%^&*]/.test(pw) }
}
function strengthScore(s: PasswordStrength): number { return Object.values(s).filter(Boolean).length }
const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-emerald-400"]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", referralCode: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pwStrength = getStrength(form.password)
  const score = strengthScore(pwStrength)
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return }
    if (score < 2) { setError("Please choose a stronger password."); return }
    if (!agreed) { setError("You must agree to the Terms of Service."); return }
    setLoading(true)
    try {
      await signup({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, referralCode: form.referralCode || undefined })
      router.push("/dashboard/user")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      setLoading(false)
    }
  }

  const inputClass = "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 h-11"

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <TivoraLogo size={40} />
            <span className="font-bold text-xl text-zinc-900">Tivora<span className="text-amber-600">Holdings</span></span>
          </Link>
          <p className="text-zinc-500 text-sm">Create your investor account</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-black text-zinc-900 mb-6">Get started</h1>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { id: "fullName", label: "Full Name", type: "text", placeholder: "John Doe", auto: "name" },
              { id: "email", label: "Email Address", type: "email", placeholder: "you@example.com", auto: "email" },
              { id: "phone", label: "Phone Number", type: "tel", placeholder: "+1 (555) 000-0000", auto: "tel" },
            ].map((f) => (
              <div key={f.id} className="flex flex-col gap-2">
                <Label htmlFor={f.id} className="text-zinc-700 text-sm font-medium">{f.label}</Label>
                <Input id={f.id} type={f.type} autoComplete={f.auto} placeholder={f.placeholder} value={form[f.id as keyof typeof form]} onChange={set(f.id as keyof typeof form)} required className={inputClass} />
              </div>
            ))}

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-zinc-700 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={form.password} onChange={set("password")} required className={`${inputClass} pr-11`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map(level => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-all ${score >= level ? strengthColors[score] : "bg-zinc-200"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-zinc-700 text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={form.confirmPassword} onChange={set("confirmPassword")} required className={`${inputClass} pr-11`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="referralCode" className="text-zinc-700 text-sm font-medium">Referral Code <span className="text-zinc-400 font-normal">(optional)</span></Label>
              <Input id="referralCode" type="text" placeholder="e.g. TH-XXXXXXXX" value={form.referralCode} onChange={set("referralCode")} className={inputClass} />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${agreed ? "bg-amber-600 border-amber-600" : "border-zinc-300 bg-white"}`}
                onClick={() => setAgreed(v => !v)}
              >
                {agreed && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-xs text-zinc-500 leading-relaxed">
                I agree to the <Link href="#" className="text-amber-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-amber-600 hover:underline">Privacy Policy</Link>. I understand investments carry risk.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your account…</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {loading && (
              <p className="text-center text-xs text-zinc-500">
                Setting up your dashboard, this can take a few seconds…
              </p>
            )}
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-amber-600 hover:text-amber-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
