export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
    try {
        const q = url.searchParams.get('q')?.trim() || '';

        if (q.length < 2) {
            return new Response(
                JSON.stringify({ results: [] }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // ILIKE search: case-insensitive partial match on name, category name, or tags
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                original_price,
                is_offer,
                active,
                images:product_images(image_url, order),
                category:categories(name, slug)
            `)
            .eq('active', true)
            .ilike('name', `%${q}%`)
            .order('name')
            .limit(8);

        if (error) {
            console.error('Search error:', error);
            return new Response(
                JSON.stringify({ error: 'Error en la búsqueda' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Also search by category name if we got few results from name search
        let results = data || [];
        if (results.length < 5) {
            const { data: catResults } = await supabaseAdmin
                .from('products')
                .select(`
                    id,
                    name,
                    slug,
                    price,
                    original_price,
                    is_offer,
                    active,
                    images:product_images(image_url, order),
                    category:categories!inner(name, slug)
                `)
                .eq('active', true)
                .ilike('categories.name', `%${q}%`)
                .order('name')
                .limit(8 - results.length);

            if (catResults) {
                const existingIds = new Set(results.map(r => r.id));
                const unique = catResults.filter(r => !existingIds.has(r.id));
                results = [...results, ...unique];
            }
        }

        // Format results
        const formatted = results.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            originalPrice: p.original_price,
            isOffer: p.is_offer,
            image: p.images?.sort((a: any, b: any) => a.order - b.order)?.[0]?.image_url || null,
            category: p.category?.name || null,
            categorySlug: p.category?.slug || null,
        }));

        return new Response(
            JSON.stringify({ results: formatted, query: q }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=30, s-maxage=60',
                },
            }
        );
    } catch (err) {
        console.error('Search API error:', err);
        return new Response(
            JSON.stringify({ error: 'Error interno' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
