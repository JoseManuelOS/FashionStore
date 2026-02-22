export const prerender = false;
/**
 * API Endpoint: Check Pending Shipments
 * 
 * This endpoint checks for orders that are paid but not shipped
 * and sends a summary email to the admin.
 * 
 * Can be called manually or via cron job.
 * 
 * Usage: GET /api/admin/check-pending
 */

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendPendingShipmentsSummary } from '../../../lib/admin-notifications';
import { isAdminAuthenticated, unauthorizedResponse } from '../../../lib/admin-auth';

export const GET: APIRoute = async ({ request }) => {
    if (!isAdminAuthenticated(request)) {
        return unauthorizedResponse();
    }

    try {
        // Get orders that are paid but not shipped (older than 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: pendingOrders, error } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, customer_name, customer_email, total_price, created_at')
            .eq('status', 'paid')
            .lt('created_at', twentyFourHoursAgo.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching pending orders:', error);
            return new Response(
                JSON.stringify({ error: 'Error fetching pending orders' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!pendingOrders || pendingOrders.length === 0) {
            return new Response(
                JSON.stringify({
                    message: 'No pending orders found',
                    count: 0
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Send admin notification
        await sendPendingShipmentsSummary(pendingOrders);

        return new Response(
            JSON.stringify({
                success: true,
                message: `Found ${pendingOrders.length} pending order(s). Admin notification sent.`,
                count: pendingOrders.length,
                orders: pendingOrders.map(o => ({
                    order_number: o.order_number,
                    customer_name: o.customer_name,
                    created_at: o.created_at
                }))
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in check-pending API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
