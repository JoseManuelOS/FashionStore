-- Migration: Add style_config column to carousel_slides table
-- Run this in Supabase SQL Editor

-- Add style_config column for storing element positions and sizes
-- This stores position and size configuration for desktop and mobile views
ALTER TABLE carousel_slides ADD COLUMN IF NOT EXISTS style_config JSONB DEFAULT '{}'::jsonb;

-- Example of the style_config structure:
/*
{
  "desktop": {
    "title": { "top": "25%", "left": "10%", "fontSize": "4rem", "maxWidth": "60%" },
    "subtitle": { "top": "15%", "left": "10%", "fontSize": "1rem" },
    "description": { "top": "45%", "left": "10%", "fontSize": "1.125rem", "maxWidth": "40%" },
    "cta": { "top": "65%", "left": "10%", "fontSize": "1rem", "padding": "16px 32px" },
    "discount": { "top": "55%", "left": "10%" }
  },
  "mobile": {
    "title": { "top": "30%", "left": "5%", "fontSize": "2rem", "maxWidth": "90%" },
    "subtitle": { "top": "22%", "left": "5%", "fontSize": "0.875rem" },
    "description": { "top": "50%", "left": "5%", "fontSize": "0.875rem", "maxWidth": "90%" },
    "cta": { "top": "70%", "left": "5%", "fontSize": "0.875rem", "padding": "12px 24px" },
    "discount": { "top": "62%", "left": "5%" }
  }
}
*/

-- Add comment to document the column
COMMENT ON COLUMN carousel_slides.style_config IS 'JSON configuration for element positions and sizes. Supports desktop and mobile breakpoints.';

-- If you already have the column but it has old data structure (without desktop/mobile), 
-- you can migrate existing data with this optional query:
-- UPDATE carousel_slides 
-- SET style_config = jsonb_build_object(
--   'desktop', style_config,
--   'mobile', style_config
-- )
-- WHERE style_config IS NOT NULL 
--   AND style_config != '{}'::jsonb
--   AND NOT (style_config ? 'desktop');
