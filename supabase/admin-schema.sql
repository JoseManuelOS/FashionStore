-- =============================================
-- FashionMarket - Schema para Administradores
-- Sistema de autenticación y gestión de admin
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- �️ LIMPIEZA: Eliminar todo lo relacionado con admin
-- =============================================

-- Eliminar vistas
DROP VIEW IF EXISTS admin_stats CASCADE;

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "Super admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can view own profile" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "System can insert activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "Allow all for admins" ON admins;
DROP POLICY IF EXISTS "Allow all for admin_activity_log" ON admin_activity_log;

-- Eliminar funciones
DROP FUNCTION IF EXISTS verify_admin_credentials(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_admin(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS change_admin_password(UUID, TEXT) CASCADE;

-- Eliminar tablas (en orden correcto por dependencias)
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- =============================================
-- 🔧 EXTENSIÓN: pgcrypto para bcrypt
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 👨‍💼 TABLA: admins
-- Lista de usuarios con permisos de administrador
-- =============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Hash de la contraseña (bcrypt)
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_created ON admins(created_at DESC);

-- Comentarios
COMMENT ON TABLE admins IS 'Usuarios con permisos de administrador del sistema';
COMMENT ON COLUMN admins.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN admins.role IS 'Rol: admin (gestión normal) o super_admin (acceso total)';
COMMENT ON COLUMN admins.is_active IS 'Si está activo puede iniciar sesión';

-- =============================================
-- 🔐 FUNCIÓN: Verificar credenciales de admin
-- =============================================
CREATE OR REPLACE FUNCTION verify_admin_credentials(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_record RECORD;
BEGIN
  -- Buscar admin por email
  SELECT a.id, a.email, a.full_name, a.role, a.password_hash, a.is_active
  INTO v_admin_record
  FROM admins a
  WHERE a.email = p_email
  AND a.is_active = TRUE;
  
  -- Si no existe o no está activo
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verificar password (usa extensión pgcrypto)
  IF v_admin_record.password_hash = crypt(p_password, v_admin_record.password_hash) THEN
    -- Actualizar último login
    UPDATE admins 
    SET last_login = NOW(),
        updated_at = NOW()
    WHERE admins.id = v_admin_record.id;
    
    -- Retornar datos del admin
    RETURN QUERY
    SELECT 
      v_admin_record.id,
      v_admin_record.email,
      v_admin_record.full_name,
      v_admin_record.role;
  END IF;
END;
$$;

-- =============================================
-- 🔐 FUNCIÓN: Crear admin
-- =============================================
CREATE OR REPLACE FUNCTION create_admin(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Habilitar extensión pgcrypto si no existe
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Insertar admin con password hasheado
  INSERT INTO admins (email, password_hash, full_name, role)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')), -- bcrypt
    p_full_name,
    p_role
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$;

-- =============================================
-- 🔐 FUNCIÓN: Cambiar contraseña de admin
-- =============================================
CREATE OR REPLACE FUNCTION change_admin_password(
  p_admin_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admins
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- 📋 TABLA: admin_activity_log
-- Registro de actividades de administradores
-- =============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'logout', 'create_product', 'update_product', etc.
  entity_type TEXT, -- 'product', 'order', 'customer', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity_log(created_at DESC);

-- Comentarios
COMMENT ON TABLE admin_activity_log IS 'Registro de todas las acciones realizadas por administradores';

-- =============================================
-- 🎯 RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en tablas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Política permisiva para admins (el control de acceso lo hace la API con service_role)
-- Service role key bypasea RLS, pero agregamos políticas por si se usa anon key
CREATE POLICY "Allow service role full access to admins"
  ON admins FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política permisiva para activity log
CREATE POLICY "Allow service role full access to admin_activity_log"
  ON admin_activity_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 📊 VISTA: admin_stats
-- Estadísticas rápidas para el dashboard
-- =============================================
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM admins WHERE is_active = TRUE) as active_admins,
  (SELECT COUNT(*) FROM products WHERE active = TRUE) as active_products,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE customer_id IS NOT NULL) as total_customers,
  (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status IN ('paid', 'shipped', 'delivered')) as total_revenue;

-- =============================================
-- 🌱 SEED: Crear admins por defecto
-- =============================================
-- IMPORTANTE: Cambiar estas credenciales después de la primera ejecución

DO $$
BEGIN
  -- Habilitar extensión si no existe
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Crear super admin por defecto solo si no existe
  IF NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@fashionmarket.es') THEN
    INSERT INTO admins (email, password_hash, full_name, role)
    VALUES (
      'admin@fashionmarket.es',
      crypt('Admin123!', gen_salt('bf')),
      'Administrador Principal',
      'super_admin'
    );
    
    RAISE NOTICE 'Super admin creado con éxito';
    RAISE NOTICE 'Email: admin@fashionmarket.es';
    RAISE NOTICE 'Password: Admin123!';
    RAISE NOTICE 'IMPORTANTE: Cambia la contraseña después del primer login';
  ELSE
    RAISE NOTICE 'Super admin ya existe';
  END IF;
  
  -- Crear admin normal con credenciales simples
  IF NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin') THEN
    INSERT INTO admins (email, password_hash, full_name, role)
    VALUES (
      'admin',
      crypt('admin', gen_salt('bf')),
      'Administrador',
      'admin'
    );
    
    RAISE NOTICE 'Admin normal creado con éxito';
    RAISE NOTICE 'Email: admin';
    RAISE NOTICE 'Password: admin';
  ELSE
    RAISE NOTICE 'Admin normal ya existe';
  END IF;
END $$;
