"use client"

import { useEffect, useRef, useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Bitcoin,
  Coins,
} from "lucide-react"
import AdminLayout from "@/components/dashboard/admin-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getPublicFileUrl } from "@/lib/storage"
import type { PaymentWallet } from "@/types"

const QR_BUCKET = "wallet-qr-codes"

function cryptoIcon(currency: string) {
  const c = currency.toUpperCase()
  if (c === "BTC") return <Bitcoin className="h-4 w-4 text-orange-400" />
  if (c === "ETH") return <Coins className="h-4 w-4 text-blue-400" />
  return <Coins className="h-4 w-4 text-emerald-400" />
}

interface DraftWallet {
  id: string | null
  currency: string
  name: string
  network: string
  address: string
  qr_path: string | null
  is_active: boolean
  sort_order: number
}

const EMPTY_DRAFT: DraftWallet = {
  id: null,
  currency: "",
  name: "",
  network: "",
  address: "",
  qr_path: null,
  is_active: true,
  sort_order: 0,
}

export default function AdminWalletsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [wallets, setWallets] = useState<PaymentWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<DraftWallet | null>(null)
  const [saving, setSaving] = useState(false)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PaymentWallet | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("payment_wallets")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
    setWallets((data ?? []) as PaymentWallet[])
    setLoading(false)
  }

  function openCreate() {
    const nextSort = (wallets.at(-1)?.sort_order ?? 0) + 1
    setDraft({ ...EMPTY_DRAFT, sort_order: nextSort })
    setQrFile(null)
    setQrPreview(null)
  }

  function openEdit(w: PaymentWallet) {
    setDraft({
      id: w.id,
      currency: w.currency,
      name: w.name,
      network: w.network,
      address: w.address,
      qr_path: w.qr_path,
      is_active: w.is_active,
      sort_order: w.sort_order,
    })
    setQrFile(null)
    setQrPreview(w.qr_path ? getPublicFileUrl(QR_BUCKET, w.qr_path) : null)
  }

  function closeDraft() {
    setDraft(null)
    setQrFile(null)
    setQrPreview(null)
  }

  function handleQrChange(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "QR code must be an image.", variant: "destructive" })
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Too large", description: "QR images must be under 4MB.", variant: "destructive" })
      return
    }
    setQrFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setQrPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadQrIfAny(currency: string): Promise<string | null> {
    if (!qrFile) return draft?.qr_path ?? null
    const ext = qrFile.name.split(".").pop() || "png"
    const safeCurrency = currency.toLowerCase().replace(/[^a-z0-9]/g, "")
    const path = `${safeCurrency}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(QR_BUCKET).upload(path, qrFile, { upsert: true })
    if (error) throw new Error(error.message)
    return path
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return

    const currency = draft.currency.trim().toUpperCase()
    const name = draft.name.trim()
    const network = draft.network.trim()
    const address = draft.address.trim()

    if (!currency || !name || !network || !address) {
      toast({ title: "Missing fields", description: "Currency, name, network and address are required.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const qr_path = await uploadQrIfAny(currency)

      if (draft.id) {
        const { error } = await supabase
          .from("payment_wallets")
          .update({
            currency, name, network, address, qr_path,
            is_active: draft.is_active,
            sort_order: draft.sort_order,
          })
          .eq("id", draft.id)
        if (error) throw error
        toast({ title: "Wallet updated", description: `${name} has been saved.` })
      } else {
        const { error } = await supabase
          .from("payment_wallets")
          .insert({
            currency, name, network, address, qr_path,
            is_active: draft.is_active,
            sort_order: draft.sort_order,
          })
        if (error) throw error
        toast({ title: "Wallet added", description: `${name} is now available to users.` })
      }
      closeDraft()
      await load()
    } catch (err: any) {
      toast({
        title: "Couldn't save",
        description: err?.message ?? "Unexpected error.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(w: PaymentWallet) {
    const { error } = await supabase
      .from("payment_wallets")
      .update({ is_active: !w.is_active })
      .eq("id", w.id)
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" })
      return
    }
    await load()
  }

  async function performDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const { error } = await supabase.from("payment_wallets").delete().eq("id", confirmDelete.id)
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Wallet deleted", description: `${confirmDelete.name} is no longer available.` })
      await load()
    }
    setConfirmDelete(null)
    setDeleting(false)
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <AdminLayout title="Payment Wallets">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-foreground font-bold text-xl">Wallet Addresses</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage the crypto addresses and QR codes shown to users on the deposit page.
            </p>
          </div>
          <Button variant="gold" onClick={openCreate} className="self-start sm:self-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Wallet
          </Button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : wallets.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No wallets yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Add a wallet so users can make deposits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground text-xs font-medium px-5 py-3">Currency</th>
                    <th className="text-left text-muted-foreground text-xs font-medium px-3 py-3">Network</th>
                    <th className="text-left text-muted-foreground text-xs font-medium px-3 py-3">Address</th>
                    <th className="text-left text-muted-foreground text-xs font-medium px-3 py-3">QR</th>
                    <th className="text-left text-muted-foreground text-xs font-medium px-3 py-3">Status</th>
                    <th className="text-right text-muted-foreground text-xs font-medium px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {cryptoIcon(w.currency)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-xs font-semibold">{w.currency}</p>
                            <p className="text-muted-foreground text-[10px] truncate">{w.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{w.network}</td>
                      <td className="px-3 py-3 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <p className="text-foreground/80 text-[11px] font-mono truncate">{w.address}</p>
                          <button
                            onClick={() => copy(w.address, w.id)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted flex-shrink-0"
                            title="Copy address"
                          >
                            {copiedId === w.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {w.qr_path ? (
                          <img
                            src={getPublicFileUrl(QR_BUCKET, w.qr_path)}
                            alt={`${w.currency} QR`}
                            className="w-10 h-10 rounded-md object-cover border border-border bg-white"
                          />
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">— none —</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(w)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            w.is_active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30"
                          }`}
                        >
                          {w.is_active ? (
                            <><Eye className="h-3 w-3" /> Active</>
                          ) : (
                            <><EyeOff className="h-3 w-3" /> Hidden</>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(w)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/15 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(w)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/15 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDraft}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          <form
            onSubmit={saveDraft}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-foreground font-semibold text-lg">
                  {draft.id ? "Edit wallet" : "Add wallet"}
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Wallets marked Active appear on the user deposit page.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDraft}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="currency" className="text-foreground/80 text-xs mb-1.5 block">
                  Currency code
                </Label>
                <Input
                  id="currency"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase().slice(0, 10) })}
                  placeholder="BTC"
                  required
                  className="bg-muted/40 border-border h-10 font-mono uppercase"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-foreground/80 text-xs mb-1.5 block">
                  Display name
                </Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Bitcoin"
                  required
                  className="bg-muted/40 border-border h-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="network" className="text-foreground/80 text-xs mb-1.5 block">
                Network
              </Label>
              <Input
                id="network"
                value={draft.network}
                onChange={(e) => setDraft({ ...draft, network: e.target.value })}
                placeholder="Bitcoin Network / ERC-20 / TRC-20"
                required
                className="bg-muted/40 border-border h-10"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground/80 text-xs mb-1.5 block">
                Wallet address
              </Label>
              <Input
                id="address"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                placeholder="bc1q..."
                required
                className="bg-muted/40 border-border h-10 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sort" className="text-foreground/80 text-xs mb-1.5 block">
                  Sort order
                </Label>
                <Input
                  id="sort"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value || "0", 10) })}
                  className="bg-muted/40 border-border h-10"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
                  className={`w-full h-10 rounded-lg border flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                    draft.is_active
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border-zinc-500/30"
                  }`}
                >
                  {draft.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {draft.is_active ? "Active" : "Hidden"}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-foreground/80 text-xs mb-1.5 block">QR code (optional)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleQrChange(e.target.files?.[0] ?? null)}
                />
                {qrPreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={qrPreview} alt="QR preview" className="w-20 h-20 object-contain rounded bg-white" />
                    <div className="text-left">
                      <p className="text-foreground text-xs font-medium">
                        {qrFile ? qrFile.name : "Existing QR"}
                      </p>
                      <p className="text-muted-foreground text-[10px]">Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground/70" />
                    <p className="text-muted-foreground text-xs">Click to upload an image</p>
                    <p className="text-muted-foreground/60 text-[10px] mt-0.5">PNG / JPG up to 4MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDraft}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={saving} className="flex-1">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
                ) : draft.id ? "Save changes" : "Add wallet"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 mx-auto mb-3 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-foreground font-semibold text-lg">Delete {confirmDelete.name}?</h3>
            <p className="text-muted-foreground text-sm mt-1.5">
              Users won&apos;t see this wallet anymore. Existing deposits referencing it will keep their currency tag.
            </p>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={performDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
