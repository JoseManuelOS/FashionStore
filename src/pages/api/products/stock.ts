export const prerender = false;
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
    try {
        const productId = url.searchParams.get('productId');
        const color = url.searchParams.get('color'); // Optional color filter

        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'productId es requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Obtener stock por talla (y color) desde product_variants
        let query = supabase
            .from('product_variants')
            .select('size, stock, color')
            .eq('product_id', productId);

        // If color is specified, filter by color
        if (color !== null && color !== undefined) {
            query = query.eq('color', color);
        }

        const { data: stockData, error } = await query;

        if (error) {
            console.error('Error obteniendo stock:', error);
            return new Response(
                JSON.stringify({ error: 'Error obteniendo stock' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Convertir a objeto { talla: cantidad }
        // If no color filter, aggregate stock across all colors for each size
        const stockBySize: Record<string, number> = {};
        // Also build full stock map: { "size|color": stock }
        const stockBySizeColor: Record<string, number> = {};

        for (const item of stockData || []) {
            stockBySize[item.size] = (stockBySize[item.size] || 0) + item.stock;
            const key = item.color ? `${item.size}|${item.color}` : item.size;
            stockBySizeColor[key] = item.stock;
        }

        // Calcular total
        const totalStock = Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);

        return new Response(
            JSON.stringify({
                productId,
                stockBySize,
                stockBySizeColor,
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
