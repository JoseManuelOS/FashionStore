/**
 * Dashboard Queries - Functions to get KPIs and sales data for admin dashboard
 */

import { supabaseAdmin } from './supabase';

export interface DashboardStats {
    monthlySales: number;
    pendingOrders: number;
    topProduct: { name: string; quantity: number } | null;
    totalProducts: number;
    lowStockCount: number;
}

export interface DailySales {
    date: string;
    total: number;
}

/**
 * Get monthly sales total (orders in paid, shipped, delivered status)
 */
export async function getMonthlySales(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('total_price')
        .in('status', ['paid', 'shipped', 'delivered'])
        .gte('created_at', startOfMonth.toISOString());

    if (error) {
        console.error('Error fetching monthly sales:', error);
        return 0;
    }

    return data?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
}

/**
 * Get pending orders count
 */
export async function getPendingOrdersCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

    if (error) {
        console.error('Error fetching pending orders:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Get the best-selling product
 */
export async function getTopProduct(): Promise<{ name: string; quantity: number } | null> {
    const { data: orderItems, error } = await supabaseAdmin
        .from('order_items')
        .select(`
            product_name,
            quantity,
            order:orders!inner(status)
        `)
        .in('orders.status', ['paid', 'shipped', 'delivered']);

    if (error) {
        console.error('Error fetching top product:', error);
        return null;
    }

    if (!orderItems || orderItems.length === 0) return null;

    // Aggregate by product name
    const productSales: Record<string, number> = {};
    for (const item of orderItems) {
        const name = item.product_name;
        productSales[name] = (productSales[name] || 0) + (item.quantity || 0);
    }

    // Find top product
    let topName = '';
    let topQty = 0;
    for (const [name, qty] of Object.entries(productSales)) {
        if (qty > topQty) {
            topName = name;
            topQty = qty;
        }
    }

    return topName ? { name: topName, quantity: topQty } : null;
}

/**
 * Get sales for the last 7 days
 */
export async function getLast7DaysSales(): Promise<DailySales[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('created_at, total_price')
        .in('status', ['paid', 'shipped', 'delivered'])
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching last 7 days sales:', error);
        return [];
    }

    // Aggregate by date
    const salesByDate: Record<string, number> = {};

    // Initialize all 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesByDate[dateStr] = 0;
    }

    // Sum up sales per day
    for (const order of data || []) {
        const dateStr = new Date(order.created_at).toISOString().split('T')[0];
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (order.total_price || 0);
    }

    // Convert to array
    return Object.entries(salesByDate)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get all dashboard stats in one call
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const [monthlySales, pendingOrders, topProduct] = await Promise.all([
        getMonthlySales(),
        getPendingOrdersCount(),
        getTopProduct()
    ]);

    // Get product stats using product_variants for accurate per-size stock
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('active', true);

    const totalProducts = products?.length || 0;

    // Count products that have at least one variant with stock between 1-5 or stock = 0
    const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('product_id, stock')
        .in('product_id', (products || []).map(p => p.id));

    // A product has "low stock" if any of its variants has stock <= 5 (including 0 = out of stock)
    const productsWithLowStock = new Set<string>();
    for (const v of variants || []) {
        if (v.stock <= 5) {
            productsWithLowStock.add(v.product_id);
        }
    }
    const lowStockCount = productsWithLowStock.size;

    return {
        monthlySales,
        pendingOrders,
        topProduct,
        totalProducts,
        lowStockCount
    };
}
