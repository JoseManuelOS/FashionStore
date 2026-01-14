-- =============================================
-- 📦 MIGRACIÓN: Añadir campos de envío y seguimiento a orders
-- =============================================

-- Añadir campos para tracking de Stripe
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Añadir campos para empresa de envío y seguimiento
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Añadir campo para imagen del producto en order_items (para emails)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Crear índice para buscar por session de Stripe
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

-- Comentarios para documentar los campos
COMMENT ON COLUMN orders.shipping_carrier IS 'Empresa transportista: SEUR, MRW, Correos, GLS, UPS, DHL, Envialia, Nacex';
COMMENT ON COLUMN orders.tracking_number IS 'Código de seguimiento del envío';
COMMENT ON COLUMN orders.tracking_url IS 'URL para rastrear el envío';
COMMENT ON COLUMN orders.shipped_at IS 'Fecha y hora de envío';
COMMENT ON COLUMN orders.delivered_at IS 'Fecha y hora de entrega';
