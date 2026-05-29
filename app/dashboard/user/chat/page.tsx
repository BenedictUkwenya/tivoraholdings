"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import type { SupportMessage } from "@/types"

const BOT_INTRO: SupportMessage = {
  id: "bot-intro",
  user_id: "",
  message:
    "Hi! 👋 Welcome to TivoraHoldings Support. I'm your virtual assistant. How can I help you today? You can ask about deposits, withdrawals, KYC, investment plans, or type 'agent' to connect with a live support agent.",
  is_from_admin: true,
  is_bot: true,
  is_read: true,
  created_at: new Date().toISOString(),
}

const BOT_REPLIES: Record<string, string> = {
  deposit:
    "To make a deposit, navigate to the **Deposit** page from the sidebar. Upload your payment proof, select your preferred currency, and choose your investment plan. Deposits are reviewed within 1–24 hours.",
  withdraw:
    "To withdraw funds, go to the **Withdraw** page. Enter the amount and your wallet address. Withdrawals are processed within 24–48 hours after approval. Minimum withdrawal is $50.",
  kyc: "KYC (Know Your Customer) verification is required to unlock full platform features. Go to **KYC Verification** in the sidebar and upload a valid government-issued ID.",
  balance:
    "Your available balance is shown on your dashboard overview. It updates automatically when deposits are approved or earnings are credited.",
  plan: "TivoraHoldings offers three plans: **Starter** (5% ROI), **Growth** (10% ROI), and **Elite** (18% ROI). Choose a plan when making your deposit.",
  referral:
    "Earn bonuses by referring friends! Share your unique referral code from the **Referrals** page. You'll earn a bonus for every successful referral.",
  agent:
    "I'm connecting you to a live support agent. Please wait — an agent will respond as soon as possible. Our support hours are Monday–Friday, 9 AM–6 PM UTC.",
  default:
    "Thank you for reaching out! For specific account issues, our team will review your message and respond shortly. Feel free to ask about deposits, withdrawals, KYC, or investment plans.",
}

function getBotReply(message: string): string {
  const lower = message.toLowerCase()
  for (const [key, reply] of Object.entries(BOT_REPLIES)) {
    if (lower.includes(key)) return reply
  }
  return BOT_REPLIES.default
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([BOT_INTRO])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      if (cancelled) return
      setUserId(session.user.id)

      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true })

      if (cancelled) return
      if (data && data.length > 0) {
        setMessages([BOT_INTRO, ...(data as SupportMessage[])])
      }
      setLoading(false)

      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", session.user.id)
        .eq("is_from_admin", true)
        .eq("is_read", false)

      if (cancelled) return

      channel = supabase
        .channel(`support-messages-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_messages",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const newMsg = payload.new as SupportMessage
            setMessages((prev) =>
              prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
            )
          }
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !userId || sending) return
    const text = input.trim()
    setInput("")
    setSending(true)

    const { data, error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: text,
      is_from_admin: false,
      is_bot: false,
      is_read: false,
    }).select().single()

    if (!error && data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as SupportMessage]
      )

      // Simulate bot reply after 1.5s
      setTimeout(async () => {
        const reply = getBotReply(text)
        const { data: botMsg } = await supabase.from("support_messages").insert({
          user_id: userId,
          message: reply,
          is_from_admin: true,
          is_bot: true,
          is_read: true,
        }).select().single()
        if (botMsg) {
          setMessages((prev) =>
            prev.some((m) => m.id === botMsg.id) ? prev : [...prev, botMsg as SupportMessage]
          )
        }
      }, 1500)
    }
    setSending(false)
  }

  return (
    <UserLayout title="Support Chat">
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-[#D4A853]/20 border border-[#D4A853]/30 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-[#D4A853]" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">TivoraHoldings Support</p>
            <p className="text-emerald-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Online — Usually replies instantly
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 text-[#D4A853] animate-spin" />
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.is_from_admin ? "justify-start" : "justify-end"}`}
              >
                {msg.is_from_admin && (
                  <div className="w-7 h-7 rounded-full bg-[#D4A853]/20 border border-[#D4A853]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {msg.is_bot ? (
                      <Bot className="h-3.5 w-3.5 text-[#D4A853]" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-[#D4A853]" />
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.is_from_admin ? "" : "order-first"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.is_from_admin
                        ? "bg-muted/50 text-foreground/80 rounded-tl-sm"
                        : "bg-[#D4A853] text-[#030B18] font-medium rounded-tr-sm ml-auto"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <p className={`text-muted-foreground/60 text-[10px] mt-1 ${msg.is_from_admin ? "text-left" : "text-right"}`}>
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage() }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#D4A853]/40"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="h-10 w-10 p-0 rounded-xl"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </UserLayout>
  )
}
