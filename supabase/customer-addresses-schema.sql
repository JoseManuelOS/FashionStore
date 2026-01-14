-- =============================================
-- FashionMarket - Multiple Addresses Support
-- Sistema de múltiples direcciones por cliente
-- =============================================

-- =============================================
-- 📍 TABLA: customer_addresses
-- Múltiples direcciones de envío por cliente
-- =============================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- Ej: "Casa", "Trabajo", "Casa de mis padres"
  full_name TEXT NOT NULL,
  phone TEXT,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  province TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ES',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = TRUE;

-- Comentarios
COMMENT ON TABLE customer_addresses IS 'Múltiples direcciones de envío por cliente';
COMMENT ON COLUMN customer_addresses.label IS 'Etiqueta descriptiva: Casa, Trabajo, etc.';
COMMENT ON COLUMN customer_addresses.is_default IS 'Dirección predeterminada para el checkout';

-- =============================================
-- ⚙️ TRIGGER: Solo una dirección por defecto
-- Asegurar que solo una dirección sea is_default
-- =============================================
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Quitar is_default de todas las demás direcciones del cliente
    UPDATE customer_addresses 
    SET is_default = FALSE 
    WHERE customer_id = NEW.customer_id 
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_address ON customer_addresses;
CREATE TRIGGER trigger_single_default_address
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- =============================================
-- ⚙️ TRIGGER: updated_at automático
-- =============================================
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Los clientes solo pueden ver y gestionar sus propias direcciones
CREATE POLICY "customer_addresses_own_select"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_own_insert"
  ON customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_own_update"
  ON customer_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customer_addresses_own_delete"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);

-- Los admins pueden ver todas las direcciones
CREATE POLICY "customer_addresses_admin_all"
  ON customer_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =============================================
-- 📊 MIGRACIÓN: Copiar default_address a tabla
-- Migrar direcciones existentes de customers.default_address
-- =============================================
DO $$
DECLARE
  customer_record RECORD;
  address_data JSONB;
BEGIN
  FOR customer_record IN 
    SELECT id, full_name, phone, default_address 
    FROM customers 
    WHERE default_address IS NOT NULL 
    AND default_address != '{}'::jsonb
  LOOP
    address_data := customer_record.default_address;
    
    -- Solo migrar si tiene los campos mínimos
    IF address_data ? 'street' AND address_data ? 'city' AND address_data ? 'postal_code' THEN
      INSERT INTO customer_addresses (
        customer_id,
        label,
        full_name,
        phone,
        street,
        city,
        postal_code,
        province,
        country,
        is_default
      ) VALUES (
        customer_record.id,
        'Principal',
        customer_record.full_name,
        customer_record.phone,
        address_data->>'street',
        address_data->>'city',
        address_data->>'postal_code',
        COALESCE(address_data->>'province', ''),
        COALESCE(address_data->>'country', 'ES'),
        TRUE
      )
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Dirección migrada para cliente: %', customer_record.id;
    END IF;
  END LOOP;
END $$;

-- =============================================
-- 📝 EJEMPLOS DE USO
-- =============================================

/*
-- 1. Añadir nueva dirección
INSERT INTO customer_addresses (customer_id, label, full_name, phone, street, city, postal_code, province, country, is_default)
VALUES (
  auth.uid(),
  'Casa',
  'Juan García',
  '+34 612 345 678',
  'Calle Mayor 123, 2º B',
  'Madrid',
  '28001',
  'Madrid',
  'ES',
  TRUE
);

-- 2. Ver mis direcciones
SELECT * FROM customer_addresses 
WHERE customer_id = auth.uid() 
ORDER BY is_default DESC, created_at DESC;

-- 3. Actualizar dirección
UPDATE customer_addresses 
SET street = 'Calle Nueva 456', city = 'Barcelona', postal_code = '08001'
WHERE id = 'uuid-direccion' AND customer_id = auth.uid();

-- 4. Marcar dirección como predeterminada
UPDATE customer_addresses 
SET is_default = TRUE 
WHERE id = 'uuid-direccion' AND customer_id = auth.uid();

-- 5. Eliminar dirección
DELETE FROM customer_addresses 
WHERE id = 'uuid-direccion' AND customer_id = auth.uid();

-- 6. Obtener dirección predeterminada
SELECT * FROM customer_addresses 
WHERE customer_id = auth.uid() 
AND is_default = TRUE 
LIMIT 1;
*/
