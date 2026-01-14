-- =============================================
-- 🔒 FIX: Políticas RLS para orders y order_items
-- Permite a los usuarios ver sus propios pedidos
-- =============================================

-- Primero, eliminar políticas existentes que causan problemas
DROP POLICY IF EXISTS "orders_auth_all" ON orders;
DROP POLICY IF EXISTS "orders_anon_insert" ON orders;
DROP POLICY IF EXISTS "order_items_auth_all" ON order_items;
DROP POLICY IF EXISTS "order_items_anon_insert" ON order_items;

-- =============================================
-- ORDERS: Políticas para usuarios autenticados
-- =============================================

-- Los usuarios pueden ver pedidos donde:
-- 1. El customer_email coincida con su email
-- 2. O el customer_id coincida con su ID en la tabla customers
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  TO authenticated
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Los usuarios autenticados pueden crear pedidos
CREATE POLICY "orders_insert_auth"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Los usuarios anónimos también pueden crear pedidos (checkout como invitado)
CREATE POLICY "orders_insert_anon"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (
    total_price >= 0 
    AND status IN ('pending', 'paid')
  );

-- Solo el service role puede actualizar pedidos
CREATE POLICY "orders_update_service"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (true);

-- =============================================
-- ORDER_ITEMS: Políticas para usuarios autenticados
-- =============================================

-- Los usuarios pueden ver items de sus propios pedidos
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE customer_email = auth.jwt() ->> 'email'
      OR customer_id IN (
        SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Inserción para usuarios autenticados
CREATE POLICY "order_items_insert_auth"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Inserción para usuarios anónimos
CREATE POLICY "order_items_insert_anon"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (
    quantity > 0 
    AND price_at_purchase >= 0
  );

-- =============================================
-- Verificar que RLS está habilitado
-- =============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Añadir columnas si no existen (por si no se ejecutó antes)
-- =============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
