-- SQL Migration to add ai_verification_result column to rentals table
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS ai_verification_result JSONB DEFAULT '{}'::jsonb;
