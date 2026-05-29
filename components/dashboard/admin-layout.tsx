"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  History, MessageCircle, FileBarChart, Shield, Settings, LogOut,
  Menu, X, ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import AdminGuard from "@/components/dashboard/admin-guard"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAdminPendingCounts, type AdminPendingCounts } from "@/lib/hooks/use-admin-pending-counts"

const navItems = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Deposits", href: "/dashboard/admin/deposits", icon: ArrowDownCircle },
  { label: "Withdrawals", href: "/dashboard/admin/withdrawals", icon: ArrowUpCircle },
  { label: "Transactions", href: "/dashboard/admin/transactions", icon: History },
  { label: "KYC Reviews", href: "/dashboard/admin/kyc", icon: Shield },
  { label: "Messages", href: "/dashboard/admin/messages", icon: MessageCircle },
  { label: "Reports", href: "/dashboard/admin/reports", icon: FileBarChart },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

import { TivoraLogo } from "@/components/logo"

function AdminSidebar({ onClose, counts }: { onClose?: () => void; counts: AdminPendingCounts }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin"
    return pathname.startsWith(href)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const badgeFor: Record<string, number> = {
    "/dashboard/admin/deposits": counts.deposits,
    "/dashboard/admin/withdrawals": counts.withdrawals,
    "/dashboard/admin/kyc": counts.kyc,
    "/dashboard/admin/messages": counts.messages,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/dashboard/admin" className="flex items-center gap-3" onClick={onClose}>
          <TivoraLogo size={32} />
          <div>
            <span className="text-foreground font-semibold text-[15px]">TivoraHoldings</span>
            <p className="text-[#D4A853] text-[10px] uppercase tracking-wider">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const badge = badgeFor[item.href] ?? 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  aria-label={`${badge} pending`}
                  className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-500/20 text-orange-500 dark:text-orange-300 text-[10px] font-bold border border-orange-500/40"
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {active && !badge && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/dashboard/user"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm font-medium"
          onClick={onClose}
        >
          <Users className="h-4 w-4" />
          <span>User View</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children, title = "Admin" }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const counts = useAdminPendingCounts()
  const totalPending =
    counts.deposits + counts.withdrawals + counts.kyc + counts.messages

  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-card">
          <AdminSidebar counts={counts} />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          </div>
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden flex flex-col border-r border-border bg-card transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Admin Navigation</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <AdminSidebar counts={counts} onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col lg:ml-64">
          <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-border bg-background/90 backdrop-blur-md">
            <button onClick={() => setSidebarOpen(true)} className="relative lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Menu className="h-5 w-5" />
              {totalPending > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>
            <div className="flex-1">
              <h1 className="text-foreground font-semibold text-base md:text-lg">{title}</h1>
            </div>
            <ThemeToggle />
            <div className="px-3 py-1 rounded-full bg-[#D4A853]/15 border border-[#D4A853]/30">
              <span className="text-[#D4A853] text-xs font-medium uppercase tracking-wider">Admin</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
