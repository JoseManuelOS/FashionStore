-- =============================================
-- Dashboard KPI Functions
-- Agregaciones calculadas a nivel SQL para rendimiento óptimo
-- =============================================

-- 1. Ventas mensuales: SUM(total_price) de pedidos válidos del mes actual
CREATE OR REPLACE FUNCTION get_monthly_sales()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_price), 0)
  FROM orders
  WHERE status IN ('paid', 'shipped', 'delivered')
    AND created_at >= date_trunc('month', CURRENT_DATE);
$$;

-- 2. Producto más vendido: product_name con mayor SUM(quantity)
CREATE OR REPLACE FUNCTION get_top_product()
RETURNS TABLE(name TEXT, quantity BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    oi.product_name AS name,
    SUM(oi.quantity)::BIGINT AS quantity
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('paid', 'shipped', 'delivered')
  GROUP BY oi.product_name
  ORDER BY quantity DESC
  LIMIT 1;
$$;

-- 3. Ventas últimos 7 días agrupadas por fecha
CREATE OR REPLACE FUNCTION get_last_7_days_sales()
RETURNS TABLE(date TEXT, total NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH dates AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      '1 day'::interval
    )::date AS day
  )
  SELECT 
    d.day::TEXT AS date,
    COALESCE(SUM(o.total_price), 0) AS total
  FROM dates d
  LEFT JOIN orders o 
    ON o.created_at::date = d.day
    AND o.status IN ('paid', 'shipped', 'delivered')
  GROUP BY d.day
  ORDER BY d.day;
$$;

-- 4. Conteo de productos con stock bajo (alguna variante con stock <= 5)
CREATE OR REPLACE FUNCTION get_low_stock_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT pv.product_id)::INTEGER
  FROM product_variants pv
  INNER JOIN products p ON p.id = pv.product_id
  WHERE p.active = true
    AND pv.stock <= 5;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_monthly_sales() TO service_role;
GRANT EXECUTE ON FUNCTION get_top_product() TO service_role;
GRANT EXECUTE ON FUNCTION get_last_7_days_sales() TO service_role;
GRANT EXECUTE ON FUNCTION get_low_stock_count() TO service_role;
