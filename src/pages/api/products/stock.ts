import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
    try {
        const productId = url.searchParams.get('productId');

        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'productId es requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Obtener stock por talla
        const { data: stockData, error } = await supabase
            .from('product_stock')
            .select('size, quantity')
            .eq('product_id', productId);

        if (error) {
            console.error('Error obteniendo stock:', error);
            return new Response(
                JSON.stringify({ error: 'Error obteniendo stock' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Convertir a objeto { talla: cantidad }
        const stockBySize: Record<string, number> = {};
        for (const item of stockData || []) {
            stockBySize[item.size] = item.quantity;
        }

        // Calcular total
        const totalStock = Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);

        return new Response(
            JSON.stringify({
                productId,
                stockBySize,
                totalStock
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
