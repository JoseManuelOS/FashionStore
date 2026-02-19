-- =============================================
-- 🔄 MIGRACIÓN: Copiar stock de product_stock → product_variants
-- 
-- Problema: La app lee/escribe en product_variants, pero los datos
-- reales de stock están en product_stock (poblada por el seed).
-- product_variants está vacía → admin edit muestra todo en 0.
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================

-- 1. Añadir constraint UNIQUE para prevenir duplicados
-- (necesario para upserts futuros y integridad de datos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_variants_product_id_size_key'
    ) THEN
        ALTER TABLE product_variants
        ADD CONSTRAINT product_variants_product_id_size_key 
        UNIQUE (product_id, size);
    END IF;
END $$;

-- 2. Copiar datos de product_stock → product_variants
-- Usa ON CONFLICT para no fallar si ya hay algún dato
INSERT INTO product_variants (product_id, size, stock)
SELECT product_id, size, quantity
FROM product_stock
WHERE quantity > 0
ON CONFLICT (product_id, size) 
DO UPDATE SET stock = EXCLUDED.stock;

-- 3. Para productos que tienen sizes definidas pero NO tienen
-- filas en product_stock ni product_variants, crear filas con stock=0
INSERT INTO product_variants (product_id, size, stock)
SELECT p.id, s.size, 0
FROM products p
CROSS JOIN LATERAL unnest(p.sizes) AS s(size)
WHERE NOT EXISTS (
    SELECT 1 FROM product_variants pv 
    WHERE pv.product_id = p.id AND pv.size = s.size
)
ON CONFLICT (product_id, size) DO NOTHING;

-- 4. Sincronizar products.stock con la suma real de product_variants
UPDATE products p
SET stock = COALESCE(
    (SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id),
    0
);

-- 5. Corregir funciones RPC: eliminar referencia a updated_at
-- (product_variants NO tiene columna updated_at)
CREATE OR REPLACE FUNCTION decrement_variant_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE product_variants
    SET stock = stock - p_quantity
    WHERE product_id = p_product_id
      AND size = p_size
      AND stock >= p_quantity;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_variant_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE product_id = p_product_id
      AND size = p_size;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 6. Verificación: mostrar resultado de la migración
SELECT 
    p.name,
    p.stock as products_stock_total,
    COUNT(pv.id) as variant_rows,
    SUM(pv.stock) as variants_stock_total,
    jsonb_object_agg(pv.size, pv.stock ORDER BY pv.size) as stock_by_size
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.id, p.name, p.stock
ORDER BY p.name;
