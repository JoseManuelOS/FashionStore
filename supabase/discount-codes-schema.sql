-- =============================================
-- 🎟️ TABLA: discount_codes
-- Códigos promocionales para descuentos
-- =============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  -- Tipo de descuento: 'percentage' (porcentaje) o 'fixed' (cantidad fija en €)
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  -- Valor del descuento (porcentaje o euros según el tipo)
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  -- Mínimo de compra requerido (opcional, en €)
  min_purchase NUMERIC(10, 2) DEFAULT 0,
  -- Máximo descuento aplicable (opcional, para porcentajes)
  max_discount NUMERIC(10, 2),
  -- Control de uso
  usage_limit INTEGER, -- NULL = sin límite
  times_used INTEGER DEFAULT 0,
  -- Una vez por cliente
  single_use_per_customer BOOLEAN DEFAULT false,
  -- Fechas de validez
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  -- Estado
  active BOOLEAN DEFAULT true,
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires ON discount_codes(expires_at);

-- =============================================
-- 📝 TABLA: discount_code_usage
-- Registro de uso de códigos por cliente
-- =============================================

CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_email ON discount_code_usage(customer_email);

-- =============================================
-- 🔄 TRIGGER: Actualizar times_used automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION update_discount_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discount_codes 
  SET times_used = times_used + 1,
      updated_at = NOW()
  WHERE id = NEW.discount_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discount_usage ON discount_code_usage;
CREATE TRIGGER trigger_update_discount_usage
AFTER INSERT ON discount_code_usage
FOR EACH ROW
EXECUTE FUNCTION update_discount_code_usage();

-- =============================================
-- 📊 DATOS INICIALES
-- Códigos promocionales de ejemplo
-- =============================================

INSERT INTO discount_codes (code, description, discount_type, discount_value, min_purchase, active) VALUES
  ('BIENVENIDO10', 'Descuento de bienvenida - 10% en tu primera compra', 'percentage', 10, 0, true),
  ('FASHION15', 'Descuento FashionMarket - 15% de descuento', 'percentage', 15, 30, true),
  ('VERANO20', 'Promoción de verano - 20% de descuento', 'percentage', 20, 50, true),
  ('PRIMERACOMPRA', 'Primera compra - 25% de descuento exclusivo', 'percentage', 25, 0, true),
  ('ENVIOGRATIS', 'Compensación envío - 5€ de descuento', 'fixed', 5, 20, true),
  ('NEWSLETTER10', 'Descuento exclusivo newsletter - 10%', 'percentage', 10, 0, true),
  ('VIP20', 'Código VIP - 20% de descuento', 'percentage', 20, 0, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 🔐 POLÍTICAS RLS
-- =============================================

-- Habilitar RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para discount_codes (solo lectura pública de códigos activos)
DROP POLICY IF EXISTS "discount_codes_public_read" ON discount_codes;
CREATE POLICY "discount_codes_public_read" ON discount_codes
  FOR SELECT USING (active = true);

-- Admin puede todo
DROP POLICY IF EXISTS "discount_codes_admin_all" ON discount_codes;
CREATE POLICY "discount_codes_admin_all" ON discount_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para discount_code_usage
DROP POLICY IF EXISTS "discount_usage_insert" ON discount_code_usage;
CREATE POLICY "discount_usage_insert" ON discount_code_usage
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "discount_usage_select" ON discount_code_usage;
CREATE POLICY "discount_usage_select" ON discount_code_usage
  FOR SELECT USING (true);

-- Comentarios
COMMENT ON TABLE discount_codes IS 'Códigos promocionales para descuentos en compras';
COMMENT ON COLUMN discount_codes.discount_type IS 'percentage = porcentaje, fixed = cantidad fija en euros';
COMMENT ON COLUMN discount_codes.single_use_per_customer IS 'Si true, cada cliente solo puede usar el código una vez';
