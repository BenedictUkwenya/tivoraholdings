"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Wallet,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import UserLayout from "@/components/dashboard/user-layout";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { User, Transaction, Deposit } from "@/types";

function generateChartData(transactions: Transaction[]) {
  const weeks: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks[key] = 0;
  }
  transactions.forEach((t) => {
    if (t.type === "earning" || t.type === "referral_bonus" || t.type === "bonus") {
      const d = new Date(t.created_at);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in weeks) weeks[key] += t.amount;
    }
  });
  let cumulative = 0;
  return Object.entries(weeks).map(([date, val]) => {
    cumulative += val;
    return { date, earnings: cumulative };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl border border-border px-3 py-2 text-xs shadow-xl"
        style={{ background: "hsl(var(--popover))" }}
      >
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-[#D4A853] font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const typeColors: Record<string, string> = {
  deposit: "bg-blue-500/20 text-blue-400",
  withdrawal: "bg-orange-500/20 text-orange-400",
  earning: "bg-emerald-500/20 text-emerald-400",
  referral_bonus: "bg-purple-500/20 text-purple-400",
  bonus: "bg-[#D4A853]/20 text-[#D4A853]",
};

export default function UserDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      const uid = session.user.id;

      const [userData, txData, depData] = await Promise.all([
        supabase.from("users").select("*").eq("id", uid).single(),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("deposits")
          .select("*")
          .eq("user_id", uid)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);

      if (userData.data) setUser(userData.data as User);
      if (txData.data) setTransactions(txData.data as Transaction[]);
      if (depData.data) setDeposits(depData.data as Deposit[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const recentTransactions = transactions.slice(0, 5);
  const chartData = generateChartData(transactions);

  const stats = [
    {
      label: "Available Balance",
      value: formatCurrency(user?.balance ?? 0),
      icon: Wallet,
      color: "gold",
      iconBg: "bg-[#D4A853]/15",
      iconColor: "text-[#D4A853]",
      borderColor: "border-[#D4A853]/20",
    },
    {
      label: "Total Earnings",
      value: formatCurrency(user?.total_earnings ?? 0),
      icon: TrendingUp,
      color: "emerald",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Total Deposited",
      value: formatCurrency(user?.total_deposited ?? 0),
      icon: ArrowDownCircle,
      color: "blue",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Withdrawn",
      value: formatCurrency(user?.total_withdrawn ?? 0),
      icon: ArrowUpCircle,
      color: "orange",
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-400",
      borderColor: "border-orange-500/20",
    },
  ];

  return (
    <UserLayout title="Overview">
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card h-28 animate-pulse rounded-2xl" />
            ))}
          </div>
          <div className="glass-card h-72 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Banners */}
          {user?.is_suspended && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Account Suspended</p>
                <p className="text-red-400/70 text-xs mt-0.5">
                  Your account has been suspended. Please contact support for assistance.
                </p>
              </div>
            </div>
          )}

          {user && user.kyc_status !== "verified" && !user.is_suspended && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-400 font-semibold text-sm">Complete KYC Verification</p>
                <p className="text-orange-400/70 text-xs mt-0.5">
                  Verify your identity to unlock higher withdrawal limits and full platform access.
                </p>
              </div>
              <Link href="/dashboard/user/kyc">
                <Button variant="outline" size="sm" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs">
                  Verify Now
                </Button>
              </Link>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`glass-card rounded-2xl p-5 border ${stat.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs mb-1 font-medium">{stat.label}</p>
                  <p
                    className={`text-xl font-bold ${
                      stat.color === "gold"
                        ? "gold-gradient-text"
                        : stat.iconColor
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Portfolio Chart */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-foreground font-semibold">Portfolio Growth</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Cumulative earnings over time</p>
                </div>
                <Badge className="bg-[#D4A853]/15 text-[#D4A853] border-[#D4A853]/30 text-xs">
                  Last 12 Weeks
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A853" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#D4A853"
                    strokeWidth={2}
                    fill="url(#goldGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#D4A853", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-foreground font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/dashboard/user/deposit" className="flex items-center gap-3 p-3.5 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/20 hover:bg-[#D4A853]/15 transition-colors group">
                  <div className="p-2 rounded-lg bg-[#D4A853]/20">
                    <ArrowDownCircle className="h-4 w-4 text-[#D4A853]" />
                  </div>
                  <span className="text-foreground text-sm font-medium flex-1">Make Deposit</span>
                  <ArrowRight className="h-4 w-4 text-[#D4A853]/50 group-hover:text-[#D4A853] transition-colors" />
                </Link>
                <Link href="/dashboard/user/withdraw" className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors group">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <ArrowUpCircle className="h-4 w-4 text-foreground/80" />
                  </div>
                  <span className="text-foreground text-sm font-medium flex-1">Withdraw Funds</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </Link>
                <Link href="/dashboard/user/history" className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors group">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <History className="h-4 w-4 text-foreground/80" />
                  </div>
                  <span className="text-foreground text-sm font-medium flex-1">View History</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </Link>
              </div>

              {/* Active Investments */}
              {deposits.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                    Active Investments
                  </h3>
                  <div className="space-y-2">
                    {deposits.slice(0, 3).map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <div>
                          <p className="text-foreground text-xs font-medium capitalize">
                            {dep.plan ?? "Standard"}
                          </p>
                          <p className="text-muted-foreground text-[10px]">{formatDate(dep.created_at)}</p>
                        </div>
                        <span className="text-emerald-400 text-sm font-semibold">
                          {formatCurrency(dep.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground font-semibold">Recent Transactions</h2>
              <Link href="/dashboard/user/history">
                <button className="text-[#D4A853] text-xs hover:text-[#D4A853]/80 flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground/70 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">Date</th>
                      <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">Type</th>
                      <th className="text-left text-muted-foreground text-xs font-medium pb-3 pr-4">Description</th>
                      <th className="text-right text-muted-foreground text-xs font-medium pb-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{formatDate(tx.created_at)}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${typeColors[tx.type] ?? "bg-muted text-muted-foreground"}`}>
                            {tx.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-foreground/80 text-xs max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className={`py-3 text-right text-sm font-semibold ${
                          tx.type === "withdrawal" ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {tx.type === "withdrawal" ? "-" : "+"}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </UserLayout>
  );
}
