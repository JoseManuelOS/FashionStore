-- =============================================
-- FashionMarket - Fix & Setup Customer Addresses
-- Asegurar registro en customers y crear tabla de direcciones
-- =============================================

-- =============================================
-- 1️⃣ ASEGURAR REGISTRO EN CUSTOMERS
-- Crear registros en customers para usuarios sin perfil
-- =============================================

-- Insertar registros faltantes en customers desde auth.users
INSERT INTO public.customers (id, email, full_name, phone, avatar_url, default_address, newsletter, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') as full_name,
    u.raw_user_meta_data->>'phone' as phone,
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url,
    '{}'::jsonb as default_address,
    false as newsletter,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.customers c ON u.id = c.id
WHERE c.id IS NULL;

-- =============================================
-- 2️⃣ CREAR TABLA CUSTOMER_ADDRESSES
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

-- =============================================
-- 3️⃣ TRIGGER: Solo una dirección por defecto
-- =============================================

CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Quitar is_default de todas las demás direcciones del cliente
    UPDATE customer_addresses 
    SET is_default = FALSE 
    WHERE customer_id = NEW.customer_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
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
-- 4️⃣ TRIGGER: updated_at automático
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5️⃣ ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Los clientes solo pueden ver y gestionar sus propias direcciones
DROP POLICY IF EXISTS "customer_addresses_own_select" ON customer_addresses;
CREATE POLICY "customer_addresses_own_select"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_addresses_own_insert" ON customer_addresses;
CREATE POLICY "customer_addresses_own_insert"
  ON customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_addresses_own_update" ON customer_addresses;
CREATE POLICY "customer_addresses_own_update"
  ON customer_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_addresses_own_delete" ON customer_addresses;
CREATE POLICY "customer_addresses_own_delete"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);

-- =============================================
-- 6️⃣ MIGRAR DIRECCIONES EXISTENTES
-- Copiar default_address a customer_addresses
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
    AND NOT EXISTS (
      SELECT 1 FROM customer_addresses 
      WHERE customer_id = customers.id
    )
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
        COALESCE(customer_record.full_name, 'Usuario'),
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
-- ✅ VERIFICACIÓN
-- =============================================

-- Ver cuántos usuarios hay en auth.users
SELECT 'Total usuarios en auth.users:' as info, COUNT(*) as count FROM auth.users;

-- Ver cuántos registros hay en customers
SELECT 'Total registros en customers:' as info, COUNT(*) as count FROM customers;

-- Ver cuántos registros hay en customer_addresses
SELECT 'Total direcciones en customer_addresses:' as info, COUNT(*) as count FROM customer_addresses;

-- Mostrar usuarios sin registro en customers (debería estar vacío)
SELECT 'Usuarios sin registro en customers:' as info, u.email
FROM auth.users u
LEFT JOIN customers c ON u.id = c.id
WHERE c.id IS NULL;

SELECT '✅ Setup completado exitosamente' as status;
