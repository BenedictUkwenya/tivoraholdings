"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TivoraLogo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      router.push("/dashboard/user")
      router.refresh()
    } catch {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Soft warm glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-100 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <TivoraLogo size={40} />
            <span className="font-bold text-xl text-zinc-900">
              Tivora<span className="text-amber-600">Holdings</span>
            </span>
          </Link>
          <p className="text-zinc-500 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-black text-zinc-900 mb-6">Welcome back</h1>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-zinc-700 text-sm font-medium">Email address</Label>
              <Input
                id="email" type="email" autoComplete="email"
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-700 text-sm font-medium">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 h-11 pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed mt-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing you in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {loading && (
              <p className="text-center text-xs text-zinc-500 -mt-2">
                Loading your dashboard, this can take a few seconds…
              </p>
            )}
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-amber-600 hover:text-amber-700 font-semibold">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
