"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Shield, Upload, CheckCircle, Clock, XCircle, FileText, Camera, AlertTriangle } from "lucide-react"
import UserLayout from "@/components/dashboard/user-layout"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from "@/lib/utils"
import type { KYCVerification } from "@/types"

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
  { value: "drivers_license", label: "Driver's License" },
] as const

export default function KYCPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [kyc, setKyc] = useState<KYCVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [docType, setDocType] = useState<"passport" | "national_id" | "drivers_license">("passport")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/auth/login"); return }
      setUserId(session.user.id)

      const { data } = await supabase
        .from("kyc_verifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) setKyc(data as KYCVerification)
      setLoading(false)
    }
    load()
  }, [])

  async function uploadFile(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true })
    if (error) throw error
    return path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!frontFile || !userId) {
      toast({ title: "Missing documents", description: "Please upload the front of your document.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const ts = Date.now()
      const frontUrl = await uploadFile(frontFile, `${userId}/${ts}-front.${frontFile.name.split(".").pop()}`)
      let backUrl: string | null = null
      let selfieUrl: string | null = null

      if (backFile) {
        backUrl = await uploadFile(backFile, `${userId}/${ts}-back.${backFile.name.split(".").pop()}`)
      }
      if (selfieFile) {
        selfieUrl = await uploadFile(selfieFile, `${userId}/${ts}-selfie.${selfieFile.name.split(".").pop()}`)
      }

      const { data, error } = await supabase.from("kyc_verifications").insert({
        user_id: userId,
        document_type: docType,
        document_front_url: frontUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl,
        status: "pending",
        submitted_at: new Date().toISOString(),
      }).select().single()

      if (error) throw error
      setKyc(data as KYCVerification)
      toast({ title: "KYC Submitted!", description: "Your documents are under review. We'll notify you within 24 hours." })
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const StatusBanner = () => {
    if (!kyc) return null
    const config = {
      pending: { icon: Clock, color: "orange", text: "Your KYC documents are under review. We'll notify you within 24 hours." },
      verified: { icon: CheckCircle, color: "emerald", text: "Your identity has been verified. You now have full access to all platform features." },
      rejected: { icon: XCircle, color: "red", text: `Your KYC was rejected${kyc.rejection_reason ? `: ${kyc.rejection_reason}` : ""}. Please resubmit with valid documents.` },
    }[kyc.status]

    const Icon = config.icon
    const colorMap = {
      orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
      emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      red: "border-red-500/30 bg-red-500/10 text-red-400",
    }

    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${colorMap[config.color as keyof typeof colorMap]} mb-6`}>
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm capitalize">KYC {kyc.status}</p>
          <p className="text-xs mt-0.5 opacity-80">{config.text}</p>
          <p className="text-xs mt-0.5 opacity-50">Submitted: {formatDateTime(kyc.submitted_at)}</p>
        </div>
      </div>
    )
  }

  return (
    <UserLayout title="KYC Verification">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#D4A853]/15 border border-[#D4A853]/25 flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#D4A853]" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold">Identity Verification</h2>
              <p className="text-muted-foreground text-xs">Required to unlock full platform access</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <StatusBanner />

              {(kyc?.status === "verified") ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                  <p className="text-foreground font-semibold">Identity Verified</p>
                  <p className="text-muted-foreground text-sm mt-1">Your account has full access.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Info */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-blue-400 text-xs font-medium mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Requirements
                    </p>
                    <ul className="text-blue-300/70 text-xs space-y-0.5 list-disc list-inside">
                      <li>Document must be government-issued and valid</li>
                      <li>All text must be clearly visible</li>
                      <li>File size must be under 10MB per image</li>
                      <li>Supported formats: JPG, PNG, PDF</li>
                    </ul>
                  </div>

                  {/* Document Type */}
                  <div>
                    <Label className="text-foreground/80 text-sm mb-2 block">Document Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DOC_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setDocType(type.value)}
                          className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                            docType === type.value
                              ? "border-[#D4A853]/60 bg-[#D4A853]/15 text-[#D4A853]"
                              : "border-border bg-muted/40 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Front */}
                  <div>
                    <Label className="text-foreground/80 text-sm mb-2 block">
                      Document Front <span className="text-red-400">*</span>
                    </Label>
                    <input ref={frontRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)} />
                    <button
                      type="button"
                      onClick={() => frontRef.current?.click()}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 ${
                        frontFile ? "border-[#D4A853]/50 bg-[#D4A853]/10" : "border-border bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${frontFile ? "bg-[#D4A853]/20" : "bg-muted/50"}`}>
                        <FileText className={`h-4 w-4 ${frontFile ? "text-[#D4A853]" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm ${frontFile ? "text-foreground" : "text-muted-foreground"}`}>
                        {frontFile ? frontFile.name : "Click to upload front of document"}
                      </span>
                    </button>
                  </div>

                  {/* Back */}
                  {docType !== "passport" && (
                    <div>
                      <Label className="text-foreground/80 text-sm mb-2 block">Document Back</Label>
                      <input ref={backRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setBackFile(e.target.files?.[0] ?? null)} />
                      <button
                        type="button"
                        onClick={() => backRef.current?.click()}
                        className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 ${
                          backFile ? "border-[#D4A853]/50 bg-[#D4A853]/10" : "border-border bg-muted/40 hover:border-border"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${backFile ? "bg-[#D4A853]/20" : "bg-muted/50"}`}>
                          <FileText className={`h-4 w-4 ${backFile ? "text-[#D4A853]" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`text-sm ${backFile ? "text-foreground" : "text-muted-foreground"}`}>
                          {backFile ? backFile.name : "Click to upload back of document"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Selfie */}
                  <div>
                    <Label className="text-foreground/80 text-sm mb-2 block">Selfie with Document</Label>
                    <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
                    <button
                      type="button"
                      onClick={() => selfieRef.current?.click()}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 ${
                        selfieFile ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-muted/40 hover:border-border"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selfieFile ? "bg-emerald-500/20" : "bg-muted/50"}`}>
                        <Camera className={`h-4 w-4 ${selfieFile ? "text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm ${selfieFile ? "text-foreground" : "text-muted-foreground"}`}>
                        {selfieFile ? selfieFile.name : "Selfie holding your document (optional but recommended)"}
                      </span>
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full h-11"
                    disabled={submitting || !frontFile}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2"><Upload className="h-4 w-4 animate-pulse" /> Submitting...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Submit for Verification</span>
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
