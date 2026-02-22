/**
 * Dashboard Queries - KPIs y datos de ventas para el panel de administración
 * Todas las agregaciones se ejecutan a nivel SQL mediante funciones RPC
 * para rendimiento óptimo y evitar traer filas innecesarias al servidor.
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
 * Ventas del mes actual — SUM(total_price) calculado en SQL
 */
export async function getMonthlySales(): Promise<number> {
    const { data, error } = await supabaseAdmin.rpc('get_monthly_sales');

    if (error) {
        console.error('Error fetching monthly sales:', error);
        return 0;
    }

    return Number(data) || 0;
}

/**
 * Pedidos pendientes — COUNT via head request (ya óptimo)
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
 * Producto más vendido — GROUP BY + SUM en SQL
 */
export async function getTopProduct(): Promise<{ name: string; quantity: number } | null> {
    const { data, error } = await supabaseAdmin.rpc('get_top_product');

    if (error) {
        console.error('Error fetching top product:', error);
        return null;
    }

    if (!data || data.length === 0) return null;

    return { name: data[0].name, quantity: Number(data[0].quantity) };
}

/**
 * Ventas últimos 7 días — generate_series + LEFT JOIN + SUM en SQL
 */
export async function getLast7DaysSales(): Promise<DailySales[]> {
    const { data, error } = await supabaseAdmin.rpc('get_last_7_days_sales');

    if (error) {
        console.error('Error fetching last 7 days sales:', error);
        return [];
    }

    return (data || []).map((row: { date: string; total: number }) => ({
        date: row.date,
        total: Number(row.total)
    }));
}

/**
 * Estadísticas completas del dashboard en una sola llamada
 * Todas las agregaciones pesadas se delegan a funciones SQL (RPC)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const [monthlySales, pendingOrders, topProduct, lowStockResult, productsCount] = await Promise.all([
        getMonthlySales(),
        getPendingOrdersCount(),
        getTopProduct(),
        supabaseAdmin.rpc('get_low_stock_count'),
        supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('active', true)
    ]);

    return {
        monthlySales,
        pendingOrders,
        topProduct,
        totalProducts: productsCount.count || 0,
        lowStockCount: Number(lowStockResult.data) || 0
    };
}
