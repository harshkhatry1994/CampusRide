-- Create Tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table mapped to auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Student' CHECK (role IN ('Student', 'Driver', 'Admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  license_number TEXT,
  license_document_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT DEFAULT 'Street',
  price_per_day NUMERIC(10, 2) NOT NULL,
  price_per_hour NUMERIC(10, 2),
  mileage NUMERIC,
  fuel_type TEXT DEFAULT 'Petrol',
  engine_cc NUMERIC,
  year TEXT,
  description TEXT,
  available BOOLEAN DEFAULT true,
  helmet_included BOOLEAN DEFAULT true,
  security_deposit NUMERIC(10, 2),
  pickup_location TEXT,
  color TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT CHECK (method IN ('Credit Card', 'UPI', 'Cash')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- drivers policies
CREATE POLICY "Drivers can view their own driver profile" ON public.drivers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Drivers can update their own driver profile" ON public.drivers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all drivers" ON public.drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- rides policies
CREATE POLICY "Anyone can view available rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Drivers can manage their rides" ON public.rides FOR ALL USING (auth.uid() = driver_id);
CREATE POLICY "Admins can manage all rides" ON public.rides FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- bookings policies
CREATE POLICY "Students can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Drivers can view bookings for their rides" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rides WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid())
);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- payments policies
CREATE POLICY "Students can view their own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.student_id = auth.uid())
);
CREATE POLICY "Admins can view all payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

-- Trigger to create user on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'Student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('student-ids', 'student-ids', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-licenses', 'driver-licenses', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('bike-images', 'bike-images', true);

-- Storage Policies
-- Assumes folder name is user id (e.g. uuid/filename.png)
CREATE POLICY "Profile photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Users can upload their own profile photo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vehicle images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'bike-images');
CREATE POLICY "Drivers can upload vehicle images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bike-images' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Driver', 'Admin')));

CREATE POLICY "Users can read their own documents" ON storage.objects FOR SELECT USING (
  bucket_id IN ('student-ids', 'driver-licenses') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can read all documents" ON storage.objects FOR SELECT USING (
  bucket_id IN ('student-ids', 'driver-licenses') AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('student-ids', 'driver-licenses') AND auth.uid()::text = (storage.foldername(name))[1]
);
