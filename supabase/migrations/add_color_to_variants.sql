-- =============================================
-- MIGRACIÓN: Stock por color
-- Añade columna 'color' a product_variants para 
-- gestionar stock por (producto, talla, color)
-- =============================================

-- 1. Añadir columna color a product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color VARCHAR(100) NOT NULL DEFAULT '';

-- 2. Eliminar constraint único antiguo (product_id, size)
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_size_key;
-- También por si se creó con otro nombre
DROP INDEX IF EXISTS product_variants_product_id_size_key;
DROP INDEX IF EXISTS idx_product_variants_unique;

-- 3. Crear nuevo índice único (product_id, size, color)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_product_size_color 
  ON product_variants(product_id, size, color);

-- 4. Añadir columna colors (JSONB) a products para definir colores disponibles
-- Formato: [{"name": "Negro", "hex": "#000000"}, {"name": "Blanco", "hex": "#FFFFFF"}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- 5. Añadir columna color a order_items para rastrear qué color se compró
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color VARCHAR(100);

-- 6. Añadir columna product_image a order_items si no existe
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 7. Actualizar función decrement_variant_stock para incluir color
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_product_id UUID,
  p_size VARCHAR,
  p_quantity INTEGER,
  p_color VARCHAR DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE product_id = p_product_id
    AND size = p_size
    AND color = p_color
    AND stock >= p_quantity;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- 8. Actualizar función increment_variant_stock para incluir color
CREATE OR REPLACE FUNCTION increment_variant_stock(
  p_product_id UUID,
  p_size VARCHAR,
  p_quantity INTEGER,
  p_color VARCHAR DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE product_variants
  SET stock = stock + p_quantity
  WHERE product_id = p_product_id
    AND size = p_size
    AND color = p_color;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
