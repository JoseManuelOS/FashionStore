
-- Add price and offer columns to product_variants if they don't exist
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_offer BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies allow update
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
