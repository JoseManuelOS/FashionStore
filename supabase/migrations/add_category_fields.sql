-- Add image_url, description, and display_order to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set default display_order based on current name ordering
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM categories
)
UPDATE categories SET display_order = ordered.rn
FROM ordered WHERE categories.id = ordered.id;
