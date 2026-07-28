-- Create the table for UberFix subscriptions
CREATE TABLE IF NOT EXISTS public.uberfix_subscriptions (
    id UUID DEFAULT extensions.gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    store_name TEXT NOT NULL,
    store_address TEXT NOT NULL,
    package_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, active, cancelled
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional if the user is logged in
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.uberfix_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Policy 1: Anyone can insert (since the registration page might be public)
CREATE POLICY "Enable insert for anyone" ON public.uberfix_subscriptions
    FOR INSERT WITH CHECK (true);

-- Policy 2: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.uberfix_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Admins can view all subscriptions
-- Assumes an `is_admin()` function exists or checking `user_roles`
CREATE POLICY "Admins can view all subscriptions" ON public.uberfix_subscriptions
    FOR SELECT USING (public.is_admin());

-- Policy 4: Admins can update all subscriptions
CREATE POLICY "Admins can update subscriptions" ON public.uberfix_subscriptions
    FOR UPDATE USING (public.is_admin());

-- Setup updated_at trigger
CREATE TRIGGER update_uberfix_subscriptions_updated_at
    BEFORE UPDATE ON public.uberfix_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
