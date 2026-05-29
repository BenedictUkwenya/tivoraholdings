"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        }
      )
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSuccess(true)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030B18] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,83,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gold-gradient flex items-center justify-center glow-gold">
              <span className="text-[#030B18] font-black text-base">TH</span>
            </div>
            <span className="font-bold text-xl text-white">
              Tivora<span className="gold-gradient-text">Holdings</span>
            </span>
          </Link>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {success ? (
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">
                  Check your inbox
                </h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="text-[#D4A853] font-medium">{email}</span>.
                  The link expires in 1 hour.
                </p>
              </div>
              <Button variant="outline-gold" className="w-full" asChild>
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#030B18]" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">
                  Forgot your password?
                </h1>
                <p className="text-sm text-white/50">
                  Enter your email address and we&apos;ll send you a link to
                  reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white/70 text-sm">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#D4A853]/50 h-11"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-white/40 mt-5">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#D4A853] hover:text-[#F0C97A] font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
