-- Run this in the Supabase SQL Editor to fix the RLS error

-- 1. Create a dedicated table for class counters
CREATE TABLE IF NOT EXISTS class_counters (
  id text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

-- Turn off Row Level Security for this internal table to prevent permission errors
ALTER TABLE class_counters DISABLE ROW LEVEL SECURITY;

-- 2. Create the new function with SECURITY DEFINER
-- This allows the function to bypass RLS and run with admin privileges
CREATE OR REPLACE FUNCTION increment_class_counter(counter_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_val integer;
BEGIN
  INSERT INTO class_counters (id, count)
  VALUES (counter_key, 1)
  ON CONFLICT (id) DO UPDATE
  SET count = class_counters.count + 1
  RETURNING count INTO new_val;
  
  RETURN new_val;
END;
$$;
