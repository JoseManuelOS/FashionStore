-- =============================================
-- 🛍️ SEED DATA: 100 Productos de Moda
-- Ejecutar después de schema.sql
-- =============================================

-- Limpiar datos existentes
DELETE FROM product_images;
DELETE FROM products;

-- Añadir más categorías
INSERT INTO categories (name, slug) VALUES
  ('Chaquetas', 'chaquetas'),
  ('Jerseys', 'jerseys'),
  ('Polos', 'polos'),
  ('Zapatos', 'zapatos'),
  ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 📦 PRODUCTOS: Camisas (1-20)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Camisa Oxford Clásica', 'camisa-oxford-clasica', 'Camisa Oxford de algodón 100% premium. Corte regular, cuello abotonado. La pieza esencial para cualquier armario masculino.', 79.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Lino Verano', 'camisa-lino-verano', 'Camisa de lino puro, perfecta para días cálidos. Transpirable y elegante.', 89.99, 109.99, 18, 35, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL'], true),
('Camisa Formal Ejecutiva', 'camisa-formal-ejecutiva', 'Camisa de vestir con acabado satinado. Ideal para reuniones de negocios.', 94.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Denim Casual', 'camisa-denim-casual', 'Camisa vaquera de algodón suave. Estilo western moderno.', 84.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Cuadros Flannel', 'camisa-cuadros-flannel', 'Camisa de franela con patrón de cuadros. Cálida y acogedora.', 74.99, 89.99, 17, 55, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Slim Fit Stretch', 'camisa-slim-fit-stretch', 'Camisa ajustada con elastano para mayor comodidad. Corte moderno.', 69.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Hawaiana Tropical', 'camisa-hawaiana-tropical', 'Camisa estampada con motivos florales. Perfecta para vacaciones.', 59.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Popelín Premium', 'camisa-popelin-premium', 'Camisa de popelín de alta calidad. Textura suave y duradera.', 99.99, NULL, NULL, 30, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Manga Corta Casual', 'camisa-manga-corta-casual', 'Camisa de manga corta para el verano. Fresca y relajada.', 54.99, 69.99, 21, 70, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Estampado Geométrico', 'camisa-estampado-geometrico', 'Camisa con patrón geométrico moderno. Destaca entre la multitud.', 79.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Cuello Mao', 'camisa-cuello-mao', 'Camisa sin cuello tradicional. Estilo oriental minimalista.', 74.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Sport Técnica', 'camisa-sport-tecnica', 'Camisa con tejido técnico que absorbe la humedad. Para el hombre activo.', 84.99, 99.99, 15, 50, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Rayas Verticales', 'camisa-rayas-verticales', 'Clásica camisa de rayas que estiliza la figura. Siempre elegante.', 69.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Twill Algodón', 'camisa-twill-algodon', 'Camisa de tejido twill diagonal. Textura única y resistente.', 79.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Chambray Ligera', 'camisa-chambray-ligera', 'Camisa de chambray suave. El equilibrio perfecto entre casual y formal.', 72.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Doble Puño', 'camisa-doble-puno', 'Camisa elegante con puños franceses para gemelos. Máxima sofisticación.', 109.99, 129.99, 15, 25, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL'], true),
('Camisa Lino Cuello Italiano', 'camisa-lino-cuello-italiano', 'Camisa de lino con cuello italiano abierto. Estilo mediterráneo.', 94.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Microprint', 'camisa-microprint', 'Camisa con estampado micro discreto. Elegancia sutil.', 74.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL'], true),
('Camisa Punto Tricot', 'camisa-punto-tricot', 'Camisa de punto suave como jersey. Comodidad superior.', 89.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'camisas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Camisa Oversize Urbana', 'camisa-oversize-urbana', 'Camisa de corte amplio estilo streetwear. Tendencia actual.', 69.99, 84.99, 18, 55, (SELECT id FROM categories WHERE slug = 'camisas'), true, ARRAY['S','M','L','XL'], true);

-- =============================================
-- 📦 PRODUCTOS: Pantalones (21-40)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Pantalón Chino Clásico', 'pantalon-chino-clasico', 'Pantalón chino de algodón premium. Corte recto atemporal.', 79.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36','38'], true),
('Pantalón Vestir Italiano', 'pantalon-vestir-italiano', 'Pantalón de vestir con pinzas. Lana fría premium.', 129.99, 159.99, 19, 35, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['30','32','34','36','38'], true),
('Jean Slim Fit Premium', 'jean-slim-fit-premium', 'Vaquero slim de denim japonés. Lavado oscuro sofisticado.', 109.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36'], true),
('Pantalón Cargo Moderno', 'pantalon-cargo-moderno', 'Pantalón cargo con bolsillos laterales. Funcional y estiloso.', 89.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36','38'], true),
('Pantalón Lino Verano', 'pantalon-lino-verano', 'Pantalón de lino puro para el calor. Ligero y transpirable.', 84.99, 99.99, 15, 40, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['30','32','34','36'], true),
('Jean Regular Comfort', 'jean-regular-comfort', 'Vaquero de corte regular con elastano. Comodidad todo el día.', 74.99, NULL, NULL, 70, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36','38'], true),
('Pantalón Jogger Elegante', 'pantalon-jogger-elegante', 'Jogger con tejido técnico y acabados premium. Casual chic.', 79.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['S','M','L','XL'], true),
('Pantalón Plisado Formal', 'pantalon-plisado-formal', 'Pantalón de vestir plisado. Clásico reinventado.', 99.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['30','32','34','36','38'], true),
('Jean Straight Vintage', 'jean-straight-vintage', 'Vaquero recto con lavado vintage. Estilo retro auténtico.', 94.99, 114.99, 17, 45, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['28','30','32','34','36'], true),
('Pantalón Chino Slim', 'pantalon-chino-slim', 'Chino de corte ajustado moderno. Algodón stretch.', 74.99, NULL, NULL, 65, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36','38'], true),
('Pantalón Técnico Golf', 'pantalon-tecnico-golf', 'Pantalón técnico repelente al agua. Performance premium.', 119.99, NULL, NULL, 30, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['30','32','34','36'], true),
('Jean Tapered Selvedge', 'jean-tapered-selvedge', 'Denim selvedge japonés con corte tapered. Para conocedores.', 149.99, 179.99, 17, 25, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['28','30','32','34','36'], true),
('Pantalón Cordura Outdoor', 'pantalon-cordura-outdoor', 'Pantalón resistente para actividades al aire libre. Durabilidad extrema.', 109.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36','38'], true),
('Pantalón Pinzas Lana', 'pantalon-pinzas-lana', 'Pantalón de lana con pinzas. Elegancia británica.', 139.99, NULL, NULL, 30, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['30','32','34','36','38'], true),
('Jean Bootcut Clásico', 'jean-bootcut-clasico', 'Vaquero bootcut para usar con botas. Silueta equilibrada.', 84.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36'], true),
('Pantalón Smart Casual', 'pantalon-smart-casual', 'Pantalón híbrido formal-casual. Versátil y moderno.', 89.99, 109.99, 18, 55, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['28','30','32','34','36','38'], true),
('Bermuda Chino Premium', 'bermuda-chino-premium', 'Bermuda de chino para el verano. Longitud perfecta sobre rodilla.', 64.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36'], true),
('Pantalón Cropped Moderno', 'pantalon-cropped-moderno', 'Pantalón tobillero de tendencia. Muestra tus zapatos.', 79.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36'], true),
('Jean Negro Skinny', 'jean-negro-skinny', 'Vaquero negro ultra ajustado. Estilo rockero.', 89.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'pantalones'), false, ARRAY['28','30','32','34','36'], true),
('Pantalón Pana Vintage', 'pantalon-pana-vintage', 'Pantalón de pana suave. Textura retro acogedora.', 94.99, 114.99, 17, 35, (SELECT id FROM categories WHERE slug = 'pantalones'), true, ARRAY['30','32','34','36','38'], true);

-- =============================================
-- 📦 PRODUCTOS: Trajes (41-50)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Traje Ejecutivo Azul Marino', 'traje-ejecutivo-azul-marino', 'Traje de dos piezas en lana italiana. El clásico reinventado para el hombre moderno.', 399.99, NULL, NULL, 20, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['46','48','50','52','54'], true),
('Traje Slim Fit Gris', 'traje-slim-fit-gris', 'Traje de corte ajustado en gris antracita. Sofisticación contemporánea.', 349.99, 429.99, 19, 25, (SELECT id FROM categories WHERE slug = 'trajes'), true, ARRAY['46','48','50','52','54'], true),
('Traje Negro Ceremonia', 'traje-negro-ceremonia', 'Traje negro de gala. Para las ocasiones más especiales.', 449.99, NULL, NULL, 15, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['46','48','50','52'], true),
('Traje Lino Blanco Verano', 'traje-lino-blanco-verano', 'Traje de lino blanco. Elegancia mediterránea estival.', 329.99, NULL, NULL, 20, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['46','48','50','52','54'], true),
('Traje Príncipe de Gales', 'traje-principe-gales', 'Traje con patrón Príncipe de Gales. Estilo británico auténtico.', 379.99, 459.99, 17, 18, (SELECT id FROM categories WHERE slug = 'trajes'), true, ARRAY['48','50','52','54'], true),
('Traje Cuadros Windowpane', 'traje-cuadros-windowpane', 'Traje con cuadros windowpane sutiles. Distinción sutil.', 369.99, NULL, NULL, 22, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['46','48','50','52','54'], true),
('Traje Espiga Marrón', 'traje-espiga-marron', 'Traje en tejido espiga marrón cálido. Para el otoño perfecto.', 389.99, NULL, NULL, 16, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['48','50','52','54'], true),
('Traje Cruzado Italiano', 'traje-cruzado-italiano', 'Traje de doble botonadura. Estilo italiano clásico.', 459.99, 549.99, 16, 12, (SELECT id FROM categories WHERE slug = 'trajes'), true, ARRAY['48','50','52','54'], true),
('Traje Casual Sin Forro', 'traje-casual-sin-forro', 'Traje desestructurado sin forro. Informal pero elegante.', 299.99, NULL, NULL, 28, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['46','48','50','52','54'], true),
('Traje Tres Piezas Clásico', 'traje-tres-piezas-clasico', 'Traje completo con chaleco. La cumbre de la elegancia.', 499.99, NULL, NULL, 14, (SELECT id FROM categories WHERE slug = 'trajes'), false, ARRAY['48','50','52','54'], true);

-- =============================================
-- 📦 PRODUCTOS: Chaquetas (51-65)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Blazer Azul Marino Clásico', 'blazer-azul-marino-clasico', 'Blazer de lana con botones dorados. El imprescindible atemporal.', 249.99, NULL, NULL, 30, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['46','48','50','52','54'], true),
('Chaqueta Bomber Premium', 'chaqueta-bomber-premium', 'Bomber de nylon con forro satinado. Estilo aviador moderno.', 189.99, 229.99, 17, 40, (SELECT id FROM categories WHERE slug = 'chaquetas'), true, ARRAY['S','M','L','XL','XXL'], true),
('Blazer Cuadros Sport', 'blazer-cuadros-sport', 'Blazer casual con patrón de cuadros. Para el fin de semana elegante.', 219.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['46','48','50','52','54'], true),
('Chaqueta Cuero Negra', 'chaqueta-cuero-negra', 'Chaqueta de cuero genuino. El icono del estilo rebelde.', 399.99, NULL, NULL, 20, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL'], true),
('Blazer Lino Natural', 'blazer-lino-natural', 'Blazer de lino para el verano. Elegancia sin esfuerzo.', 199.99, 249.99, 20, 45, (SELECT id FROM categories WHERE slug = 'chaquetas'), true, ARRAY['46','48','50','52','54'], true),
('Chaqueta Field Military', 'chaqueta-field-military', 'Chaqueta de campo estilo militar. Funcional y con carácter.', 179.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Blazer Terciopelo Burdeos', 'blazer-terciopelo-burdeos', 'Blazer de terciopelo para eventos. Lujo atrevido.', 279.99, NULL, NULL, 25, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['46','48','50','52'], true),
('Chaqueta Acolchada Ligera', 'chaqueta-acolchada-ligera', 'Chaqueta acolchada ultraligera. Calor sin peso.', 149.99, 189.99, 21, 55, (SELECT id FROM categories WHERE slug = 'chaquetas'), true, ARRAY['S','M','L','XL','XXL'], true),
('Blazer Punto Milano', 'blazer-punto-milano', 'Blazer de punto estructura. Comodidad con estilo.', 169.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL'], true),
('Chaqueta Harrington Clásica', 'chaqueta-harrington-clasica', 'Harrington con forro tartán. El British style por excelencia.', 159.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Gabardina Trench Beige', 'gabardina-trench-beige', 'Trench coat clásico impermeable. Elegancia lluviosa.', 299.99, 369.99, 19, 30, (SELECT id FROM categories WHERE slug = 'chaquetas'), true, ARRAY['S','M','L','XL'], true),
('Chaqueta Suede Camel', 'chaqueta-suede-camel', 'Chaqueta de ante en tono camel. Textura premium.', 349.99, NULL, NULL, 22, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL'], true),
('Parka Técnica Invierno', 'parka-tecnica-invierno', 'Parka impermeable con relleno térmico. Para el frío extremo.', 269.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL','XXL'], true),
('Blazer Pata de Gallo', 'blazer-pata-gallo', 'Blazer con patrón houndstooth. Clásico y distinguido.', 239.99, 289.99, 17, 28, (SELECT id FROM categories WHERE slug = 'chaquetas'), true, ARRAY['46','48','50','52','54'], true),
('Chaqueta Vaquera Raw', 'chaqueta-vaquera-raw', 'Chaqueta denim crudo sin tratar. El básico indispensable.', 129.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'chaquetas'), false, ARRAY['S','M','L','XL','XXL'], true);

-- =============================================
-- 📦 PRODUCTOS: Jerseys (66-80)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Jersey Cuello Redondo Lana', 'jersey-cuello-redondo-lana', 'Jersey de lana merino suave. El básico perfecto para capas.', 99.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Jersey Cuello Alto Cashmere', 'jersey-cuello-alto-cashmere', 'Jersey de cachemira pura. Lujo absoluto contra el frío.', 199.99, 259.99, 23, 30, (SELECT id FROM categories WHERE slug = 'jerseys'), true, ARRAY['S','M','L','XL'], true),
('Jersey Cuello Pico Algodón', 'jersey-cuello-pico-algodon', 'Jersey de algodón con cuello en V. Clásico sobre camisa.', 79.99, NULL, NULL, 65, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Jersey Trenzado Irlandés', 'jersey-trenzado-irlandes', 'Jersey con patrón cable knit tradicional. Artesanía tejida.', 139.99, NULL, NULL, 40, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL'], true),
('Jersey Cuello Cremallera', 'jersey-cuello-cremallera', 'Jersey con media cremallera. Versátil y moderno.', 89.99, 109.99, 18, 50, (SELECT id FROM categories WHERE slug = 'jerseys'), true, ARRAY['S','M','L','XL','XXL'], true),
('Jersey Rayas Marinero', 'jersey-rayas-marinero', 'Jersey con rayas horizontales estilo Bretón. El icono francés.', 84.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL'], true),
('Cárdigan Clásico Botones', 'cardigan-clasico-botones', 'Cárdigan de punto fino con botones. Elegancia relajada.', 109.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Jersey Térmico Técnico', 'jersey-termico-tecnico', 'Jersey con tecnología térmica. Calor activo para deportes.', 119.99, 149.99, 20, 40, (SELECT id FROM categories WHERE slug = 'jerseys'), true, ARRAY['S','M','L','XL'], true),
('Jersey Jacquard Nórdico', 'jersey-jacquard-nordico', 'Jersey con patrón jacquard escandinavo. Invierno con estilo.', 129.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Chaleco Punto Fino', 'chaleco-punto-fino', 'Chaleco de punto ligero. Capas sofisticadas.', 69.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL'], true),
('Jersey Oversize Urbano', 'jersey-oversize-urbano', 'Jersey de corte amplio streetwear. Comodidad con actitud.', 94.99, 119.99, 21, 50, (SELECT id FROM categories WHERE slug = 'jerseys'), true, ARRAY['S','M','L','XL'], true),
('Jersey Cuello Cisne', 'jersey-cuello-cisne', 'Jersey con cuello vuelto alto. Sofisticación invernal.', 89.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Sudadera Felpa Premium', 'sudadera-felpa-premium', 'Sudadera de felpa suave interior. Confort de alta gama.', 79.99, NULL, NULL, 70, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true),
('Jersey Degradado Moderno', 'jersey-degradado-moderno', 'Jersey con efecto degradado. Diseño contemporáneo.', 99.99, 124.99, 20, 40, (SELECT id FROM categories WHERE slug = 'jerseys'), true, ARRAY['S','M','L','XL'], true),
('Jersey Lino Ligero', 'jersey-lino-ligero', 'Jersey de lino para entretiempo. Frescura con elegancia.', 89.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'jerseys'), false, ARRAY['S','M','L','XL','XXL'], true);

-- =============================================
-- 📦 PRODUCTOS: Polos (81-90)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Polo Piqué Clásico', 'polo-pique-clasico', 'Polo de piqué de algodón. El básico que nunca falla.', 59.99, NULL, NULL, 80, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL','XXL'], true),
('Polo Manga Larga Premium', 'polo-manga-larga-premium', 'Polo de manga larga en algodón premium. Para días frescos.', 74.99, 89.99, 17, 55, (SELECT id FROM categories WHERE slug = 'polos'), true, ARRAY['S','M','L','XL'], true),
('Polo Slim Fit Stretch', 'polo-slim-fit-stretch', 'Polo ajustado con elastano. Silueta moderna.', 64.99, NULL, NULL, 70, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL'], true),
('Polo Técnico Sport', 'polo-tecnico-sport', 'Polo con tejido técnico transpirable. Para el hombre activo.', 69.99, NULL, NULL, 65, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL','XXL'], true),
('Polo Rayas Rugby', 'polo-rayas-rugby', 'Polo con rayas anchas estilo rugby. Carácter deportivo.', 79.99, 94.99, 16, 50, (SELECT id FROM categories WHERE slug = 'polos'), true, ARRAY['S','M','L','XL'], true),
('Polo Cuello Contraste', 'polo-cuello-contraste', 'Polo con cuello y puños en color contraste. Detalle distintivo.', 54.99, NULL, NULL, 75, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL','XXL'], true),
('Polo Lino Verano', 'polo-lino-verano', 'Polo de lino fresco. Elegancia estival.', 84.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL'], true),
('Polo Tejido Jacquard', 'polo-tejido-jacquard', 'Polo con textura jacquard sutil. Refinamiento discreto.', 74.99, 94.99, 21, 40, (SELECT id FROM categories WHERE slug = 'polos'), true, ARRAY['S','M','L','XL'], true),
('Polo Cuello Mao Sport', 'polo-cuello-mao-sport', 'Polo sin cuello tradicional. Minimalismo deportivo.', 59.99, NULL, NULL, 60, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL','XXL'], true),
('Polo Merino Fino', 'polo-merino-fino', 'Polo de lana merino extrafina. Lujo en cada detalle.', 109.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'polos'), false, ARRAY['S','M','L','XL'], true);

-- =============================================
-- 📦 PRODUCTOS: Zapatos y Accesorios (91-100)
-- =============================================

INSERT INTO products (name, slug, description, price, original_price, discount_percent, stock, category_id, is_offer, sizes, active) VALUES
('Zapato Oxford Negro', 'zapato-oxford-negro', 'Zapato Oxford de cuero pulido. La base del estilo formal.', 189.99, NULL, NULL, 35, (SELECT id FROM categories WHERE slug = 'zapatos'), false, ARRAY['40','41','42','43','44','45'], true),
('Mocasín Piel Marrón', 'mocasin-piel-marron', 'Mocasín de piel sin cordones. Comodidad elegante.', 169.99, 199.99, 15, 40, (SELECT id FROM categories WHERE slug = 'zapatos'), true, ARRAY['40','41','42','43','44','45'], true),
('Sneaker Cuero Blanco', 'sneaker-cuero-blanco', 'Zapatilla de cuero blanco premium. El casual elevado.', 149.99, NULL, NULL, 55, (SELECT id FROM categories WHERE slug = 'zapatos'), false, ARRAY['40','41','42','43','44','45'], true),
('Derby Ante Azul', 'derby-ante-azul', 'Zapato Derby en ante azul. Elegancia informal.', 179.99, NULL, NULL, 30, (SELECT id FROM categories WHERE slug = 'zapatos'), false, ARRAY['40','41','42','43','44'], true),
('Botín Chelsea Negro', 'botin-chelsea-negro', 'Botín Chelsea clásico de cuero. Versatilidad británica.', 199.99, 249.99, 20, 35, (SELECT id FROM categories WHERE slug = 'zapatos'), true, ARRAY['40','41','42','43','44','45'], true),
('Cinturón Cuero Premium', 'cinturon-cuero-premium', 'Cinturón de cuero con hebilla clásica. El detalle que importa.', 79.99, NULL, NULL, 70, (SELECT id FROM categories WHERE slug = 'accesorios'), false, ARRAY['85','90','95','100','105','110'], true),
('Corbata Seda Italiana', 'corbata-seda-italiana', 'Corbata de seda pura italiana. El toque final perfecto.', 89.99, NULL, NULL, 50, (SELECT id FROM categories WHERE slug = 'accesorios'), false, ARRAY['UNICA'], true),
('Pañuelo Bolsillo Lino', 'panuelo-bolsillo-lino', 'Pañuelo de bolsillo en lino. Elegancia sutil.', 34.99, 44.99, 22, 80, (SELECT id FROM categories WHERE slug = 'accesorios'), true, ARRAY['UNICA'], true),
('Gemelos Acero Premium', 'gemelos-acero-premium', 'Gemelos de acero pulido. Detalle de distinción.', 59.99, NULL, NULL, 45, (SELECT id FROM categories WHERE slug = 'accesorios'), false, ARRAY['UNICA'], true),
('Cartera Piel Minimalista', 'cartera-piel-minimalista', 'Cartera de piel con diseño slim. Lo esencial con estilo.', 99.99, 129.99, 23, 55, (SELECT id FROM categories WHERE slug = 'accesorios'), true, ARRAY['UNICA'], true);
