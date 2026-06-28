-- ============================================================
-- CampusRide Admin Portal — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (Portal users with RBAC)
-- ============================================================
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

-- ============================================================
-- 2. BIKES (Dealership inventory)
-- ============================================================
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

-- ============================================================
-- 3. BIKE IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bike_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.dealer_bikes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. BIKE DOCUMENTS
-- ============================================================
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

-- ============================================================
-- 5. CUSTOMERS
-- ============================================================
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

-- ============================================================
-- 6. CUSTOMER DOCUMENTS
-- ============================================================
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

-- ============================================================
-- 7. SALES
-- ============================================================
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

-- ============================================================
-- 8. INVOICES
-- ============================================================
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

-- Auto-generate invoice numbers: CR-2026-0001
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

-- ============================================================
-- 9. INVENTORY LOGS (Audit trail)
-- ============================================================
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

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
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

-- ============================================================
-- 11. COMPANY SETTINGS
-- ============================================================
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

-- Insert default settings row
INSERT INTO public.company_settings (company_name, email)
VALUES ('CampusRide Dealership', 'admin@campusride.com')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
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

-- Helper function to get current user's portal role
CREATE OR REPLACE FUNCTION get_portal_role()
RETURNS TEXT AS $$
  SELECT portal_role FROM public.portal_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Policies: portal users with any valid role can read
CREATE POLICY "portal_read" ON public.dealer_bikes FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_bikes FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin'));

CREATE POLICY "portal_read" ON public.bike_images FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.bike_images FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin'));

CREATE POLICY "portal_read" ON public.bike_documents FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.bike_documents FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin'));

CREATE POLICY "portal_read" ON public.dealer_customers FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_customers FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

CREATE POLICY "portal_read" ON public.customer_documents FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.customer_documents FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

CREATE POLICY "portal_read" ON public.dealer_sales FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_sales FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

CREATE POLICY "portal_read" ON public.dealer_invoices FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "portal_write" ON public.dealer_invoices FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin', 'sales_manager'));

CREATE POLICY "portal_read" ON public.inventory_logs FOR SELECT
  USING (get_portal_role() IS NOT NULL);

CREATE POLICY "portal_read" ON public.portal_notifications FOR SELECT
  USING (auth.uid() = target_user OR get_portal_role() IN ('super_admin', 'admin'));
CREATE POLICY "portal_write" ON public.portal_notifications FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin'));

CREATE POLICY "portal_read" ON public.portal_profiles FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "self_update" ON public.portal_profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "admin_manage" ON public.portal_profiles FOR ALL
  USING (get_portal_role() = 'super_admin');

CREATE POLICY "portal_read" ON public.company_settings FOR SELECT
  USING (get_portal_role() IS NOT NULL);
CREATE POLICY "admin_write" ON public.company_settings FOR ALL
  USING (get_portal_role() IN ('super_admin', 'admin'));

-- ============================================================
-- STORAGE BUCKETS (Run separately in Storage section)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bike-images', 'bike-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bike-documents', 'bike-documents', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('aadhaar', 'aadhaar', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('licences', 'licences', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('insurance', 'insurance', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('rc-books', 'rc-books', false) ON CONFLICT DO NOTHING;
