-- =============================================
-- 🔒 FIX COMPLETO: Orders por customer_id
-- =============================================

-- 1. Añadir columnas si no existen
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 2. IMPORTANTE: Actualizar TODOS los pedidos existentes con su customer_id
UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_email = c.email
AND o.customer_id IS NULL;

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- 4. Verificar resultado
SELECT 
  'Pedidos totales' as info,
  COUNT(*) as total,
  COUNT(customer_id) as con_customer_id,
  COUNT(*) - COUNT(customer_id) as sin_customer_id
FROM orders;
