"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Upload,
  QrCode,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Bitcoin,
  Coins,
} from "lucide-react";
import UserLayout from "@/components/dashboard/user-layout";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface InvestmentPlan {
  id: string;
  name: string;
  min: number;
  max: number | null;
  color: string;
  activeColor: string;
  badge: string;
}

const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: "micro",
    name: "Micro",
    min: 10,
    max: 250,
    color: "border-zinc-500/40 bg-zinc-500/5",
    activeColor: "border-zinc-400 bg-zinc-500/15",
    badge: "bg-zinc-500/20 text-zinc-300 dark:text-zinc-200",
  },
  {
    id: "basic",
    name: "Basic",
    min: 250,
    max: 500,
    color: "border-sky-500/40 bg-sky-500/5",
    activeColor: "border-sky-400 bg-sky-500/15",
    badge: "bg-sky-500/20 text-sky-500 dark:text-sky-300",
  },
  {
    id: "starter",
    name: "Starter",
    min: 500,
    max: 4999,
    color: "border-blue-500/40 bg-blue-500/10",
    activeColor: "border-blue-400 bg-blue-500/20",
    badge: "bg-blue-500/20 text-blue-500 dark:text-blue-300",
  },
  {
    id: "growth",
    name: "Growth",
    min: 5000,
    max: 24999,
    color: "border-[#D4A853]/40 bg-[#D4A853]/10",
    activeColor: "border-[#D4A853] bg-[#D4A853]/20",
    badge: "bg-[#D4A853]/20 text-[#D4A853]",
  },
  {
    id: "elite",
    name: "Elite",
    min: 25000,
    max: null,
    color: "border-emerald-500/40 bg-emerald-500/10",
    activeColor: "border-emerald-400 bg-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-500 dark:text-emerald-300",
  },
];

const CRYPTO_OPTIONS = [
  {
    id: "BTC",
    name: "Bitcoin",
    symbol: "BTC",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    network: "Bitcoin Network",
  },
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    network: "ERC-20 Network",
  },
  {
    id: "USDT",
    name: "Tether",
    symbol: "USDT",
    address: "TGJ5vBzqGrMpWFLb5XsQN6FLR7SkFYRTzM",
    network: "TRC-20 Network",
  },
];

const STEPS = ["Select Plan", "Select Crypto", "Enter Amount", "Upload Proof"];

export default function DepositPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTO_OPTIONS[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/auth/login");
      else setUserId(session.user.id);
    });
  }, []);

  function handleCopyAddress() {
    if (!selectedCrypto) return;
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  }

  function handleFileChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }
    setError("");
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function validateAmount(): string | null {
    const num = parseFloat(amount);
    if (!selectedPlan) return null;
    if (isNaN(num) || num <= 0) return "Enter a valid amount.";
    if (num < selectedPlan.min)
      return `Minimum deposit for ${selectedPlan.name} plan is ${formatCurrency(selectedPlan.min)}.`;
    if (selectedPlan.max && num > selectedPlan.max)
      return `Maximum deposit for ${selectedPlan.name} plan is ${formatCurrency(selectedPlan.max)}.`;
    return null;
  }

  function handleNextStep() {
    setError("");
    if (step === 0 && !selectedPlan) {
      setError("Please select an investment plan.");
      return;
    }
    if (step === 1 && !selectedCrypto) {
      setError("Please select a cryptocurrency.");
      return;
    }
    if (step === 2) {
      const err = validateAmount();
      if (err) { setError(err); return; }
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    if (!proofFile || !userId || !selectedPlan || !selectedCrypto) {
      setError("Please upload payment proof.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const ext = proofFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile, { upsert: true });

      if (uploadError) throw new Error("Failed to upload proof. Please try again.");

      const { error: insertError } = await supabase.from("deposits").insert({
        user_id: userId,
        amount: parseFloat(amount),
        currency: selectedCrypto.id,
        plan: selectedPlan.id,
        proof_url: fileName,
        status: "pending",
      });

      if (insertError) throw new Error("Failed to submit deposit. Please try again.");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <UserLayout title="Deposit">
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-foreground text-2xl font-bold mb-3">Deposit Submitted!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Your deposit of{" "}
            <span className="text-[#D4A853] font-semibold">{formatCurrency(parseFloat(amount))}</span>{" "}
            in {selectedCrypto?.name} has been submitted for review. You will be notified once it&apos;s approved, typically within 1-3 hours.
          </p>
          <div className="glass-card rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Plan</span>
              <span className="text-foreground text-sm font-medium capitalize">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Amount</span>
              <span className="text-[#D4A853] text-sm font-semibold">{formatCurrency(parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Currency</span>
              <span className="text-foreground text-sm font-medium">{selectedCrypto?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              <span className="badge-pending">Pending Review</span>
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
    <UserLayout title="Make a Deposit">
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                  i < step
                    ? "gold-gradient text-[#030B18] border-[#D4A853]"
                    : i === step
                    ? "border-[#D4A853] text-[#D4A853] bg-[#D4A853]/10"
                    : "border-border text-muted-foreground"
                }`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-[#D4A853]/40" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          {/* Step 0: Select Plan */}
          {step === 0 && (
            <div>
              <h2 className="text-foreground text-xl font-bold mb-2">Select Investment Plan</h2>
              <p className="text-muted-foreground text-sm mb-6">Choose a plan that matches your investment goals.</p>
              <div className="space-y-3">
                {INVESTMENT_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedPlan?.id === plan.id ? plan.activeColor : plan.color
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${plan.badge} flex items-center justify-center flex-shrink-0`}>
                      <span className="font-bold text-sm">{plan.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-foreground font-semibold">{plan.name} Plan</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatCurrency(plan.min)} —{" "}
                        {plan.max ? formatCurrency(plan.max) : "No limit"}
                      </p>
                    </div>
                    {selectedPlan?.id === plan.id && (
                      <Check className="h-5 w-5 text-[#D4A853] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Select Crypto */}
          {step === 1 && selectedPlan && (
            <div>
              <h2 className="text-foreground text-xl font-bold mb-2">Select Cryptocurrency</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Choose your preferred cryptocurrency to make payment.
              </p>
              <div className="space-y-3">
                {CRYPTO_OPTIONS.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedCrypto?.id === crypto.id
                        ? "border-[#D4A853] bg-[#D4A853]/10"
                        : "border-border bg-muted/40 hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {crypto.id === "BTC" ? (
                        <Bitcoin className="h-5 w-5 text-orange-400" />
                      ) : crypto.id === "ETH" ? (
                        <Coins className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Coins className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-semibold">{crypto.name}</p>
                      <p className="text-muted-foreground text-xs">{crypto.network}</p>
                    </div>
                    {selectedCrypto?.id === crypto.id && (
                      <Check className="h-5 w-5 text-[#D4A853] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {selectedCrypto && (
                <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">
                      {selectedCrypto.name} Wallet Address
                    </p>
                    <button
                      onClick={handleCopyAddress}
                      className="flex items-center gap-1.5 text-[#D4A853] text-xs hover:text-[#D4A853]/80 transition-colors"
                    >
                      {copiedAddress ? (
                        <><Check className="h-3.5 w-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                  <p className="text-foreground text-xs font-mono break-all leading-relaxed">
                    {selectedCrypto.address}
                  </p>
                  <div className="flex items-center justify-center mt-4 p-6 rounded-lg bg-muted/40 border border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="h-10 w-10 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-muted-foreground/40 text-[10px]">QR Code</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {step === 2 && (
            <div>
              <h2 className="text-foreground text-xl font-bold mb-2">Enter Deposit Amount</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Min:{" "}
                <span className="text-foreground/80">
                  {formatCurrency(selectedPlan?.min ?? 0)}
                </span>
                {selectedPlan?.max && (
                  <> — Max: <span className="text-foreground/80">{formatCurrency(selectedPlan.max)}</span></>
                )}
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-foreground/80 text-sm mb-2 block">
                    Amount (USD equivalent)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      min={selectedPlan?.min}
                      max={selectedPlan?.max ?? undefined}
                      step="any"
                      placeholder={`Between ${selectedPlan?.min ?? 0}${selectedPlan?.max ? ` and ${selectedPlan.max}` : "+"}`}
                      value={amount}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") { setAmount(""); return; }
                        const num = parseFloat(raw);
                        if (Number.isNaN(num)) return;
                        if (selectedPlan?.max && num > selectedPlan.max) {
                          setAmount(String(selectedPlan.max));
                        } else {
                          setAmount(raw);
                        }
                      }}
                      className="pl-8 text-foreground bg-muted/40 border-border focus:border-[#D4A853]/50 h-12 text-base"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1.5">
                    Allowed range for {selectedPlan?.name}:{" "}
                    <span className="text-foreground/80">
                      {formatCurrency(selectedPlan?.min ?? 0)}
                      {selectedPlan?.max ? ` – ${formatCurrency(selectedPlan.max)}` : "+"}
                    </span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-foreground capitalize">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="text-foreground">{selectedCrypto?.symbol}</span>
                  </div>
                  {amount && !isNaN(parseFloat(amount)) && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Deposit Amount</span>
                      <span className="text-[#D4A853] font-semibold">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload Proof */}
          {step === 3 && (
            <div>
              <h2 className="text-foreground text-xl font-bold mb-2">Upload Payment Proof</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Send the exact amount to the wallet address, then upload your transaction screenshot or receipt.
              </p>

              <div className="p-4 rounded-xl bg-muted/40 border border-border mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Send to</span>
                  <span className="text-foreground font-mono text-xs">{selectedCrypto?.address.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-[#D4A853] font-semibold">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="text-foreground">{selectedCrypto?.network}</span>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileChange(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#D4A853] bg-[#D4A853]/10"
                    : proofFile
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-border bg-muted/30 hover:border-border hover:bg-muted/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                {proofPreview ? (
                  <div>
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="max-h-40 mx-auto rounded-lg object-contain mb-3"
                    />
                    <p className="text-emerald-400 text-sm font-medium">{proofFile?.name}</p>
                    <p className="text-muted-foreground/70 text-xs mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 text-muted-foreground/70 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium mb-1">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-muted-foreground/70 text-xs">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
                className="flex-1 border-border text-foreground/80 hover:text-foreground hover:bg-muted"
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="gold" onClick={handleNextStep} className="flex-1">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button variant="gold" onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Deposit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
