-- Run this in the Supabase SQL Editor to fix the counter error

-- 1. Create a dedicated table for class counters so we don't conflict with your old "counters" table
CREATE TABLE IF NOT EXISTS class_counters (
  id text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

-- 2. Create the new function that updates the class_counters table safely
CREATE OR REPLACE FUNCTION increment_class_counter(counter_key text)
RETURNS integer
LANGUAGE plpgsql
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
