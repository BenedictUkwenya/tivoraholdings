"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Bot, User as UserIcon, Loader2, Users, MessageCircle } from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { formatDateTime } from "@/lib/utils"
import type { SupportMessage, User } from "@/types"

export default function AdminMessagesPage() {
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    if (!selectedUserId) return
    let cancelled = false

    async function loadMessages(userId: string) {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
      if (cancelled) return
      if (data) setMessages(data as SupportMessage[])

      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_from_admin", false)
        .eq("is_read", false)
    }

    loadMessages(selectedUserId)

    const channel = supabase
      .channel(`admin-support-${selectedUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${selectedUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          )
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [selectedUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadUsers() {
    const { data } = await supabase
      .from("support_messages")
      .select("user_id")
      .eq("is_from_admin", false)
    const ids = [...new Set(data?.map((m: any) => m.user_id) ?? [])]
    if (ids.length > 0) {
      const { data: usersData } = await supabase.from("users").select("id, full_name, email").in("id", ids)
      setUsers(usersData as User[] ?? [])
      if (usersData && usersData.length > 0) setSelectedUserId(usersData[0].id)
    }
    setLoading(false)
  }

  async function sendReply() {
    if (!input.trim() || !selectedUserId || sending) return
    setSending(true)
    const { data } = await supabase.from("support_messages").insert({
      user_id: selectedUserId,
      message: input.trim(),
      is_from_admin: true,
      is_bot: false,
      is_read: false,
    }).select().single()
    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as SupportMessage]
      )
    }
    setInput("")
    setSending(false)
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <AdminLayout title="Support Messages">
      <div className="glass-card rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
        {/* User List */}
        <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <p className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground/70 text-xs">No messages yet</div>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${
                    selectedUserId === u.id ? "bg-[#D4A853]/10 border-l-2 border-l-[#D4A853]" : "hover:bg-muted/40"
                  }`}
                >
                  <p className="text-foreground text-xs font-medium truncate">{u.full_name}</p>
                  <p className="text-muted-foreground text-[10px] truncate">{u.email}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {selectedUserId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
              <div className="w-7 h-7 rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                <UserIcon className="h-3.5 w-3.5 text-[#D4A853]" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">{selectedUser?.full_name ?? "User"}</p>
                <p className="text-muted-foreground text-xs">{selectedUser?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.is_from_admin ? "justify-end" : "justify-start"}`}>
                  {!msg.is_from_admin && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.is_from_admin ? "bg-[#D4A853] text-[#030B18] font-medium rounded-tr-sm" : "bg-muted/50 text-foreground/80 rounded-tl-sm"}`}>
                      {msg.is_bot && <span className="block text-[10px] opacity-50 mb-0.5">Bot</span>}
                      {msg.message}
                    </div>
                    <p className={`text-muted-foreground/60 text-[9px] mt-0.5 ${msg.is_from_admin ? "text-right" : "text-left"}`}>{formatDateTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); sendReply() }} className="flex gap-2">
                <input
                  type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Reply to user..."
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#D4A853]/40"
                  disabled={sending}
                />
                <button
                  type="submit" disabled={!input.trim() || sending}
                  className="h-10 w-10 rounded-xl bg-[#D4A853] text-[#030B18] flex items-center justify-center hover:bg-[#E8C06A] disabled:opacity-50 flex-shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground/70 text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
