-- ============================================================
-- TivoraHoldings — Complete Database Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL UNIQUE,
  full_name         TEXT        NOT NULL DEFAULT '',
  phone             TEXT,
  avatar_url        TEXT,
  balance           NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_earnings    NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_deposited   NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_withdrawn   NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_admin          BOOLEAN     NOT NULL DEFAULT false,
  is_suspended      BOOLEAN     NOT NULL DEFAULT false,
  kyc_status        TEXT        NOT NULL DEFAULT 'not_submitted'
                    CHECK (kyc_status IN ('not_submitted','pending','verified','rejected')),
  referral_code     TEXT        UNIQUE,
  referred_by       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DEPOSITS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deposits (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency    TEXT        NOT NULL DEFAULT 'USDT',
  plan        TEXT,
  proof_url   TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WITHDRAWALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount          NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency        TEXT        NOT NULL DEFAULT 'USDT',
  wallet_address  TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRANSACTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL
              CHECK (type IN ('deposit','withdrawal','earning','referral_bonus','bonus')),
  amount      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'info'
              CHECK (type IN ('info','success','warning','error')),
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUPPORT MESSAGES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message         TEXT        NOT NULL,
  is_from_admin   BOOLEAN     NOT NULL DEFAULT false,
  is_bot          BOOLEAN     NOT NULL DEFAULT false,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── KYC VERIFICATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type       TEXT        NOT NULL
                      CHECK (document_type IN ('passport','national_id','drivers_license')),
  document_front_url  TEXT        NOT NULL,
  document_back_url   TEXT,
  selfie_url          TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','verified','rejected')),
  rejection_reason    TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ
);

-- ─── REFERRALS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bonus_amount  NUMERIC(18,2) NOT NULL DEFAULT 25,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_id)
);

-- ─── INVESTMENT PLANS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  min_amount      NUMERIC(18,2) NOT NULL,
  max_amount      NUMERIC(18,2) NOT NULL,
  roi_percentage  NUMERIC(5,2) NOT NULL,
  duration_days   INTEGER     NOT NULL,
  features        TEXT[]      NOT NULL DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deposits_user_id    ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status     ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_user_id         ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer  ON public.referrals(referrer_id);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── AUTO-CREATE USER PROFILE ON SIGNUP ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_input_referral TEXT;
BEGIN
  -- Retry until we get a unique referral code
  LOOP
    v_referral_code := 'TH-' || UPPER(SUBSTRING(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
  END LOOP;

  v_input_referral := NULLIF(TRIM(NEW.raw_user_meta_data->>'referral_code'), '');
  IF v_input_referral IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.users
    WHERE referral_code = v_input_referral
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, email, full_name, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    v_referral_code,
    v_referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Allow Supabase Auth to invoke the trigger function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── APPROVE DEPOSIT RPC ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_deposit(deposit_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dep public.deposits%ROWTYPE;
BEGIN
  SELECT * INTO v_dep FROM public.deposits WHERE id = deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_dep.status <> 'pending' THEN RAISE EXCEPTION 'Deposit is not pending'; END IF;

  UPDATE public.deposits SET status = 'approved' WHERE id = deposit_id;

  UPDATE public.users
  SET
    balance        = balance + v_dep.amount,
    total_deposited = total_deposited + v_dep.amount
  WHERE id = v_dep.user_id;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (v_dep.user_id, 'deposit', v_dep.amount, 'Deposit approved — ' || UPPER(v_dep.currency));
END;
$$;

-- ─── APPROVE WITHDRAWAL RPC ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_withdrawal(withdrawal_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_w public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_w FROM public.withdrawals WHERE id = withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_w.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal is not pending'; END IF;

  UPDATE public.withdrawals SET status = 'approved' WHERE id = withdrawal_id;

  UPDATE public.users
  SET total_withdrawn = total_withdrawn + v_w.amount
  WHERE id = v_w.user_id;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (v_w.user_id, 'withdrawal', v_w.amount, 'Withdrawal processed — ' || UPPER(v_w.currency));
END;
$$;

-- ─── PAY REFERRAL BONUS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pay_referral_bonus(p_referrer_id UUID, p_referred_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bonus NUMERIC := 25;
BEGIN
  INSERT INTO public.referrals (referrer_id, referred_id, bonus_amount, status)
  VALUES (p_referrer_id, p_referred_id, v_bonus, 'paid')
  ON CONFLICT (referred_id) DO NOTHING;

  UPDATE public.users
  SET
    balance       = balance + v_bonus,
    total_earnings = total_earnings + v_bonus
  WHERE id = p_referrer_id;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_referrer_id, 'referral_bonus', v_bonus, 'Referral bonus for new signup');

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_referrer_id, 'Referral Bonus!', format('You earned $%s for a successful referral!', v_bonus), 'success');
END;
$$;

-- ─── ENABLE REALTIME ────────────────────────────────────────
-- Idempotent: skip if table is already in the publication (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ─── ADMIN CHECK HELPER (non-recursive) ─────────────────────
-- SECURITY DEFINER lets it read `users` bypassing RLS, so
-- policies can call it without triggering infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = uid), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon, service_role;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans  ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "users_own" ON public.users;
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_admin" ON public.users;
CREATE POLICY "users_admin" ON public.users FOR ALL USING (public.is_admin(auth.uid()));

-- Deposits
DROP POLICY IF EXISTS "deposits_own" ON public.deposits;
CREATE POLICY "deposits_own" ON public.deposits FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deposits_admin" ON public.deposits;
CREATE POLICY "deposits_admin" ON public.deposits FOR ALL USING (public.is_admin(auth.uid()));

-- Withdrawals
DROP POLICY IF EXISTS "withdrawals_own" ON public.withdrawals;
CREATE POLICY "withdrawals_own" ON public.withdrawals FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "withdrawals_admin" ON public.withdrawals;
CREATE POLICY "withdrawals_admin" ON public.withdrawals FOR ALL USING (public.is_admin(auth.uid()));

-- Transactions
DROP POLICY IF EXISTS "transactions_own" ON public.transactions;
CREATE POLICY "transactions_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "transactions_admin" ON public.transactions;
CREATE POLICY "transactions_admin" ON public.transactions FOR ALL USING (public.is_admin(auth.uid()));

-- Notifications
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
CREATE POLICY "notifications_admin" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));

-- Support messages
DROP POLICY IF EXISTS "messages_own" ON public.support_messages;
CREATE POLICY "messages_own" ON public.support_messages FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "messages_admin" ON public.support_messages;
CREATE POLICY "messages_admin" ON public.support_messages FOR ALL USING (public.is_admin(auth.uid()));

-- KYC
DROP POLICY IF EXISTS "kyc_own" ON public.kyc_verifications;
CREATE POLICY "kyc_own" ON public.kyc_verifications FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kyc_admin" ON public.kyc_verifications;
CREATE POLICY "kyc_admin" ON public.kyc_verifications FOR ALL USING (public.is_admin(auth.uid()));

-- Referrals
DROP POLICY IF EXISTS "referrals_own" ON public.referrals;
CREATE POLICY "referrals_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "referrals_admin" ON public.referrals;
CREATE POLICY "referrals_admin" ON public.referrals FOR ALL USING (public.is_admin(auth.uid()));

-- Investment Plans — public read
DROP POLICY IF EXISTS "plans_read" ON public.investment_plans;
CREATE POLICY "plans_read" ON public.investment_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "plans_admin" ON public.investment_plans;
CREATE POLICY "plans_admin" ON public.investment_plans FOR ALL USING (public.is_admin(auth.uid()));

-- ─── STORAGE BUCKETS ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('payment-proofs', 'payment-proofs', false),
  ('avatars',        'avatars',        true),
  ('kyc-documents',  'kyc-documents',  false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "payment_proofs_own"  ON storage.objects;
CREATE POLICY "payment_proofs_own"  ON storage.objects FOR ALL USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "payment_proofs_admin" ON storage.objects;
CREATE POLICY "payment_proofs_admin" ON storage.objects FOR ALL USING (
  bucket_id = 'payment-proofs' AND public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "avatars_own"         ON storage.objects;
CREATE POLICY "avatars_own"         ON storage.objects FOR ALL USING (bucket_id = 'avatars'        AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "kyc_docs_own"        ON storage.objects;
CREATE POLICY "kyc_docs_own"        ON storage.objects FOR ALL USING (bucket_id = 'kyc-documents'  AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "kyc_docs_admin"      ON storage.objects;
CREATE POLICY "kyc_docs_admin"      ON storage.objects FOR ALL USING (
  bucket_id = 'kyc-documents' AND public.is_admin(auth.uid())
);

-- ─── SEED INVESTMENT PLANS ──────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_plans_name ON public.investment_plans(name);

INSERT INTO public.investment_plans (name, min_amount, max_amount, roi_percentage, duration_days, features)
VALUES
  ('Micro',   10,    250,    0, 30,
   ARRAY['Entry-level access','Email Support']),
  ('Basic',   250,   500,    0, 30,
   ARRAY['All Micro features','Faster review priority']),
  ('Starter', 500,   4999,   0, 30,
   ARRAY['All Basic features','Weekly summary','Advanced analytics']),
  ('Growth',  5000,  24999,  0, 30,
   ARRAY['All Starter features','Priority Support','Dedicated Account Manager']),
  ('Elite',   25000, 1000000, 0, 30,
   ARRAY['All Growth features','24/7 VIP Support','Personal Account Manager','Exclusive Opportunities'])
ON CONFLICT (name) DO NOTHING;

-- ─── MAKE FIRST USER ADMIN (optional helper) ────────────────
-- UPDATE public.users SET is_admin = true WHERE email = 'your-admin@email.com';

-- ─── DONE ───────────────────────────────────────────────────
-- TivoraHoldings database setup complete.
-- Next steps:
--   1. Copy your Supabase URL + Anon Key to .env.local
--   2. Run `npm install` then `npm run dev`
--   3. Sign up and set is_admin = true for your admin account
