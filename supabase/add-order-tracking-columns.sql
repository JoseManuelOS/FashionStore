-- =============================================
-- MIGRACIÓN: Añadir columnas de tracking a orders y order_items
-- Fecha: 2026-01-14
-- Descripción: Añade columnas para tracking de Stripe, envío y relación con customers
-- =============================================

-- Añadir columnas a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Añadir columna a la tabla order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Crear índices para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Comentarios
COMMENT ON COLUMN orders.customer_id IS 'Referencia al cliente autenticado (NULL para clientes invitados)';
COMMENT ON COLUMN orders.stripe_session_id IS 'ID de sesión de Stripe Checkout (único)';
COMMENT ON COLUMN orders.stripe_payment_intent IS 'ID del PaymentIntent de Stripe';
COMMENT ON COLUMN orders.shipping_carrier IS 'Empresa transportista (seur, mrw, correos, etc.)';
COMMENT ON COLUMN orders.tracking_number IS 'Número de seguimiento del envío';
COMMENT ON COLUMN orders.tracking_url IS 'URL completa de seguimiento del envío';
COMMENT ON COLUMN orders.shipped_at IS 'Fecha y hora en que se marcó como enviado';
COMMENT ON COLUMN orders.delivered_at IS 'Fecha y hora en que se marcó como entregado';
COMMENT ON COLUMN order_items.product_image IS 'URL de la imagen del producto en el momento de la compra';
