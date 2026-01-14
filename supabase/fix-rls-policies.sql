-- =============================================
-- FashionMarket - Fix RLS Policies
-- Arreglar políticas de seguridad que causan error 403
-- =============================================

-- =============================================
-- FIX: Políticas de customer_addresses
-- =============================================

-- Eliminar política de admin que causa problemas
DROP POLICY IF EXISTS "customer_addresses_admin_all" ON customer_addresses;

-- Las políticas básicas ya están bien, solo las recreamos por si acaso
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
-- FIX: Políticas de customers
-- =============================================

-- Eliminar política de admin que causa problemas
DROP POLICY IF EXISTS "customers_admin_all" ON customers;

-- Recrear políticas básicas
DROP POLICY IF EXISTS "customers_own_profile_select" ON customers;
CREATE POLICY "customers_own_profile_select"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "customers_own_profile_update" ON customers;
CREATE POLICY "customers_own_profile_update"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- ✅ VERIFICACIÓN
-- =============================================

SELECT '✅ Políticas RLS actualizadas correctamente' as status;

-- Verificar que las políticas existen
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('customers', 'customer_addresses')
ORDER BY tablename, policyname;
