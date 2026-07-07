-- Create verification_documents table
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  aadhaar_url text,
  license_url text,
  selfie_url text,
  
  aadhaar_name text,
  license_name text,
  aadhaar_number text,
  license_number text,
  aadhaar_dob text,
  license_dob text,
  
  ocr_confidence numeric(5,2),
  ai_confidence numeric(5,2),
  face_score numeric(5,2),
  
  aadhaar_verified boolean DEFAULT false,
  license_verified boolean DEFAULT false,
  face_verified boolean DEFAULT false,
  
  verification_status text DEFAULT 'pending',
  verified_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification documents"
  ON public.verification_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification documents"
  ON public.verification_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification documents"
  ON public.verification_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification documents"
  ON public.verification_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

CREATE POLICY "Admins can update all verification documents"
  ON public.verification_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );
