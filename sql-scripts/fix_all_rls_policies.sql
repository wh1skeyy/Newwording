-- ============================================================
-- DEFINITIVE RLS FIX — Run this in Supabase SQL Editor
-- This grants the anon role full access to all tables used by 
-- the app since it does not use Supabase Auth.
-- ============================================================

-- 1. Enable RLS on all tables (safe to run even if already enabled)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_words ENABLE ROW LEVEL SECURITY;

-- class_counters: keep RLS disabled (internal counter table, no sensitive data)
ALTER TABLE public.class_counters DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow anon full access on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow anon full access on students" ON public.students;
DROP POLICY IF EXISTS "Allow anon full access on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow anon full access on spaced_repetition" ON public.spaced_repetition;
DROP POLICY IF EXISTS "Allow anon full access on master_words" ON public.master_words;

-- Also drop any older/differently named policies that may exist
DROP POLICY IF EXISTS "anon_all_classes" ON public.classes;
DROP POLICY IF EXISTS "anon_all_students" ON public.students;
DROP POLICY IF EXISTS "anon_all_lessons" ON public.lessons;
DROP POLICY IF EXISTS "anon_all_spaced_repetition" ON public.spaced_repetition;
DROP POLICY IF EXISTS "anon_all_master_words" ON public.master_words;

-- 3. Create clean policies for ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- classes
CREATE POLICY "anon_all_classes" ON public.classes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- students
CREATE POLICY "anon_all_students" ON public.students
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- lessons
CREATE POLICY "anon_all_lessons" ON public.lessons
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- spaced_repetition
CREATE POLICY "anon_all_spaced_repetition" ON public.spaced_repetition
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- master_words
CREATE POLICY "anon_all_master_words" ON public.master_words
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. Grant explicit table-level permissions to the anon role
-- (Required in some Supabase configurations)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaced_repetition TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_words TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_counters TO anon;

-- 5. Ensure the increment_class_counter function still works
-- Recreate it to be safe
CREATE OR REPLACE FUNCTION public.increment_class_counter(counter_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_val integer;
BEGIN
  INSERT INTO public.class_counters (id, count)
  VALUES (counter_key, 1)
  ON CONFLICT (id) DO UPDATE
  SET count = public.class_counters.count + 1
  RETURNING count INTO new_val;
  RETURN new_val;
END;
$$;
