
-- Create an enum for day of the week for better data consistency
CREATE TYPE public.day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- Create messes table
CREATE TABLE public.messes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  rating NUMERIC(2, 1) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  cuisine TEXT[],
  address TEXT,
  image_url TEXT,
  monthly_price INT,
  operating_hours TEXT,
  contact TEXT,
  offers_delivery BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false
);
COMMENT ON TABLE public.messes IS 'Stores information about each mess service.';

-- Create menus table
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  day public.day_of_week NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  UNIQUE(mess_id, day)
);
COMMENT ON TABLE public.menus IS 'Stores the weekly menu for each mess.';

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.subscriptions IS 'Stores user subscriptions to messes.';

-- RLS for messes table
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messes are viewable by everyone." ON public.messes FOR SELECT USING (true);
CREATE POLICY "Mess owners can insert their own mess." ON public.messes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mess owners can update their own mess." ON public.messes FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Mess owners can delete their own mess." ON public.messes FOR DELETE USING (auth.uid() = owner_id);

-- RLS for menus table
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menus are viewable by everyone." ON public.menus FOR SELECT USING (true);
CREATE POLICY "Mess owners can manage menus for their mess." ON public.menus FOR ALL USING (auth.uid() = (SELECT owner_id FROM public.messes WHERE id = mess_id));

-- RLS for subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and create their own subscriptions." ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Mess owners can view and manage subscriptions to their mess." ON public.subscriptions FOR ALL USING (auth.uid() = (SELECT owner_id FROM public.messes WHERE id = mess_id));
