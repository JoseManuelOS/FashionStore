-- =============================================
-- Newsletter Subscribers Table
-- Suscriptores independientes de usuarios registrados
-- =============================================

-- Crear tabla de suscriptores
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'popup', -- 'popup', 'footer', 'checkout'
  is_active BOOLEAN DEFAULT TRUE,
  promo_code_sent TEXT, -- código promocional enviado al suscribirse
  unsubscribed_at TIMESTAMPTZ,
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública (para verificar si ya está suscrito)
CREATE POLICY "newsletter_subscribers_public_read" ON newsletter_subscribers
  FOR SELECT TO public USING (true);

-- Política: Inserción pública (para suscribirse)
CREATE POLICY "newsletter_subscribers_public_insert" ON newsletter_subscribers
  FOR INSERT TO public WITH CHECK (true);

-- Política: Admin puede hacer todo
CREATE POLICY "newsletter_subscribers_admin_all" ON newsletter_subscribers
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Comentario
COMMENT ON TABLE newsletter_subscribers IS 'Suscriptores al newsletter que no necesitan cuenta de usuario';
