import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'No authorization token' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a client with the user's token to get their info
        const supabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        // Get user from token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user?.email) {
            return new Response(
                JSON.stringify({ error: 'Invalid token or user not found' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const userEmail = user.email;

        // Get customer ID from customers table
        const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('email', userEmail)
            .single();

        if (!customer) {
            return new Response(
                JSON.stringify({ orders: [] }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get orders by customer_id
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                items:order_items(
                    id,
                    product_id,
                    product_name,
                    product_image,
                    quantity,
                    size,
                    price_at_purchase
                )
            `)
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return new Response(
                JSON.stringify({ error: 'Error fetching orders', details: ordersError.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ orders: orders || [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in my-orders API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
