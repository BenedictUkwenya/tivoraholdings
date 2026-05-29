"use client"

import { createClient } from "@/lib/supabase/client"

export interface SignupData {
  email: string
  password: string
  fullName: string
  phone: string
  referralCode?: string
}

export interface LoginData {
  email: string
  password: string
}

export async function signup(data: SignupData) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${window.location.origin}/auth/callback`,
      data: {
        full_name: data.fullName,
        phone: data.phone,
        referral_code: data.referralCode || null,
      },
    },
  })

  if (authError) throw authError

  return authData
}

export async function login(data: LoginData) {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error) throw error
  return authData
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()
  if (error) throw error
  return profile
}
