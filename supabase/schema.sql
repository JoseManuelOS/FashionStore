-- =============================================
-- FashionMarket Database Schema (Mejorado)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 📦 TABLA: categories
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías por defecto
INSERT INTO categories (name, slug) VALUES
  ('Camisas', 'camisas'),
  ('Pantalones', 'pantalones'),
  ('Trajes', 'trajes');

-- =============================================
-- 👕 TABLA: products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_offer BOOLEAN DEFAULT FALSE,
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_offer ON products(is_offer) WHERE is_offer = TRUE;

-- =============================================
-- 🖼️ TABLA: product_images
-- Relación 1:N con products
-- =============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para obtener imágenes de un producto ordenadas
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, "order");

-- =============================================
-- 🧾 TABLA: orders
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  customer_email TEXT,
  customer_name TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- =============================================
-- 📋 TABLA: order_items
-- Detalle de cada pedido
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Guardamos nombre por si el producto se elimina
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size TEXT,
  price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================
-- ⚙️ TABLA: settings
-- Configuración global del sistema
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración inicial
INSERT INTO settings (key, value, description) VALUES
  ('offers_enabled', 'true', 'Habilitar sección de Ofertas Flash'),
  ('free_shipping_threshold', '5000', 'Mínimo para envío gratis (en céntimos)'),
  ('store_open', 'true', 'Tienda abierta para pedidos');

-- =============================================
-- 🔄 TRIGGER: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ----- CATEGORIES -----
-- Lectura pública
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Escritura: solo usuarios autenticados con verificación explícita
CREATE POLICY "categories_auth_write"
  ON categories FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----- PRODUCTS -----
-- Lectura pública (solo activos)
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  TO public
  USING (active = true);

-- Escritura: solo usuarios autenticados
CREATE POLICY "products_auth_write"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----- PRODUCT_IMAGES -----
-- Lectura pública (si el producto está activo)
CREATE POLICY "product_images_public_read"
  ON product_images FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.active = true
    )
  );

-- Escritura: solo usuarios autenticados
CREATE POLICY "product_images_auth_write"
  ON product_images FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----- ORDERS -----
-- Lectura y gestión: solo usuarios autenticados
CREATE POLICY "orders_auth_all"
  ON orders FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Inserción anónima: solo permitir crear pedidos con campos válidos
CREATE POLICY "orders_anon_insert"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (
    total_price >= 0 
    AND status = 'pending'
  );

-- ----- ORDER_ITEMS -----
-- Lectura y gestión: solo usuarios autenticados
CREATE POLICY "order_items_auth_all"
  ON order_items FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Inserción anónima: validar que el item tiene datos correctos
CREATE POLICY "order_items_anon_insert"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (
    quantity > 0 
    AND price_at_purchase >= 0
  );

-- ----- SETTINGS -----
-- Lectura pública (para configuración del frontend)
CREATE POLICY "settings_public_read"
  ON settings FOR SELECT
  TO public
  USING (true);

-- Escritura: solo usuarios autenticados
CREATE POLICY "settings_auth_write"
  ON settings FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 📸 STORAGE POLICIES (para bucket products-images)
-- =============================================
-- Nota: Primero crea el bucket "products-images" como PÚBLICO
-- en Storage > New Bucket

-- Lectura pública
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products-images');

-- Subida solo autenticados
CREATE POLICY "storage_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products-images');

-- Actualización solo autenticados
CREATE POLICY "storage_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products-images');

-- Eliminación solo autenticados
CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products-images');

-- =============================================
-- 🧪 DATOS DE PRUEBA (Opcional)
-- =============================================

-- Productos de ejemplo
INSERT INTO products (name, slug, description, price, stock, category_id, is_offer) VALUES
  (
    'Camisa Oxford Premium',
    'camisa-oxford-premium',
    'Camisa Oxford de algodón 100% con acabado premium. Perfecta para ocasiones formales e informales.',
    89.99,
    25,
    (SELECT id FROM categories WHERE slug = 'camisas'),
    false
  ),
  (
    'Pantalón Chino Slim',
    'pantalon-chino-slim',
    'Pantalón chino de corte slim en algodón elástico. Comodidad y elegancia en un solo producto.',
    74.99,
    30,
    (SELECT id FROM categories WHERE slug = 'pantalones'),
    true
  ),
  (
    'Traje Ejecutivo Marino',
    'traje-ejecutivo-marino',
    'Traje de dos piezas en lana italiana. El epítome de la elegancia masculina.',
    349.99,
    10,
    (SELECT id FROM categories WHERE slug = 'trajes'),
    false
  );

-- Imágenes de los productos
INSERT INTO product_images (product_id, image_url, "order") VALUES
  ((SELECT id FROM products WHERE slug = 'camisa-oxford-premium'), 'https://placehold.co/800x1000/1e3a5f/ffffff?text=Oxford+1', 0),
  ((SELECT id FROM products WHERE slug = 'camisa-oxford-premium'), 'https://placehold.co/800x1000/1e3a5f/ffffff?text=Oxford+2', 1),
  ((SELECT id FROM products WHERE slug = 'pantalon-chino-slim'), 'https://placehold.co/800x1000/374151/ffffff?text=Chino+1', 0),
  ((SELECT id FROM products WHERE slug = 'traje-ejecutivo-marino'), 'https://placehold.co/800x1000/1e3a5f/ffffff?text=Traje+1', 0),
  ((SELECT id FROM products WHERE slug = 'traje-ejecutivo-marino'), 'https://placehold.co/800x1000/1e3a5f/ffffff?text=Traje+2', 1);

-- =============================================
-- 📊 VISTAS ÚTILES (Opcional)
-- =============================================

-- Vista de productos con su imagen principal
-- Usamos SECURITY INVOKER para respetar RLS del usuario que consulta
CREATE OR REPLACE VIEW products_with_image 
WITH (security_invoker = true) AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  (
    SELECT image_url 
    FROM product_images pi 
    WHERE pi.product_id = p.id 
    ORDER BY pi."order" ASC 
    LIMIT 1
  ) as main_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.active = true;

