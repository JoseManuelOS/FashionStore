import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { code, customerEmail } = body;

        if (!code) {
            return new Response(
                JSON.stringify({ valid: false, error: 'Código requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Buscar el código en la base de datos
        const { data: discountCode, error } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('active', true)
            .single();

        if (error || !discountCode) {
            return new Response(
                JSON.stringify({ valid: false, error: 'Código no válido' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verificar si ha expirado
        if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ valid: false, error: 'Este código ha expirado' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verificar si aún no comienza
        if (discountCode.starts_at && new Date(discountCode.starts_at) > new Date()) {
            return new Response(
                JSON.stringify({ valid: false, error: 'Este código aún no está activo' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verificar límite de uso global
        if (discountCode.usage_limit && discountCode.times_used >= discountCode.usage_limit) {
            return new Response(
                JSON.stringify({ valid: false, error: 'Este código ha alcanzado su límite de uso' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verificar uso único por cliente
        if (discountCode.single_use_per_customer && customerEmail) {
            const { data: usage } = await supabase
                .from('discount_code_usage')
                .select('id')
                .eq('discount_code_id', discountCode.id)
                .eq('customer_email', customerEmail.toLowerCase())
                .single();

            if (usage) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Ya has usado este código anteriormente' }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Código válido
        return new Response(
            JSON.stringify({
                valid: true,
                discount: {
                    id: discountCode.id,
                    code: discountCode.code,
                    type: discountCode.discount_type,
                    value: parseFloat(discountCode.discount_value),
                    description: discountCode.description,
                    minPurchase: parseFloat(discountCode.min_purchase || 0),
                    maxDiscount: discountCode.max_discount ? parseFloat(discountCode.max_discount) : null
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error validating discount code:', error);
        return new Response(
            JSON.stringify({ valid: false, error: 'Error al validar el código' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
