-- =============================================
-- MIGRACIÓN: Asegurar RLS en todas las tablas y vistas
-- Fecha: 2026-02-22
-- 
-- Tablas afectadas: shipping_methods, product_variants, tags, product_tags
-- Vistas afectadas: admin_stats, orders_summary, order_details, 
--                   customer_favorites_detail, product_total_stock
-- =============================================

-- =============================================
-- 1. TABLA: shipping_methods
-- Estado actual: RLS NO habilitado
-- Necesidad: lectura pública (checkout carga métodos con anon key)
-- =============================================
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_methods_public_read" ON shipping_methods;
CREATE POLICY "shipping_methods_public_read"
  ON shipping_methods FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "shipping_methods_service_write" ON shipping_methods;
CREATE POLICY "shipping_methods_service_write"
  ON shipping_methods FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 2. TABLA: product_variants
-- Estado actual: RLS NO habilitado en producción (schema lo tenía pero no se aplicó)
-- Necesidad: lectura pública (API /api/products/stock usa anon key)
-- =============================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Re-aplicar políticas (idempotente con DROP IF EXISTS)
DROP POLICY IF EXISTS "product_variants_public_read" ON product_variants;
CREATE POLICY "product_variants_public_read"
  ON product_variants FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.active = true
    )
  );

DROP POLICY IF EXISTS "product_variants_auth_write" ON product_variants;
CREATE POLICY "product_variants_auth_write"
  ON product_variants FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 3. TABLA: tags  
-- Estado actual: RLS NO habilitado en producción
-- Necesidad: lectura pública (datos de catálogo, posibles joins)
-- =============================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_public_read" ON tags;
CREATE POLICY "tags_public_read"
  ON tags FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "tags_auth_write" ON tags;
CREATE POLICY "tags_auth_write"
  ON tags FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 4. TABLA: product_tags
-- Estado actual: RLS NO habilitado en producción
-- Necesidad: lectura pública (joins con productos activos)
-- =============================================
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_tags_public_read" ON product_tags;
CREATE POLICY "product_tags_public_read"
  ON product_tags FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_tags.product_id 
      AND products.active = true
    )
  );

DROP POLICY IF EXISTS "product_tags_auth_write" ON product_tags;
CREATE POLICY "product_tags_auth_write"
  ON product_tags FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 5. VISTA: admin_stats
-- Riesgo: expone revenue total, conteo de clientes a anon
-- Solución: recrear con security_invoker = true
--           (como no hay RLS en admins para anon → no devuelve datos)
-- =============================================

CREATE OR REPLACE VIEW admin_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM admins WHERE is_active = TRUE) as active_admins,
  (SELECT COUNT(*) FROM products WHERE active = TRUE) as active_products,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE customer_id IS NOT NULL) as total_customers,
  (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status IN ('paid', 'shipped', 'delivered')) as total_revenue;

-- =============================================
-- 6. VISTA: orders_summary  
-- Riesgo: expone todos los pedidos con datos de clientes a anon
-- Solución: recrear con security_invoker = true
-- =============================================

CREATE OR REPLACE VIEW orders_summary
WITH (security_invoker = true) AS
SELECT 
  o.id,
  o.customer_id,
  c.email AS customer_email,
  c.full_name AS customer_name,
  o.total_price,
  o.status,
  o.shipping_address,
  o.created_at,
  COUNT(oi.id) AS total_items,
  SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.email, c.full_name;

-- =============================================
-- 7. VISTA: order_details
-- Riesgo: expone líneas de pedido de todos los clientes a anon
-- Solución: recrear con security_invoker = true
-- =============================================

CREATE OR REPLACE VIEW order_details
WITH (security_invoker = true) AS
SELECT 
  o.id AS order_id,
  o.customer_id,
  o.status,
  o.total_price AS order_total,
  o.created_at AS order_date,
  oi.id AS item_id,
  oi.product_id,
  oi.product_name,
  oi.product_slug,
  oi.product_image,
  oi.quantity,
  oi.size,
  oi.price_at_purchase,
  (oi.quantity * oi.price_at_purchase) AS item_total,
  p.price AS current_price,
  p.slug AS current_slug,
  CASE 
    WHEN p.id IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END AS product_exists
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id;

-- =============================================
-- 8. VISTA: customer_favorites_detail
-- Riesgo: expone favoritos de todos los clientes a anon
-- Solución: recrear con security_invoker = true
-- =============================================

CREATE OR REPLACE VIEW customer_favorites_detail
WITH (security_invoker = true) AS
SELECT 
  cf.id AS favorite_id,
  cf.customer_id,
  cf.created_at AS favorited_at,
  p.id AS product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  p.price AS current_price,
  p.original_price,
  p.is_offer,
  p.discount_percent,
  p.active AS product_active,
  (
    SELECT pi.image_url 
    FROM product_images pi 
    WHERE pi.product_id = p.id 
    ORDER BY pi."order" ASC 
    LIMIT 1
  ) AS product_image
FROM customer_favorites cf
JOIN products p ON cf.product_id = p.id;

-- =============================================
-- 9. VISTA: product_total_stock (legacy)
-- Bajo riesgo pero conviene asegurar
-- La tabla fuente product_stock puede no existir ya
-- Recrear con security_invoker si la tabla existe
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'product_stock'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW product_total_stock
      WITH (security_invoker = true) AS
      SELECT 
        product_id,
        SUM(quantity) as total_stock,
        COUNT(*) as size_count,
        jsonb_object_agg(size, quantity) as stock_by_size
      FROM product_stock
      GROUP BY product_id;
    ';
  END IF;
END $$;

-- =============================================
-- NOTA: products_with_image ya tiene security_invoker = true ✓
-- No necesita cambios.
-- =============================================

-- =============================================
-- VERIFICACIÓN: Listar estado RLS de todas las tablas
-- Ejecutar manualmente para confirmar:
-- 
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
-- =============================================
