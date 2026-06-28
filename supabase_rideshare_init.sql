-- CampusRide - Additional Ride-Sharing Tables & Triggers
-- This schema supplements the existing bike rental schema with the requested tables.

-- ==========================================
-- 1. PROFILES TABLE (Ride-Sharing Profile)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  college TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to sync auth.users to BOTH users and profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert into existing bike rental 'users' table (gracefully handle if it exists)
  BEGIN
    INSERT INTO public.users (id, name, email, avatar_url, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data->>'avatar_url',
      'Student'
    )
    ON CONFLICT (email) DO UPDATE SET 
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore conflicts if schema mismatch
  END;

  -- 2. Insert into the new ride-sharing 'profiles' table
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore conflicts
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_sync();

-- ==========================================
-- 2. RIDES TABLE (Ride-Sharing Edition)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rideshare_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  available_seats INTEGER NOT NULL,
  fare NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rideshare_rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rideshare rides" ON public.rideshare_rides FOR SELECT USING (true);
CREATE POLICY "Drivers can insert rideshare rides" ON public.rideshare_rides FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update their rideshare rides" ON public.rideshare_rides FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can delete their rideshare rides" ON public.rideshare_rides FOR DELETE USING (auth.uid() = driver_id);

-- ==========================================
-- 3. BOOKINGS TABLE (Ride-Sharing Edition)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rideshare_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES public.rideshare_rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rideshare_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passengers can view their own bookings" ON public.rideshare_bookings FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Passengers can create bookings" ON public.rideshare_bookings FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Drivers can view bookings for their rides" ON public.rideshare_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rideshare_rides WHERE rideshare_rides.id = rideshare_bookings.ride_id AND rideshare_rides.driver_id = auth.uid())
);
CREATE POLICY "Drivers and passengers can update bookings" ON public.rideshare_bookings FOR UPDATE USING (
  auth.uid() = passenger_id OR 
  EXISTS (SELECT 1 FROM public.rideshare_rides WHERE rideshare_rides.id = rideshare_bookings.ride_id AND rideshare_rides.driver_id = auth.uid())
);

-- ==========================================
-- 4. MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ==========================================
-- 5. STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('bike-images', 'bike-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('college-ids', 'college-ids', false) ON CONFLICT DO NOTHING;

-- Storage Policies for Profile Images
CREATE POLICY "Profile images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload their own profile images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for College IDs
CREATE POLICY "Users can view their own college ids" ON storage.objects FOR SELECT USING (bucket_id = 'college-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own college ids" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'college-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
