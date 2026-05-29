"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface AdminPendingCounts {
  deposits: number
  withdrawals: number
  kyc: number
  messages: number
  loading: boolean
}

const INITIAL: AdminPendingCounts = {
  deposits: 0,
  withdrawals: 0,
  kyc: 0,
  messages: 0,
  loading: true,
}

/**
 * Live count of items needing admin attention.
 * Subscribes to realtime changes so badges/alerts update without a refresh.
 */
export function useAdminPendingCounts(): AdminPendingCounts {
  const [counts, setCounts] = useState<AdminPendingCounts>(INITIAL)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function refresh() {
      const [dep, wd, kyc, msg] = await Promise.all([
        supabase
          .from("deposits")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("withdrawals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("kyc_verifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("support_messages")
          .select("id", { count: "exact", head: true })
          .eq("is_from_admin", false)
          .eq("is_read", false),
      ])

      if (cancelled) return
      setCounts({
        deposits: dep.count ?? 0,
        withdrawals: wd.count ?? 0,
        kyc: kyc.count ?? 0,
        messages: msg.count ?? 0,
        loading: false,
      })
    }

    refresh()

    const channelName = `admin-pending-counts-${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_verifications" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, refresh)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return counts
}
