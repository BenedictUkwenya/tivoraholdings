export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  balance: number
  total_earnings: number
  total_deposited: number
  total_withdrawn: number
  is_admin: boolean
  is_suspended: boolean
  avatar_url: string | null
  referral_code: string
  referred_by: string | null
  kyc_status: "not_submitted" | "pending" | "verified" | "rejected"
  created_at: string
}

export interface Deposit {
  id: string
  user_id: string
  amount: number
  currency: string
  plan: string | null
  proof_url: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  users?: { full_name: string; email: string }
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  currency: string
  wallet_address: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  users?: { full_name: string; email: string }
}

export interface Transaction {
  id: string
  user_id: string
  type: "deposit" | "withdrawal" | "earning" | "referral_bonus" | "bonus"
  amount: number
  description: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
}

export interface SupportMessage {
  id: string
  user_id: string
  message: string
  is_from_admin: boolean
  is_bot: boolean
  is_read: boolean
  created_at: string
}

export interface KYCVerification {
  id: string
  user_id: string
  document_type: "passport" | "national_id" | "drivers_license"
  document_front_url: string
  document_back_url: string | null
  selfie_url: string | null
  status: "pending" | "verified" | "rejected"
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  users?: { full_name: string; email: string }
}

export interface InvestmentPlan {
  id: string
  name: string
  min_amount: number
  max_amount: number
  roi_percentage: number
  duration_days: number
  features: string[]
  is_active: boolean
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  bonus_amount: number
  status: "pending" | "paid"
  created_at: string
  referred_user?: { full_name: string; email: string; created_at: string }
}

export interface PaymentWallet {
  id: string
  currency: string
  name: string
  network: string
  address: string
  qr_path: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
