-- Fix: Expand VARCHAR columns that were too small
-- product_images.color_hex was VARCHAR(7) — not enough for hex codes with extra data
-- product_variants.size was VARCHAR(10) — not enough for "Talla Única" etc.

ALTER TABLE product_images 
  ALTER COLUMN color_hex TYPE VARCHAR(30);

ALTER TABLE product_variants 
  ALTER COLUMN size TYPE VARCHAR(50);
