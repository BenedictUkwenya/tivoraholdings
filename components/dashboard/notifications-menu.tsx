"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Info, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  user_id: string;
  type: "deposit" | "withdrawal" | "earning" | "info" | "alert";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  deposit: DollarSign,
  withdrawal: TrendingUp,
  earning: TrendingUp,
  info: Info,
  alert: AlertCircle,
};

const typeColor: Record<string, string> = {
  deposit: "text-emerald-500 bg-emerald-500/10",
  withdrawal: "text-blue-500 bg-blue-500/10",
  earning: "text-[#D4A853] bg-[#D4A853]/10",
  info: "text-muted-foreground bg-muted",
  alert: "text-orange-500 bg-orange-500/10",
};

export default function NotificationsMenu() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);
    }

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full gold-gradient flex items-center justify-center text-[9px] font-bold text-[#030B18]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-border bg-popover shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-foreground font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-muted-foreground text-xs">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-[#D4A853] text-xs hover:text-[#D4A853]/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcon[notification.type] ?? Info;
                const colorClass = typeColor[notification.type] ?? typeColor.info;
                return (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0 ${
                      !notification.is_read ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground text-xs font-medium leading-snug">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground/70 text-[10px] mt-1">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
