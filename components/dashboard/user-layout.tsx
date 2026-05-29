"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  TrendingUp,
  Users,
  ShieldCheck,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsMenu from "@/components/dashboard/notifications-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency } from "@/lib/utils";
import type { User as UserType } from "@/types";

import { TivoraLogo } from "@/components/logo"

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: boolean;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard/user", icon: LayoutDashboard },
  { label: "Deposit", href: "/dashboard/user/deposit", icon: ArrowDownCircle },
  { label: "Withdraw", href: "/dashboard/user/withdraw", icon: ArrowUpCircle },
  { label: "Transaction History", href: "/dashboard/user/history", icon: History },
  { label: "Portfolio", href: "/dashboard/user/portfolio", icon: TrendingUp },
  { label: "Referrals", href: "/dashboard/user/referrals", icon: Users },
  { label: "KYC Verification", href: "/dashboard/user/kyc", icon: ShieldCheck, badge: true },
  { label: "Support Chat", href: "/dashboard/user/chat", icon: MessageCircle },
  { label: "Profile", href: "/dashboard/user/profile", icon: User },
  { label: "Settings", href: "/dashboard/user/settings", icon: Settings },
];

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UserLayout({ children, title = "Dashboard" }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<UserType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) setUser(data as UserType);
      setLoading(false);
    }
    fetchUser();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const isActive = (href: string) => {
    if (href === "/dashboard/user") return pathname === "/dashboard/user";
    return pathname.startsWith(href);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/dashboard/user" className="flex items-center gap-3">
          <TivoraLogo size={32} />
          <span className="text-foreground font-semibold text-[15px] tracking-wide">
            TivoraHoldings
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
          <Avatar className="h-10 w-10 border border-[#D4A853]/30">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-[#D4A853]/20 text-[#D4A853] text-sm font-semibold">
              {user ? getInitials(user.full_name) : "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">
              {loading ? "Loading..." : user?.full_name ?? "User"}
            </p>
            <p className="text-muted-foreground text-xs truncate">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <div className="mt-2 px-3 py-2 rounded-lg bg-[#D4A853]/10 border border-[#D4A853]/20">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
            Available Balance
          </p>
          <p className="gold-gradient-text font-bold text-base">
            {loading ? "—" : formatCurrency(user?.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const showKycBadge =
            item.badge && user && user.kyc_status !== "verified";

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link${active ? " active" : ""}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showKycBadge && (
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              )}
              {active && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {user?.is_admin && (
          <Link
            href="/dashboard/admin"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#D4A853] bg-[#D4A853]/10 hover:bg-[#D4A853]/20 border border-[#D4A853]/30 transition-all duration-150 text-sm font-semibold"
          >
            <Shield className="h-4 w-4" />
            <span className="flex-1">Admin Panel</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden flex flex-col border-r border-border bg-card transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Navigation
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-border bg-background/90 backdrop-blur-md">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page Title */}
          <div className="flex-1">
            <h1 className="text-foreground font-semibold text-base md:text-lg truncate">
              {title}
            </h1>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsMenu />
            <Avatar className="h-8 w-8 border border-[#D4A853]/30 cursor-pointer">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#D4A853]/20 text-[#D4A853] text-xs font-semibold">
                {user ? getInitials(user.full_name) : "??"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
