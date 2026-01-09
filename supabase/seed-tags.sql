-- =============================================
-- 🏷️ SEED DATA: Tags y Filtros
-- Ejecutar después de seed-products.sql
-- =============================================

-- Limpiar tags existentes
DELETE FROM product_tags;
DELETE FROM tags;

-- =============================================
-- 🏷️ TAGS: Por tipo de prenda
-- =============================================
INSERT INTO tags (name, slug, type) VALUES
-- Camisas
('Manga Corta', 'manga-corta', 'estilo'),
('Manga Larga', 'manga-larga', 'estilo'),
('Slim Fit', 'slim-fit', 'corte'),
('Regular Fit', 'regular-fit', 'corte'),
('Casual', 'casual', 'ocasion'),
('Formal', 'formal', 'ocasion'),
('Lino', 'lino', 'material'),

-- Pantalones
('Chinos', 'chinos', 'tipo'),
('Vaqueros', 'vaqueros', 'tipo'),
('Cargo', 'cargo', 'tipo'),
('Cortos', 'cortos', 'tipo'),

-- Trajes
('Clásico', 'clasico', 'estilo'),
('Blazer', 'blazer', 'tipo'),
('Completo', 'completo', 'tipo'),

-- Temporada
('Verano', 'verano', 'temporada'),
('Invierno', 'invierno', 'temporada'),
('Primavera', 'primavera', 'temporada'),
('Otoño', 'otono', 'temporada'),

-- Destacado
('Ofertas Flash', 'ofertas-flash', 'destacado'),
('Novedades', 'novedades', 'destacado'),
('Best Seller', 'best-seller', 'destacado'),
('Premium', 'premium', 'destacado');

-- =============================================
-- 🔗 ASIGNAR TAGS A PRODUCTOS
-- =============================================

-- CAMISAS - Tags por tipo
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-oxford-clasica' AND t.slug IN ('manga-larga', 'formal', 'clasico', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-lino-verano' AND t.slug IN ('manga-larga', 'lino', 'casual', 'verano', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-formal-ejecutiva' AND t.slug IN ('manga-larga', 'formal', 'premium', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-denim-casual' AND t.slug IN ('manga-larga', 'casual', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-cuadros-flannel' AND t.slug IN ('manga-larga', 'casual', 'invierno', 'otono', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-slim-fit-stretch' AND t.slug IN ('manga-larga', 'slim-fit', 'formal', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-hawaiana-tropical' AND t.slug IN ('manga-corta', 'casual', 'verano', 'novedades');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-popelin-premium' AND t.slug IN ('manga-larga', 'formal', 'premium', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-manga-corta-casual' AND t.slug IN ('manga-corta', 'casual', 'verano', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-estampado-geometrico' AND t.slug IN ('manga-larga', 'casual', 'novedades', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-cuello-mao' AND t.slug IN ('manga-larga', 'casual', 'verano', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-sport-tecnica' AND t.slug IN ('manga-larga', 'casual', 'verano', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-rayas-verticales' AND t.slug IN ('manga-larga', 'formal', 'clasico', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-twill-algodon' AND t.slug IN ('manga-larga', 'casual', 'otono', 'invierno');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-chambray-ligera' AND t.slug IN ('manga-larga', 'casual', 'verano', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-doble-puno' AND t.slug IN ('manga-larga', 'formal', 'premium', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-lino-cuello-italiano' AND t.slug IN ('manga-larga', 'lino', 'casual', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-microprint' AND t.slug IN ('manga-larga', 'formal', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-punto-tricot' AND t.slug IN ('manga-larga', 'casual', 'invierno', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'camisa-oversize-urbana' AND t.slug IN ('manga-larga', 'casual', 'novedades', 'ofertas-flash');

-- PANTALONES - Tags por tipo
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-chino-clasico' AND t.slug IN ('chinos', 'regular-fit', 'casual', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-vestir-italiano' AND t.slug IN ('formal', 'premium', 'clasico', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-slim-fit-premium' AND t.slug IN ('vaqueros', 'slim-fit', 'casual', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-cargo-moderno' AND t.slug IN ('cargo', 'casual', 'novedades', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-lino-verano' AND t.slug IN ('lino', 'casual', 'verano', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-regular-comfort' AND t.slug IN ('vaqueros', 'regular-fit', 'casual', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-jogger-elegante' AND t.slug IN ('casual', 'novedades', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-plisado-formal' AND t.slug IN ('formal', 'clasico', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-straight-vintage' AND t.slug IN ('vaqueros', 'regular-fit', 'casual', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-chino-slim' AND t.slug IN ('chinos', 'slim-fit', 'casual', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-tecnico-golf' AND t.slug IN ('casual', 'premium', 'verano', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-tapered-selvedge' AND t.slug IN ('vaqueros', 'slim-fit', 'premium', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-cordura-outdoor' AND t.slug IN ('cargo', 'casual', 'invierno', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-pinzas-lana' AND t.slug IN ('formal', 'clasico', 'invierno', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-bootcut-clasico' AND t.slug IN ('vaqueros', 'regular-fit', 'casual', 'clasico');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-smart-casual' AND t.slug IN ('chinos', 'slim-fit', 'casual', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'bermuda-chino-premium' AND t.slug IN ('chinos', 'cortos', 'casual', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-cropped-moderno' AND t.slug IN ('slim-fit', 'casual', 'novedades', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jean-negro-skinny' AND t.slug IN ('vaqueros', 'slim-fit', 'casual', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'pantalon-pana-vintage' AND t.slug IN ('casual', 'clasico', 'invierno', 'ofertas-flash');

-- TRAJES - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-ejecutivo-azul-marino' AND t.slug IN ('completo', 'formal', 'clasico', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-slim-fit-gris' AND t.slug IN ('completo', 'slim-fit', 'formal', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-negro-ceremonia' AND t.slug IN ('completo', 'formal', 'premium', 'clasico');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-lino-blanco-verano' AND t.slug IN ('completo', 'lino', 'casual', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-principe-gales' AND t.slug IN ('completo', 'formal', 'clasico', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-cuadros-windowpane' AND t.slug IN ('completo', 'formal', 'novedades', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-espiga-marron' AND t.slug IN ('completo', 'formal', 'clasico', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-cruzado-italiano' AND t.slug IN ('completo', 'formal', 'premium', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-casual-sin-forro' AND t.slug IN ('blazer', 'casual', 'verano', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'traje-tres-piezas-clasico' AND t.slug IN ('completo', 'formal', 'premium', 'clasico');

-- CHAQUETAS - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-azul-marino-clasico' AND t.slug IN ('blazer', 'formal', 'clasico', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-bomber-premium' AND t.slug IN ('casual', 'novedades', 'primavera', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-cuadros-sport' AND t.slug IN ('blazer', 'casual', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-cuero-negra' AND t.slug IN ('casual', 'premium', 'invierno', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-lino-natural' AND t.slug IN ('blazer', 'lino', 'casual', 'verano', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-field-military' AND t.slug IN ('casual', 'novedades', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-terciopelo-burdeos' AND t.slug IN ('blazer', 'formal', 'premium', 'invierno');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-acolchada-ligera' AND t.slug IN ('casual', 'primavera', 'otono', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-punto-milano' AND t.slug IN ('blazer', 'casual', 'novedades', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-harrington-clasica' AND t.slug IN ('casual', 'clasico', 'primavera', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'gabardina-trench-beige' AND t.slug IN ('formal', 'clasico', 'primavera', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-suede-camel' AND t.slug IN ('casual', 'premium', 'otono', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'parka-tecnica-invierno' AND t.slug IN ('casual', 'invierno', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'blazer-pata-gallo' AND t.slug IN ('blazer', 'formal', 'clasico', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaqueta-vaquera-raw' AND t.slug IN ('casual', 'novedades', 'primavera', 'best-seller');

-- JERSEYS - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-cuello-redondo-lana' AND t.slug IN ('casual', 'clasico', 'invierno', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-cuello-alto-cashmere' AND t.slug IN ('casual', 'premium', 'invierno', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-cuello-pico-algodon' AND t.slug IN ('casual', 'clasico', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-trenzado-irlandes' AND t.slug IN ('casual', 'clasico', 'invierno', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-cuello-cremallera' AND t.slug IN ('casual', 'novedades', 'otono', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-rayas-marinero' AND t.slug IN ('casual', 'clasico', 'primavera', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'cardigan-clasico-botones' AND t.slug IN ('casual', 'clasico', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-termico-tecnico' AND t.slug IN ('casual', 'novedades', 'invierno', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-jacquard-nordico' AND t.slug IN ('casual', 'clasico', 'invierno');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'chaleco-punto-fino' AND t.slug IN ('casual', 'formal', 'primavera', 'otono');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-oversize-urbano' AND t.slug IN ('casual', 'novedades', 'otono', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-cuello-cisne' AND t.slug IN ('casual', 'clasico', 'invierno', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'sudadera-felpa-premium' AND t.slug IN ('casual', 'novedades', 'invierno', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-degradado-moderno' AND t.slug IN ('casual', 'novedades', 'otono', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'jersey-lino-ligero' AND t.slug IN ('lino', 'casual', 'verano', 'primavera');

-- POLOS - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-pique-clasico' AND t.slug IN ('manga-corta', 'casual', 'clasico', 'best-seller', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-manga-larga-premium' AND t.slug IN ('manga-larga', 'casual', 'premium', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-slim-fit-stretch' AND t.slug IN ('manga-corta', 'slim-fit', 'casual', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-tecnico-sport' AND t.slug IN ('manga-corta', 'casual', 'novedades', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-rayas-rugby' AND t.slug IN ('manga-larga', 'casual', 'clasico', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-cuello-contraste' AND t.slug IN ('manga-corta', 'casual', 'novedades', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-lino-verano' AND t.slug IN ('manga-corta', 'lino', 'casual', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-tejido-jacquard' AND t.slug IN ('manga-corta', 'casual', 'premium', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-cuello-mao-sport' AND t.slug IN ('manga-corta', 'casual', 'novedades', 'verano');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'polo-merino-fino' AND t.slug IN ('manga-corta', 'casual', 'premium', 'primavera');

-- ZAPATOS - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'zapato-oxford-negro' AND t.slug IN ('formal', 'clasico', 'premium');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'mocasin-piel-marron' AND t.slug IN ('casual', 'clasico', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'sneaker-cuero-blanco' AND t.slug IN ('casual', 'novedades', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'derby-ante-azul' AND t.slug IN ('casual', 'novedades', 'primavera');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'botin-chelsea-negro' AND t.slug IN ('casual', 'clasico', 'invierno', 'ofertas-flash');

-- ACCESORIOS - Tags
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'cinturon-cuero-premium' AND t.slug IN ('formal', 'casual', 'clasico', 'best-seller');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'corbata-seda-italiana' AND t.slug IN ('formal', 'premium', 'clasico');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'panuelo-bolsillo-lino' AND t.slug IN ('formal', 'lino', 'ofertas-flash');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'gemelos-acero-premium' AND t.slug IN ('formal', 'premium', 'novedades');

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t 
WHERE p.slug = 'cartera-piel-minimalista' AND t.slug IN ('casual', 'novedades', 'ofertas-flash');
