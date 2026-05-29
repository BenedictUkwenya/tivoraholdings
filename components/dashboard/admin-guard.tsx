"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      const { data } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()
      if (!data?.is_admin) { router.push("/dashboard/user"); return }
      setAuthorized(true)
    }
    check()
  }, [])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#D4A853] border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
