-- ==========================================
-- SQL SETUP SCRIPT FOR NEXAHR SUPABASE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Enable Row Level Security for all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for 'jobs' table
-- Allow anyone to read jobs
CREATE POLICY "Allow public read access on jobs" 
ON jobs FOR SELECT 
USING (true);

-- Allow authenticated users to insert jobs (Directeurs / RH)
CREATE POLICY "Allow authenticated insert jobs" 
ON jobs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update jobs
CREATE POLICY "Allow authenticated update jobs" 
ON jobs FOR UPDATE
TO authenticated 
USING (true);

-- Allow authenticated users to delete jobs
CREATE POLICY "Allow authenticated delete jobs" 
ON jobs FOR DELETE
TO authenticated 
USING (true);


-- 3. Create policies for 'profiles' table
-- Allow everyone to read profiles
CREATE POLICY "Allow public read access on profiles" 
ON profiles FOR SELECT 
USING (true);

-- Allow users to insert their own profile or authenticated users to insert
CREATE POLICY "Allow insert on profiles" 
ON profiles FOR INSERT 
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow update on profiles" 
ON profiles FOR UPDATE
USING (true);


-- 4. Create policies for 'employees' table
-- Allow anyone to read employees
CREATE POLICY "Allow public read access on employees" 
ON employees FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update/delete employees
CREATE POLICY "Allow authenticated insert employees" 
ON employees FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update employees" 
ON employees FOR UPDATE
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete employees" 
ON employees FOR DELETE
TO authenticated 
USING (true);

-- 5. (Optional) Run this if auth.users schema trigger is missing
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, role, nom, prenom)
--   VALUES (new.id, new.email, 'CANDIDATE', split_part(new.email, '@', 1), '');
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
