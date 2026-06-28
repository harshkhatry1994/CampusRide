-- ============================================================
-- CampusRide & Dealership ERP — Unified Restore Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CAMPUSRIDE TABLES & RELATIONSHIPS
-- ============================================================

-- Add is_premium to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Create membership_requests table
CREATE TABLE IF NOT EXISTS public.membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  utr_number TEXT NOT NULL,
  amount NUMERIC(10,2) DEFAULT 999,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'CampusRide',
  support_email TEXT DEFAULT 'support@campusride.com',
  support_phone TEXT,
  gst_number TEXT,
  hourly_rate NUMERIC DEFAULT 10,
  daily_rate NUMERIC DEFAULT 50,
  weekly_discount NUMERIC DEFAULT 10,
  monthly_discount NUMERIC DEFAULT 25,
  security_deposit NUMERIC DEFAULT 500,
  min_rental_hours INTEGER DEFAULT 1,
  max_rental_days INTEGER DEFAULT 30,
  late_fee_per_hour NUMERIC DEFAULT 5,
  helmet_required BOOLEAN DEFAULT true,
  aadhaar_required BOOLEAN DEFAULT true,
  license_required BOOLEAN DEFAULT true,
  college_id_required BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  instant_booking BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 2,
  maintenance_reminder_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default app_settings row if empty
INSERT INTO public.app_settings (id, company_name, support_email)
VALUES ('d8be1408-7253-4f9e-bd9f-2f88ef83a31c', 'CampusRide', 'support@campusride.com')
ON CONFLICT (id) DO NOTHING;

-- Create drivers table (CampusRide driver registration/verification)
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_document_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  vehicle_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraints to rentals
ALTER TABLE public.rentals DROP CONSTRAINT IF EXISTS rentals_user_id_fkey;
ALTER TABLE public.rentals ADD CONSTRAINT rentals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.rentals DROP CONSTRAINT IF EXISTS rentals_bike_id_fkey;
ALTER TABLE public.rentals ADD CONSTRAINT rentals_bike_id_fkey FOREIGN KEY (bike_id) REFERENCES public.bikes(id) ON DELETE SET NULL;

-- Enable RLS for CampusRide tables
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES FOR CAMPUSRIDE
-- ============================================================

-- rentals policies
DROP POLICY IF EXISTS "Admins can manage all rentals" ON public.rentals;
DROP POLICY IF EXISTS "Users can read own rentals" ON public.rentals;
DROP POLICY IF EXISTS "Users can insert own rentals" ON public.rentals;
DROP POLICY IF EXISTS "Users can update own rentals" ON public.rentals;
DROP POLICY IF EXISTS "Admins can manage rentals" ON public.rentals;

CREATE POLICY "Admins can manage rentals"
  ON public.rentals FOR ALL
  USING (
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = auth.uid()),
      'user'
    ) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can read own rentals"
  ON public.rentals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rentals"
  ON public.rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals"
  ON public.rentals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- membership_requests policies
DROP POLICY IF EXISTS "Users can insert own membership request" ON public.membership_requests;
DROP POLICY IF EXISTS "Users can view own membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Admins can manage membership requests" ON public.membership_requests;

CREATE POLICY "Users can insert own membership request"
  ON public.membership_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own membership requests"
  ON public.membership_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage membership requests"
  ON public.membership_requests FOR ALL
  USING (
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = auth.uid()),
      'user'
    ) IN ('admin', 'super_admin')
  );

-- app_settings policies
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage app_settings" ON public.app_settings;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings FOR ALL
  USING (
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = auth.uid()),
      'user'
    ) IN ('admin', 'super_admin')
  );

-- drivers policies
DROP POLICY IF EXISTS "Anyone can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can manage own profile" ON public.drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;

CREATE POLICY "Anyone can view drivers"
  ON public.drivers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can manage own profile"
  ON public.drivers FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = auth.uid()),
      'user'
    ) IN ('admin', 'super_admin')
  );

-- ============================================================
-- FUNCTIONS & PROCEDURES FOR CAMPUSRIDE
-- ============================================================

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


-- ============================================================
-- 2. DEALERSHIP ERP TABLES
-- ============================================================

-- Portal profiles with RBAC
CREATE TABLE IF NOT EXISTS public.portal_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  portal_role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (portal_role IN ('super_admin', 'admin', 'sales_manager', 'viewer')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dealership inventory bikes
CREATE TABLE IF NOT EXISTS public.dealer_bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER,
  registration_number TEXT UNIQUE,
  chassis_number TEXT UNIQUE,
  engine_number TEXT UNIQUE,
  color TEXT,
  fuel_type TEXT DEFAULT 'Petrol'
    CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid')),
  kms_driven INTEGER DEFAULT 0,
  purchase_price NUMERIC(12, 2),
  selling_price NUMERIC(12, 2),
  description TEXT,
  stock_status TEXT DEFAULT 'Available'
    CHECK (stock_status IN ('Available', 'Reserved', 'Sold', 'Under Maintenance')),
  is_featured BOOLEAN DEFAULT false,
  main_image_url TEXT,
  created_by UUID REFERENCES public.portal_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bike images
CREATE TABLE IF NOT EXISTS public.bike_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.dealer_bikes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bike documents
CREATE TABLE IF NOT EXISTS public.bike_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.dealer_bikes(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL
    CHECK (doc_type IN ('rc_book', 'insurance', 'pollution_certificate', 'tax_receipt',
                        'purchase_invoice', 'ownership_transfer', 'sale_agreement', 'service_record')),
  file_url TEXT,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  notes TEXT
);

-- Dealership customers
CREATE TABLE IF NOT EXISTS public.dealer_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  aadhaar_number TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  licence_number TEXT,
  licence_front_url TEXT,
  licence_back_url TEXT,
  pan_number TEXT,
  pan_url TEXT,
  passport_url TEXT,
  created_by UUID REFERENCES public.portal_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer documents
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.dealer_customers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date DATE,
  status TEXT DEFAULT 'active'
);

-- Sales
CREATE TABLE IF NOT EXISTS public.dealer_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.dealer_bikes(id),
  customer_id UUID REFERENCES public.dealer_customers(id),
  sale_price NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0,
  gst_percentage NUMERIC(5, 2) DEFAULT 18,
  gst_amount NUMERIC(12, 2),
  additional_charges NUMERIC(12, 2) DEFAULT 0,
  additional_charges_note TEXT,
  final_amount NUMERIC(12, 2),
  payment_method TEXT DEFAULT 'Cash'
    CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Finance')),
  payment_status TEXT DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES public.portal_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dealership invoices
CREATE TABLE IF NOT EXISTS public.dealer_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  sale_id UUID REFERENCES public.dealer_sales(id),
  bike_id UUID REFERENCES public.dealer_bikes(id),
  customer_id UUID REFERENCES public.dealer_customers(id),
  pdf_url TEXT,
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  created_by UUID REFERENCES public.portal_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence and trigger for generating invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'CR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
    LPAD(nextval('invoice_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON public.dealer_invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.dealer_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Inventory logs
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.dealer_bikes(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.portal_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal notifications
CREATE TABLE IF NOT EXISTS public.portal_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info'
    CHECK (type IN ('info', 'warning', 'error', 'success', 'expiry', 'sale', 'inventory')),
  is_read BOOLEAN DEFAULT false,
  target_user UUID REFERENCES public.portal_profiles(id),
  related_bike_id UUID REFERENCES public.dealer_bikes(id) ON DELETE SET NULL,
  related_sale_id UUID REFERENCES public.dealer_sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'CampusRide Dealership',
  logo_url TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  invoice_footer TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default company setting row
INSERT INTO public.company_settings (id, company_name, email)
VALUES ('74884210-928d-4fe3-82ef-a807a4b8df2f', 'CampusRide Dealership', 'admin@campusride.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for ERP tables
ALTER TABLE public.portal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Helper to check portal role
CREATE OR REPLACE FUNCTION get_portal_role()
RETURNS TEXT AS $$
  SELECT portal_role FROM public.portal_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ERP Policies
DROP POLICY IF EXISTS "portal_read" ON public.dealer_bikes;
DROP POLICY IF EXISTS "portal_write" ON public.dealer_bikes;
CREATE POLICY "portal_read" ON public.dealer_bikes FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_bikes FOR ALL USING (get_portal_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "portal_read" ON public.bike_images;
DROP POLICY IF EXISTS "portal_write" ON public.bike_images;
CREATE POLICY "portal_read" ON public.bike_images FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.bike_images FOR ALL USING (get_portal_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "portal_read" ON public.bike_documents;
DROP POLICY IF EXISTS "portal_write" ON public.bike_documents;
CREATE POLICY "portal_read" ON public.bike_documents FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.bike_documents FOR ALL USING (get_portal_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "portal_read" ON public.dealer_customers;
DROP POLICY IF EXISTS "portal_write" ON public.dealer_customers;
CREATE POLICY "portal_read" ON public.dealer_customers FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_customers FOR ALL USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

DROP POLICY IF EXISTS "portal_read" ON public.customer_documents;
DROP POLICY IF EXISTS "portal_write" ON public.customer_documents;
CREATE POLICY "portal_read" ON public.customer_documents FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.customer_documents FOR ALL USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

DROP POLICY IF EXISTS "portal_read" ON public.dealer_sales;
DROP POLICY IF EXISTS "portal_write" ON public.dealer_sales;
CREATE POLICY "portal_read" ON public.dealer_sales FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_sales FOR ALL USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

DROP POLICY IF EXISTS "portal_read" ON public.dealer_invoices;
DROP POLICY IF EXISTS "portal_write" ON public.dealer_invoices;
CREATE POLICY "portal_read" ON public.dealer_invoices FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_invoices FOR ALL USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

DROP POLICY IF EXISTS "portal_read" ON public.inventory_logs;
CREATE POLICY "portal_read" ON public.inventory_logs FOR SELECT USING (get_portal_role() IS NOT NULL);

DROP POLICY IF EXISTS "portal_read" ON public.portal_notifications;
DROP POLICY IF EXISTS "portal_write" ON public.portal_notifications;
CREATE POLICY "portal_read" ON public.portal_notifications FOR SELECT USING (auth.uid() = target_user OR get_portal_role() IN ('super_admin', 'admin'));
CREATE POLICY "portal_write" ON public.portal_notifications FOR ALL USING (get_portal_role() IN ('super_admin', 'admin'));

DROP POLICY IF EXISTS "portal_read" ON public.portal_profiles;
DROP POLICY IF EXISTS "self_update" ON public.portal_profiles;
DROP POLICY IF EXISTS "admin_manage" ON public.portal_profiles;
CREATE POLICY "portal_read" ON public.portal_profiles FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "self_update" ON public.portal_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin_manage" ON public.portal_profiles FOR ALL USING (get_portal_role() = 'super_admin');

DROP POLICY IF EXISTS "portal_read" ON public.company_settings;
DROP POLICY IF EXISTS "admin_write" ON public.company_settings;
CREATE POLICY "portal_read" ON public.company_settings FOR SELECT USING (get_portal_role() IS NOT NULL);
CREATE POLICY "admin_write" ON public.company_settings FOR ALL USING (get_portal_role() IN ('super_admin', 'admin'));
