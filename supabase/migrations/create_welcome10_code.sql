-- =============================================
-- Crear código promocional WELCOME10 para newsletter
-- =============================================

INSERT INTO discount_codes (
    code,
    description,
    discount_type,
    discount_value,
    min_purchase,
    usage_limit,
    single_use_per_customer,
    active
) VALUES (
    'WELCOME10',
    'Descuento de bienvenida newsletter - 10%',
    'percentage',
    10,
    0,
    NULL, -- Sin límite de usos totales
    true, -- Solo 1 uso por cliente
    true
) ON CONFLICT (code) DO NOTHING;

-- Verificar que se creó
SELECT * FROM discount_codes WHERE code = 'WELCOME10';
