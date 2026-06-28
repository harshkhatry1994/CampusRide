-- ============================================================
-- CampusRide — Restore Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add is_premium to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Create membership_requests table
CREATE TABLE IF NOT EXISTS public.membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  utr_number TEXT NOT NULL,
  amount NUMERIC(10,2) DEFAULT 999,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

-- Users can submit their own membership request
CREATE POLICY IF NOT EXISTS "Users can insert own membership request"
  ON public.membership_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY IF NOT EXISTS "Users can view own membership requests"
  ON public.membership_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can do anything
CREATE POLICY IF NOT EXISTS "Admins can manage membership requests"
  ON public.membership_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 3. Fix rentals RLS — allow admins to read/write all rentals
-- First check and drop conflicting policies if needed
DO $$
BEGIN
  -- Drop old admin policy if exists
  DROP POLICY IF EXISTS "Admins can manage all rentals" ON public.rentals;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY IF NOT EXISTS "Admins can manage all rentals"
  ON public.rentals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Users can read their own rentals
CREATE POLICY IF NOT EXISTS "Users can read own rentals"
  ON public.rentals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rentals
CREATE POLICY IF NOT EXISTS "Users can insert own rentals"
  ON public.rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Function to approve membership
CREATE OR REPLACE FUNCTION approve_membership(request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.membership_requests WHERE id = request_id;
  
  UPDATE public.membership_requests 
  SET status = 'approved', updated_at = NOW()
  WHERE id = request_id;
  
  UPDATE public.profiles 
  SET is_premium = true
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
