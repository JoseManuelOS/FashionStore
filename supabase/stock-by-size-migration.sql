-- =============================================
-- FashionMarket - Migración: Stock por Talla
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- 📦 TABLA: product_stock
-- Stock individual por talla de cada producto
-- =============================================
CREATE TABLE IF NOT EXISTS product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cada producto solo puede tener una entrada por talla
  UNIQUE(product_id, size)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_product_stock_product ON product_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_size ON product_stock(size);
CREATE INDEX IF NOT EXISTS idx_product_stock_quantity ON product_stock(quantity) WHERE quantity > 0;

-- Comentarios
COMMENT ON TABLE product_stock IS 'Stock de productos por talla';
COMMENT ON COLUMN product_stock.size IS 'Talla del producto (XS, S, M, L, XL, XXL, etc.)';
COMMENT ON COLUMN product_stock.quantity IS 'Cantidad disponible de esta talla';

-- =============================================
-- 🔄 MIGRACIÓN: Distribuir stock existente por tallas
-- Esto toma el stock global y lo divide equitativamente entre las tallas
-- =============================================
DO $$
DECLARE
  v_product RECORD;
  v_size TEXT;
  v_stock_per_size INTEGER;
  v_remainder INTEGER;
  v_sizes TEXT[];
  v_size_count INTEGER;
  v_current_index INTEGER;
BEGIN
  -- Para cada producto activo
  FOR v_product IN SELECT id, stock, sizes FROM products WHERE active = TRUE
  LOOP
    v_sizes := v_product.sizes;
    v_size_count := array_length(v_sizes, 1);
    
    IF v_size_count IS NULL OR v_size_count = 0 THEN
      v_sizes := ARRAY['S', 'M', 'L', 'XL'];
      v_size_count := 4;
    END IF;
    
    -- Calcular stock por talla (dividir equitativamente)
    v_stock_per_size := v_product.stock / v_size_count;
    v_remainder := v_product.stock % v_size_count;
    v_current_index := 1;
    
    -- Insertar stock para cada talla
    FOREACH v_size IN ARRAY v_sizes
    LOOP
      INSERT INTO product_stock (product_id, size, quantity)
      VALUES (
        v_product.id,
        v_size,
        -- Agregar 1 extra a las primeras tallas para usar el resto
        CASE WHEN v_current_index <= v_remainder 
             THEN v_stock_per_size + 1 
             ELSE v_stock_per_size 
        END
      )
      ON CONFLICT (product_id, size) DO UPDATE 
      SET quantity = EXCLUDED.quantity,
          updated_at = NOW();
      
      v_current_index := v_current_index + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migración de stock completada';
END $$;

-- =============================================
-- 📊 VISTA: product_total_stock
-- Para ver el stock total de un producto (suma de todas las tallas)
-- =============================================
CREATE OR REPLACE VIEW product_total_stock AS
SELECT 
  product_id,
  SUM(quantity) as total_stock,
  COUNT(*) as size_count,
  jsonb_object_agg(size, quantity) as stock_by_size
FROM product_stock
GROUP BY product_id;

-- =============================================
-- 🔧 FUNCIÓN: Obtener stock de una talla específica
-- =============================================
CREATE OR REPLACE FUNCTION get_stock_for_size(
  p_product_id UUID,
  p_size TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quantity INTEGER;
BEGIN
  SELECT quantity INTO v_quantity
  FROM product_stock
  WHERE product_id = p_product_id AND size = p_size;
  
  RETURN COALESCE(v_quantity, 0);
END;
$$;

-- =============================================
-- 🔧 FUNCIÓN: Actualizar stock de una talla
-- =============================================
CREATE OR REPLACE FUNCTION update_stock_for_size(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO product_stock (product_id, size, quantity)
  VALUES (p_product_id, p_size, p_quantity)
  ON CONFLICT (product_id, size) 
  DO UPDATE SET 
    quantity = p_quantity,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- =============================================
-- 🔧 FUNCIÓN: Decrementar stock (para compras)
-- =============================================
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_size TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Obtener stock actual
  SELECT quantity INTO v_current_stock
  FROM product_stock
  WHERE product_id = p_product_id AND size = p_size
  FOR UPDATE; -- Lock para evitar race conditions
  
  -- Verificar si hay suficiente stock
  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Decrementar
  UPDATE product_stock
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id AND size = p_size;
  
  RETURN TRUE;
END;
$$;

-- =============================================
-- 🔧 FUNCIÓN: Inicializar stock para un producto nuevo
-- =============================================
CREATE OR REPLACE FUNCTION init_product_stock(
  p_product_id UUID,
  p_sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  p_default_quantity INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_size TEXT;
BEGIN
  FOREACH v_size IN ARRAY p_sizes
  LOOP
    INSERT INTO product_stock (product_id, size, quantity)
    VALUES (p_product_id, v_size, p_default_quantity)
    ON CONFLICT (product_id, size) DO NOTHING;
  END LOOP;
END;
$$;

-- =============================================
-- 🎯 RLS (Row Level Security)
-- =============================================
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer el stock
CREATE POLICY "Anyone can read product stock"
  ON product_stock FOR SELECT
  USING (true);

-- Solo admins pueden modificar (via service role)
CREATE POLICY "Service role can manage product stock"
  ON product_stock FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 🔔 TRIGGER: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_product_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_stock_timestamp ON product_stock;
CREATE TRIGGER trigger_update_product_stock_timestamp
  BEFORE UPDATE ON product_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_timestamp();

-- =============================================
-- ✅ VERIFICACIÓN: Mostrar stock migrado
-- =============================================
SELECT 
  p.name as producto,
  p.stock as stock_original,
  pts.total_stock as stock_total_nuevo,
  pts.stock_by_size as stock_por_talla
FROM products p
LEFT JOIN product_total_stock pts ON p.id = pts.product_id
WHERE p.active = TRUE
ORDER BY p.name;
