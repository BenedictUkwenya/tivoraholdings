"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  Info,
} from "lucide-react";
import UserLayout from "@/components/dashboard/user-layout";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { User, Withdrawal } from "@/types";

const MINIMUM_WITHDRAWAL = 50;

export default function WithdrawPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmAddress, setConfirmAddress] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      const uid = session.user.id;

      const [userData, withdrawData] = await Promise.all([
        supabase.from("users").select("*").eq("id", uid).single(),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      if (userData.data) setUser(userData.data as User);
      if (withdrawData.data) setRecentWithdrawals(withdrawData.data as Withdrawal[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  function validate(): string | null {
    const num = parseFloat(amount);
    if (!currency) return "Please select a currency.";
    if (isNaN(num) || num <= 0) return "Enter a valid amount.";
    if (num < MINIMUM_WITHDRAWAL)
      return `Minimum withdrawal is ${formatCurrency(MINIMUM_WITHDRAWAL)}.`;
    if (user && num > user.balance)
      return `Insufficient balance. Your available balance is ${formatCurrency(user.balance)}.`;
    if (!walletAddress.trim()) return "Please enter your wallet address.";
    if (walletAddress !== confirmAddress)
      return "Wallet addresses do not match. Please check and try again.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!user) return;

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: parseFloat(amount),
      currency,
      wallet_address: walletAddress,
      status: "pending",
    });

    if (insertError) {
      setError("Failed to submit withdrawal. Please try again.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  const amountNum = parseFloat(amount);
  const insufficientBalance =
    user !== null && !isNaN(amountNum) && amountNum > user.balance;
  const belowMinimum = !isNaN(amountNum) && amountNum > 0 && amountNum < MINIMUM_WITHDRAWAL;

  if (success) {
    return (
      <UserLayout title="Withdraw Funds">
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-foreground text-2xl font-bold mb-3">Withdrawal Requested!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Your withdrawal of{" "}
            <span className="text-[#D4A853] font-semibold">{formatCurrency(parseFloat(amount))}</span>{" "}
            in {currency} has been submitted. Processing typically takes{" "}
            <span className="text-foreground/80">24-48 hours</span>.
          </p>
          <div className="glass-card rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-[#D4A853] font-semibold">{formatCurrency(parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Currency</span>
              <span className="text-foreground">{currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Wallet</span>
              <span className="text-foreground font-mono text-xs">{walletAddress.slice(0, 20)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="badge-pending">Pending</span>
            </div>
          </div>
          <Button variant="gold" onClick={() => router.push("/dashboard/user")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Withdraw Funds">
      <div className="max-w-xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="glass-card h-32 animate-pulse rounded-2xl" />
            <div className="glass-card h-64 animate-pulse rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className="glass-card rounded-2xl p-6 border border-[#D4A853]/20">
              <p className="text-muted-foreground text-sm mb-2">Available Balance</p>
              <p className="gold-gradient-text text-4xl font-bold mb-1">
                {formatCurrency(user?.balance ?? 0)}
              </p>
              {(user?.balance ?? 0) < MINIMUM_WITHDRAWAL && (
                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-400 text-xs">
                    Minimum withdrawal is {formatCurrency(MINIMUM_WITHDRAWAL)}. Your balance is insufficient.
                  </p>
                </div>
              )}
            </div>

            {/* Withdrawal Form */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-foreground font-bold text-lg mb-1">Withdrawal Request</h2>
                <p className="text-muted-foreground text-sm">Fill in the details below to request a withdrawal.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground/80 text-sm">
                  Amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    className={`pl-8 h-12 text-foreground bg-muted/40 border-border text-base ${
                      insufficientBalance || belowMinimum
                        ? "border-red-500/50 focus:border-red-500/70"
                        : "focus:border-[#D4A853]/50"
                    }`}
                  />
                </div>
                {insufficientBalance && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Exceeds available balance
                  </p>
                )}
                {belowMinimum && !insufficientBalance && (
                  <p className="text-orange-400 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Minimum withdrawal is {formatCurrency(MINIMUM_WITHDRAWAL)}
                  </p>
                )}
                {amount && !isNaN(amountNum) && amountNum >= MINIMUM_WITHDRAWAL && !insufficientBalance && (
                  <div className="flex justify-between text-xs px-1">
                    <span className="text-muted-foreground">Remaining after withdrawal</span>
                    <span className="text-emerald-400 font-medium">
                      {formatCurrency((user?.balance ?? 0) - amountNum)}
                    </span>
                  </div>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="text-foreground/80 text-sm">Currency</Label>
                <Select value={currency} onValueChange={(v) => { setCurrency(v); setError(""); }}>
                  <SelectTrigger className="h-12 text-foreground bg-muted/40 border-border focus:border-[#D4A853]/50">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label htmlFor="wallet" className="text-foreground/80 text-sm">
                  {currency ? `${currency} Wallet Address` : "Wallet Address"}
                </Label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder={
                    currency === "BTC"
                      ? "bc1q..."
                      : currency === "ETH"
                      ? "0x..."
                      : "T..."
                  }
                  value={walletAddress}
                  onChange={(e) => { setWalletAddress(e.target.value); setError(""); }}
                  className="h-12 text-foreground bg-muted/40 border-border focus:border-[#D4A853]/50 font-mono text-sm"
                />
              </div>

              {/* Confirm Wallet */}
              <div className="space-y-2">
                <Label htmlFor="confirm-wallet" className="text-foreground/80 text-sm">
                  Confirm Wallet Address
                </Label>
                <Input
                  id="confirm-wallet"
                  type="text"
                  placeholder="Re-enter wallet address"
                  value={confirmAddress}
                  onChange={(e) => { setConfirmAddress(e.target.value); setError(""); }}
                  className={`h-12 text-foreground bg-muted/40 border-border font-mono text-sm ${
                    confirmAddress && walletAddress !== confirmAddress
                      ? "border-red-500/50"
                      : confirmAddress && walletAddress === confirmAddress
                      ? "border-emerald-500/50"
                      : "focus:border-[#D4A853]/50"
                  }`}
                />
                {confirmAddress && walletAddress !== confirmAddress && (
                  <p className="text-red-400 text-xs">Addresses do not match</p>
                )}
                {confirmAddress && walletAddress === confirmAddress && walletAddress !== "" && (
                  <p className="text-emerald-400 text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Addresses match
                  </p>
                )}
              </div>

              {/* Processing Note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Clock className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-xs font-medium">Processing Time</p>
                  <p className="text-blue-400/70 text-xs mt-0.5">
                    Withdrawals are processed within 24-48 hours after approval.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-xs">
                  Ensure your wallet address is correct. Funds sent to wrong addresses cannot be recovered.
                </p>
              </div>

              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (user?.balance ?? 0) < MINIMUM_WITHDRAWAL ||
                  insufficientBalance
                }
                className="w-full h-12"
              >
                {submitting ? "Processing..." : "Request Withdrawal"}
              </Button>
            </div>

            {/* Recent Withdrawals */}
            {recentWithdrawals.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-[#D4A853]" />
                  Recent Withdrawals
                </h3>
                <div className="space-y-3">
                  {recentWithdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border"
                    >
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {formatCurrency(w.amount)} {w.currency}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">{formatDate(w.created_at)}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          w.status === "approved"
                            ? "badge-approved"
                            : w.status === "rejected"
                            ? "badge-rejected"
                            : "badge-pending"
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
