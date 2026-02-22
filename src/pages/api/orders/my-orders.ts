export const prerender = false;
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

        // Query orders by customer_id OR by customer_email (for guest orders placed before registration)
        let query = supabaseAdmin
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
            `);

        if (customer) {
            // Match by customer_id OR email (covers both linked and unlinked orders)
            query = query.or(`customer_id.eq.${customer.id},customer_email.eq.${userEmail}`);
        } else {
            // No customer record yet — match solely by email
            query = query.eq('customer_email', userEmail);
        }

        const { data: orders, error: ordersError } = await query
            .order('created_at', { ascending: false });

        // Backfill: link any orphan orders (customer_email matches but customer_id is null)
        if (customer && orders && orders.length > 0) {
            const orphanIds = orders
                .filter((o: any) => !o.customer_id && o.customer_email === userEmail)
                .map((o: any) => o.id);

            if (orphanIds.length > 0) {
                await supabaseAdmin
                    .from('orders')
                    .update({ customer_id: customer.id })
                    .in('id', orphanIds);
            }
        }

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
