-- =============================================
-- FashionMarket - Schema para Clientes
-- Sistema de registro, pedidos y favoritos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- 👤 TABLA: customers
-- Perfil extendido de clientes registrados
-- Se vincula con auth.users de Supabase
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Dirección por defecto
  default_address JSONB DEFAULT '{}',
  -- Preferencias
  newsletter BOOLEAN DEFAULT FALSE,
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- Comentarios
COMMENT ON TABLE customers IS 'Perfiles extendidos de clientes registrados';
COMMENT ON COLUMN customers.id IS 'UUID del usuario en auth.users';
COMMENT ON COLUMN customers.default_address IS 'Dirección por defecto en formato JSON: {street, city, postal_code, province, country}';

-- =============================================
-- ❤️ TABLA: customer_favorites
-- Productos favoritos de cada cliente
-- =============================================
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Evitar duplicados
  UNIQUE(customer_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_customer ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON customer_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON customer_favorites(created_at DESC);

-- Comentarios
COMMENT ON TABLE customer_favorites IS 'Productos marcados como favoritos por los clientes';

-- =============================================
-- 🔄 MODIFICAR: orders
-- Añadir referencia a customer (opcional para invitados)
-- =============================================

-- Añadir columna customer_id a orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Índice para pedidos por cliente
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;

-- Comentario
COMMENT ON COLUMN orders.customer_id IS 'Cliente registrado (NULL para compras como invitado)';

-- =============================================
-- 🔄 MODIFICAR: order_items
-- Asegurar que guardamos info del producto para historial
-- =============================================

-- Añadir columna para imagen del producto (para mostrar en historial)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- Añadir columna para el slug (para enlazar al producto actual)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_slug TEXT;

-- Comentarios
COMMENT ON COLUMN order_items.product_image IS 'URL de imagen del producto al momento de la compra';
COMMENT ON COLUMN order_items.product_slug IS 'Slug del producto para enlazar a la página actual';

-- =============================================
-- ⚙️ TRIGGER: Crear perfil automáticamente
-- Cuando un usuario se registra en auth.users
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ⚙️ TRIGGER: updated_at para customers
-- =============================================
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- ----- CUSTOMERS -----
-- Los clientes solo pueden ver y editar su propio perfil
CREATE POLICY "customers_own_profile_select"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "customers_own_profile_update"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Los admins pueden ver todos los clientes
CREATE POLICY "customers_admin_all"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ----- CUSTOMER_FAVORITES -----
-- Los clientes solo pueden gestionar sus propios favoritos
CREATE POLICY "favorites_own_select"
  ON customer_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "favorites_own_insert"
  ON customer_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "favorites_own_delete"
  ON customer_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);

-- ----- ORDERS (actualizar políticas) -----
-- Los clientes pueden ver sus propios pedidos
DROP POLICY IF EXISTS "orders_customer_read" ON orders;
CREATE POLICY "orders_customer_read"
  ON orders FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() 
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Los clientes pueden crear pedidos vinculados a su cuenta
DROP POLICY IF EXISTS "orders_customer_insert" ON orders;
CREATE POLICY "orders_customer_insert"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() 
    AND total_price >= 0
  );

-- ----- ORDER_ITEMS (actualizar políticas) -----
-- Los clientes pueden ver los items de sus pedidos
DROP POLICY IF EXISTS "order_items_customer_read" ON order_items;
CREATE POLICY "order_items_customer_read"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.customer_id = auth.uid()
        OR auth.uid() IN (
          SELECT id FROM auth.users 
          WHERE raw_user_meta_data->>'role' = 'admin'
        )
      )
    )
  );

-- =============================================
-- 📊 VISTAS ÚTILES
-- =============================================

-- Vista: Pedidos con total de items
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
  o.id,
  o.customer_id,
  c.email AS customer_email,
  c.full_name AS customer_name,
  o.total_price,
  o.status,
  o.shipping_address,
  o.created_at,
  COUNT(oi.id) AS total_items,
  SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.email, c.full_name;

-- Vista: Historial de pedidos con productos
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id AS order_id,
  o.customer_id,
  o.status,
  o.total_price AS order_total,
  o.created_at AS order_date,
  oi.id AS item_id,
  oi.product_id,
  oi.product_name,
  oi.product_slug,
  oi.product_image,
  oi.quantity,
  oi.size,
  oi.price_at_purchase,
  (oi.quantity * oi.price_at_purchase) AS item_total,
  p.price AS current_price,
  p.slug AS current_slug,
  CASE 
    WHEN p.id IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END AS product_exists
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id;

-- Vista: Favoritos del cliente con info del producto
CREATE OR REPLACE VIEW customer_favorites_detail AS
SELECT 
  cf.id AS favorite_id,
  cf.customer_id,
  cf.created_at AS favorited_at,
  p.id AS product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  p.price AS current_price,
  p.original_price,
  p.is_offer,
  p.discount_percent,
  p.active AS product_active,
  (
    SELECT pi.image_url 
    FROM product_images pi 
    WHERE pi.product_id = p.id 
    ORDER BY pi."order" ASC 
    LIMIT 1
  ) AS product_image
FROM customer_favorites cf
JOIN products p ON cf.product_id = p.id;

-- =============================================
-- 🔧 FUNCIONES ÚTILES
-- =============================================

-- Función: Añadir a favoritos
CREATE OR REPLACE FUNCTION add_to_favorites(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO customer_favorites (customer_id, product_id)
  VALUES (auth.uid(), p_product_id)
  ON CONFLICT (customer_id, product_id) DO NOTHING;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Función: Quitar de favoritos
CREATE OR REPLACE FUNCTION remove_from_favorites(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM customer_favorites 
  WHERE customer_id = auth.uid() 
  AND product_id = p_product_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Función: Verificar si producto está en favoritos
CREATE OR REPLACE FUNCTION is_favorite(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customer_favorites 
    WHERE customer_id = auth.uid() 
    AND product_id = p_product_id
  );
END;
$$;

-- Función: Obtener favoritos del usuario actual
CREATE OR REPLACE FUNCTION get_my_favorites()
RETURNS SETOF customer_favorites_detail
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM customer_favorites_detail 
  WHERE customer_id = auth.uid()
  ORDER BY favorited_at DESC;
$$;

-- Función: Obtener pedidos del usuario actual
CREATE OR REPLACE FUNCTION get_my_orders()
RETURNS SETOF orders_summary
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders_summary 
  WHERE customer_id = auth.uid()
  ORDER BY created_at DESC;
$$;

-- Función: Obtener detalle de un pedido
CREATE OR REPLACE FUNCTION get_order_detail(p_order_id UUID)
RETURNS SETOF order_details
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM order_details 
  WHERE order_id = p_order_id 
  AND customer_id = auth.uid()
  ORDER BY item_id;
$$;

-- Función: Crear pedido completo desde el carrito
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_items JSONB,
  p_shipping_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_product RECORD;
BEGIN
  -- Calcular total y validar productos
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, slug, price, 
           (SELECT image_url FROM product_images WHERE product_id = products.id ORDER BY "order" LIMIT 1) as image
    INTO v_product
    FROM products 
    WHERE id = (v_item->>'product_id')::UUID 
    AND active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no encontrado o no disponible: %', v_item->>'product_id';
    END IF;
    
    v_total := v_total + (v_product.price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- Crear pedido
  INSERT INTO orders (customer_id, total_price, status, shipping_address)
  VALUES (auth.uid(), v_total, 'pending', p_shipping_address)
  RETURNING id INTO v_order_id;

  -- Insertar items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, slug, price,
           (SELECT image_url FROM product_images WHERE product_id = products.id ORDER BY "order" LIMIT 1) as image
    INTO v_product
    FROM products 
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (
      order_id, 
      product_id, 
      product_name, 
      product_slug,
      product_image,
      quantity, 
      size, 
      price_at_purchase
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.slug,
      v_product.image,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- =============================================
-- 📝 EJEMPLOS DE USO
-- =============================================

/*
-- 1. Registrar usuario (se hace desde el cliente con Supabase Auth)
-- El trigger creará automáticamente el perfil en customers

-- 2. Actualizar perfil del cliente
UPDATE customers 
SET 
  full_name = 'Juan García',
  phone = '+34 612 345 678',
  default_address = '{"street": "Calle Mayor 123", "city": "Madrid", "postal_code": "28001", "province": "Madrid", "country": "España"}'
WHERE id = auth.uid();

-- 3. Añadir a favoritos
SELECT add_to_favorites('uuid-del-producto');

-- 4. Quitar de favoritos
SELECT remove_from_favorites('uuid-del-producto');

-- 5. Ver mis favoritos
SELECT * FROM get_my_favorites();

-- 6. Ver si un producto es favorito
SELECT is_favorite('uuid-del-producto');

-- 7. Crear un pedido desde el carrito
SELECT create_order_from_cart(
  '[
    {"product_id": "uuid-producto-1", "quantity": 2, "size": "M"},
    {"product_id": "uuid-producto-2", "quantity": 1, "size": "L"}
  ]'::jsonb,
  'Calle Mayor 123, 28001 Madrid'
);

-- 8. Ver mis pedidos
SELECT * FROM get_my_orders();

-- 9. Ver detalle de un pedido (muestra precio de compra y precio actual)
SELECT 
  product_name,
  quantity,
  size,
  price_at_purchase,
  current_price,
  CASE 
    WHEN current_price > price_at_purchase THEN 'Subió'
    WHEN current_price < price_at_purchase THEN 'Bajó'
    ELSE 'Igual'
  END as price_change,
  product_exists,
  current_slug  -- Usar para enlazar: /productos/{current_slug}
FROM get_order_detail('uuid-del-pedido');

*/
