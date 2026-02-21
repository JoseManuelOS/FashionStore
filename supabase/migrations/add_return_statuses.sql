-- Migration: Add return statuses to orders CHECK constraint
-- This allows orders to have 'return_requested' and 'returned' statuses

-- Drop the existing CHECK constraint on status (auto-named by PostgreSQL)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.orders'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- Add the new CHECK constraint with all 7 statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'paid'::text,
    'shipped'::text,
    'delivered'::text,
    'cancelled'::text,
    'return_requested'::text,
    'returned'::text
  ]));
