"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Gift,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import UserLayout from "@/components/dashboard/user-layout";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;

type EntryType = "deposit" | "withdrawal" | "earning" | "referral_bonus" | "bonus";
type EntryStatus = "pending" | "approved" | "rejected" | "completed";

interface HistoryEntry {
  id: string;
  source: "transaction" | "deposit" | "withdrawal";
  type: EntryType;
  amount: number;
  description: string;
  status: EntryStatus;
  created_at: string;
}

const typeConfig: Record<EntryType, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  deposit: { label: "Deposit", color: "bg-blue-500/20 text-blue-500 dark:text-blue-300", icon: ArrowDownCircle },
  withdrawal: { label: "Withdrawal", color: "bg-orange-500/20 text-orange-500 dark:text-orange-300", icon: ArrowUpCircle },
  earning: { label: "Earning", color: "bg-emerald-500/20 text-emerald-500 dark:text-emerald-300", icon: Coins },
  referral_bonus: { label: "Referral", color: "bg-purple-500/20 text-purple-500 dark:text-purple-300", icon: Users },
  bonus: { label: "Bonus", color: "bg-[#D4A853]/20 text-[#D4A853]", icon: Gift },
};

const statusConfig: Record<EntryStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30", icon: XCircle },
};

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [csvToast, setCsvToast] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      const userId = session.user.id;

      const [txRes, depRes, wdRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("deposits")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const merged: HistoryEntry[] = [];

      // Transactions — earnings, bonuses, referral bonuses only.
      // Skip 'deposit' and 'withdrawal' types because they're already represented
      // by their source-of-truth rows in the deposits/withdrawals tables.
      for (const t of (txRes.data ?? [])) {
        if (t.type === "deposit" || t.type === "withdrawal") continue;
        merged.push({
          id: `tx-${t.id}`,
          source: "transaction",
          type: t.type as EntryType,
          amount: Number(t.amount),
          description: t.description ?? "",
          status: "completed",
          created_at: t.created_at,
        });
      }

      // Deposits — pending / approved / rejected
      for (const d of (depRes.data ?? [])) {
        const planLabel = d.plan ? d.plan.charAt(0).toUpperCase() + d.plan.slice(1) : "Custom";
        merged.push({
          id: `dep-${d.id}`,
          source: "deposit",
          type: "deposit",
          amount: Number(d.amount),
          description: `${planLabel} plan deposit via ${String(d.currency).toUpperCase()}`,
          status: d.status as EntryStatus,
          created_at: d.created_at,
        });
      }

      // Withdrawals — pending / approved / rejected
      for (const w of (wdRes.data ?? [])) {
        merged.push({
          id: `wd-${w.id}`,
          source: "withdrawal",
          type: "withdrawal",
          amount: Number(w.amount),
          description: `Withdrawal via ${String(w.currency).toUpperCase()}`,
          status: w.status as EntryStatus,
          created_at: w.created_at,
        });
      }

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEntries(merged);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = entries;

    if (activeTab !== "all") {
      if (activeTab === "deposits") list = list.filter((t) => t.type === "deposit");
      else if (activeTab === "withdrawals") list = list.filter((t) => t.type === "withdrawal");
      else if (activeTab === "earnings")
        list = list.filter((t) => ["earning", "referral_bonus", "bonus"].includes(t.type));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      list = list.filter((t) => new Date(t.created_at) >= new Date(fromDate));
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      list = list.filter((t) => new Date(t.created_at) < end);
    }

    return list;
  }, [entries, activeTab, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleExportCSV() {
    setCsvToast(true);
    setTimeout(() => setCsvToast(false), 3000);
  }

  // Amount sign + color depend on type AND status
  function renderAmount(entry: HistoryEntry) {
    const isDebit = entry.type === "withdrawal";
    const sign = isDebit ? "−" : "+";

    if (entry.status === "pending") {
      return (
        <span className="text-sm font-semibold text-muted-foreground">
          {sign}
          {formatCurrency(entry.amount)}
        </span>
      );
    }
    if (entry.status === "rejected") {
      return (
        <span className="text-sm font-semibold text-muted-foreground/60 line-through">
          {sign}
          {formatCurrency(entry.amount)}
        </span>
      );
    }
    return (
      <span
        className={`text-sm font-semibold ${
          isDebit ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {sign}
        {formatCurrency(entry.amount)}
      </span>
    );
  }

  return (
    <UserLayout title="Transaction History">
      <div className="space-y-5">
        {/* CSV Toast */}
        {csvToast && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-500/90 text-foreground text-sm font-medium shadow-xl backdrop-blur">
            CSV export ready! (Feature coming soon)
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-foreground font-bold text-xl">All Transactions</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted self-start sm:self-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col gap-4">
            <TabsList className="w-full sm:w-auto bg-muted/50 border border-border rounded-xl p-1">
              {["all", "deposits", "withdrawals", "earnings"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="capitalize text-xs data-[state=active]:bg-[#D4A853] data-[state=active]:text-[#030B18] data-[state=active]:font-semibold text-muted-foreground rounded-lg px-3 py-1.5"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-[#D4A853]/50 h-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-lg bg-muted/40 border border-border text-foreground/80 text-sm focus:outline-none focus:border-[#D4A853]/50 [color-scheme:dark]"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-lg bg-muted/40 border border-border text-foreground/80 text-sm focus:outline-none focus:border-[#D4A853]/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="glass-card rounded-2xl py-16 text-center">
                <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No transactions found</p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                  {search || fromDate || toDate
                    ? "Try adjusting your filters"
                    : "Your transactions will appear here"}
                </p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-muted-foreground text-xs font-medium px-5 py-4">Date & Time</th>
                        <th className="text-left text-muted-foreground text-xs font-medium px-3 py-4">Type</th>
                        <th className="text-left text-muted-foreground text-xs font-medium px-3 py-4">Description</th>
                        <th className="text-left text-muted-foreground text-xs font-medium px-3 py-4">Status</th>
                        <th className="text-right text-muted-foreground text-xs font-medium px-5 py-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((entry, idx) => {
                        const tCfg = typeConfig[entry.type] ?? {
                          label: entry.type,
                          color: "bg-muted text-muted-foreground",
                          icon: Coins,
                        };
                        const sCfg = statusConfig[entry.status];
                        const TypeIcon = tCfg.icon;
                        const StatusIcon = sCfg.icon;
                        return (
                          <tr
                            key={entry.id}
                            className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${
                              idx % 2 === 0 ? "" : "bg-muted/20"
                            }`}
                          >
                            <td className="px-5 py-4">
                              <p className="text-foreground/80 text-xs">{formatDateTime(entry.created_at)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${tCfg.color}`}>
                                <TypeIcon className="h-3 w-3" />
                                {tCfg.label}
                              </span>
                            </td>
                            <td className="px-3 py-4 max-w-[240px]">
                              <p className="text-foreground/80 text-xs truncate">{entry.description}</p>
                            </td>
                            <td className="px-3 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${sCfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {sCfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {renderAmount(entry)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                  <p className="text-muted-foreground text-xs">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-muted-foreground text-xs font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
