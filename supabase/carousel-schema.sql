-- =============================================
-- CAROUSEL SLIDES SCHEMA
-- =============================================
-- Tabla para gestionar las slides del carrusel del homepage

CREATE TABLE IF NOT EXISTS carousel_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    cta_text VARCHAR(100) DEFAULT 'Ver más',
    cta_link VARCHAR(255) DEFAULT '/productos',
    duration INTEGER DEFAULT 5000, -- Duración en milisegundos
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenar las slides
CREATE INDEX IF NOT EXISTS idx_carousel_slides_order ON carousel_slides(sort_order, is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_carousel_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER trigger_carousel_slides_updated_at
    BEFORE UPDATE ON carousel_slides
    FOR EACH ROW
    EXECUTE FUNCTION update_carousel_slides_updated_at();

-- Políticas RLS
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar en el homepage)
CREATE POLICY "Carousel slides are viewable by everyone"
    ON carousel_slides FOR SELECT
    USING (true);

-- Solo admins pueden modificar (insert, update, delete)
CREATE POLICY "Only admins can insert carousel slides"
    ON carousel_slides FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can update carousel slides"
    ON carousel_slides FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can delete carousel slides"
    ON carousel_slides FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================
-- DATOS INICIALES DEL CARRUSEL
-- =============================================

INSERT INTO carousel_slides (title, subtitle, description, image_url, cta_text, cta_link, duration, sort_order, is_active) VALUES
(
    'Nueva Colección',
    'Primavera 2026',
    'Descubre las últimas tendencias en moda masculina',
    'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1920&q=80',
    'Explorar',
    '/productos',
    5000,
    1,
    true
),
(
    'Estilo Premium',
    'Elegancia Definida',
    'Prendas de alta calidad para el hombre moderno',
    'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=1920&q=80',
    'Ver colección',
    '/categoria/camisas',
    5000,
    2,
    true
),
(
    'Ofertas Especiales',
    'Hasta 40% Off',
    'Aprovecha nuestros descuentos exclusivos',
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1920&q=80',
    'Comprar ahora',
    '/ofertas',
    5000,
    3,
    true
);

-- Verificar que se creó correctamente
SELECT * FROM carousel_slides ORDER BY sort_order;
