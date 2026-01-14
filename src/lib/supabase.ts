import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client - for SSG pages and client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - for SSR admin operations (server-side only!)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// =============================================
// TYPES
// =============================================

export interface Category {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    order: number;
    color?: string;
    color_hex?: string;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number; // Stock global (legacy, para compatibilidad)
    category_id: string | null;
    is_offer: boolean;
    sizes: string[];
    active: boolean;
    original_price?: number;
    discount_percent?: number;
    created_at: string;
    // Joined data
    category?: Category;
    images?: ProductImage[];
    main_image?: string; // From view
    // Stock por talla
    stock_by_size?: Record<string, number>;
}

export interface ProductStock {
    id: string;
    product_id: string;
    size: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    total_price: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    customer_email: string | null;
    customer_name: string | null;
    shipping_address: string | null;
    // Campos de Stripe
    stripe_session_id?: string | null;
    stripe_payment_intent?: string | null;
    // Campos de envío
    shipping_carrier?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
    // Timestamps
    created_at: string;
    updated_at: string;
    // Joined
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    product_image?: string | null;
    quantity: number;
    size: string | null;
    price_at_purchase: number;
    created_at: string;
}

export interface Setting {
    key: string;
    value: any;
    description: string | null;
    updated_at: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

// =============================================
// CATEGORIES
// =============================================

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
}

// =============================================
// PRODUCTS
// =============================================

export async function getProducts(options?: {
    categorySlug?: string;
    isOffer?: boolean;
    limit?: number;
}): Promise<Product[]> {
    let query = supabase
        .from('products')
        .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (options?.categorySlug) {
        const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', options.categorySlug)
            .single();

        if (category) {
            query = query.eq('category_id', category.id);
        }
    }

    if (options?.isOffer) {
        query = query.eq('is_offer', true);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Sort images by order for each product
    return (data || []).map(product => ({
        ...product,
        images: (product.images || []).sort((a: ProductImage, b: ProductImage) => a.order - b.order)
    }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
        .eq('slug', slug)
        .eq('active', true)
        .single();

    if (error) return null;

    // Sort images by order
    return {
        ...data,
        images: (data.images || []).sort((a: ProductImage, b: ProductImage) => a.order - b.order)
    };
}

/**
 * Get main image URL for a product
 */
export function getProductMainImage(product: Product): string {
    if (product.images && product.images.length > 0) {
        return product.images[0].image_url;
    }
    return 'https://placehold.co/800x1000/1e3a5f/ffffff?text=Producto';
}

// =============================================
// PRODUCT IMAGES
// =============================================

export async function addProductImage(productId: string, imageUrl: string, order: number = 0) {
    const { data, error } = await supabaseAdmin
        .from('product_images')
        .insert({ product_id: productId, image_url: imageUrl, order })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProductImage(imageId: string) {
    const { error } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('id', imageId);

    if (error) throw error;
}

export async function updateProductImageOrder(imageId: string, order: number) {
    const { error } = await supabaseAdmin
        .from('product_images')
        .update({ order })
        .eq('id', imageId);

    if (error) throw error;
}

// =============================================
// ORDERS
// =============================================

export async function createOrder(orderData: {
    total_price: number;
    customer_email?: string;
    customer_name?: string;
    shipping_address?: string;
    items: {
        product_id: string;
        product_name: string;
        quantity: number;
        size?: string;
        price_at_purchase: number;
    }[];
}): Promise<Order> {
    // Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            total_price: orderData.total_price,
            customer_email: orderData.customer_email,
            customer_name: orderData.customer_name,
            shipping_address: orderData.shipping_address,
            status: 'pending'
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price_at_purchase: item.price_at_purchase
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
}

export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
      *,
      items:order_items(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

    if (error) return null;
    return data;
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    const updateData: any = { status };
    
    // Si se marca como entregado, guardar la fecha
    if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
    }
    
    const { error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) throw error;
}

export async function updateOrderShipping(orderId: string, shippingData: {
    shipping_carrier?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    markAsShipped?: boolean;
}) {
    const updateData: any = {
        shipping_carrier: shippingData.shipping_carrier,
        tracking_number: shippingData.tracking_number,
        tracking_url: shippingData.tracking_url
    };

    // Si se marca como enviado, actualizar estado y fecha
    if (shippingData.markAsShipped) {
        updateData.status = 'shipped';
        updateData.shipped_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) throw error;

    // Si se marcó como enviado, enviar email de notificación
    if (shippingData.markAsShipped && shippingData.tracking_number) {
        const order = await getOrderById(orderId);
        if (order?.customer_email) {
            await sendShippingNotificationEmail(order);
        }
    }
}

async function sendShippingNotificationEmail(order: Order) {
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(import.meta.env.RESEND_API_KEY);

        const carrierNames: Record<string, string> = {
            seur: 'SEUR',
            mrw: 'MRW',
            correos: 'Correos',
            gls: 'GLS',
            ups: 'UPS',
            dhl: 'DHL',
            envialia: 'Envialia',
            nacex: 'Nacex',
            fedex: 'FedEx',
            otro: 'Transportista'
        };

        const carrierName = carrierNames[order.shipping_carrier || ''] || 'Transportista';

        await resend.emails.send({
            from: 'FashionMarket <onboarding@resend.dev>',
            to: [order.customer_email!],
            subject: '📦 ¡Tu pedido está en camino! - FashionMarket',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
                    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); padding: 40px 20px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 15px;">📦</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Tu pedido está en camino!</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Pedido #${order.id.slice(0, 8)}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${order.customer_name || 'Cliente'}</strong>,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 30px;">
                                ¡Buenas noticias! Tu pedido ha sido enviado y está en camino.
                            </p>
                            
                            <!-- Tracking Info -->
                            <div style="background-color: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                                <h2 style="font-size: 18px; color: #6b21a8; margin: 0 0 15px 0;">Información de Seguimiento</h2>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #7c3aed; font-weight: 600;">Transportista:</span>
                                    <span style="color: #374151; margin-left: 8px;">${carrierName}</span>
                                </div>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #7c3aed; font-weight: 600;">Código de seguimiento:</span>
                                    <span style="color: #374151; margin-left: 8px; font-family: monospace; background: #e9d5ff; padding: 2px 8px; border-radius: 4px;">${order.tracking_number}</span>
                                </div>
                                
                                ${order.tracking_url ? `
                                    <a href="${order.tracking_url}" 
                                       style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        🔍 Rastrear mi pedido
                                    </a>
                                ` : ''}
                            </div>
                            
                            <!-- Status -->
                            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h3 style="font-size: 16px; color: #065f46; margin: 0 0 15px 0;">📋 Estado del Pedido</h3>
                                <div style="margin-left: 10px;">
                                    <div style="margin-bottom: 10px;">
                                        <span style="display: inline-block; width: 14px; height: 14px; background-color: #10b981; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                        <span style="color: #065f46; font-weight: 600;">Pedido confirmado</span>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="display: inline-block; width: 14px; height: 14px; background-color: #10b981; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                        <span style="color: #065f46; font-weight: 600;">Preparado y enviado</span>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="display: inline-block; width: 14px; height: 14px; background-color: #8b5cf6; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                        <span style="color: #7c3aed; font-weight: 600;">En reparto</span>
                                    </div>
                                    <div style="opacity: 0.6;">
                                        <span style="display: inline-block; width: 14px; height: 14px; background-color: #d1d5db; border-radius: 50%; margin-right: 10px; vertical-align: middle;"></span>
                                        <span style="color: #6b7280;">Entregado</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Delivery Estimate -->
                            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                                    <span style="font-size: 20px;">🚚</span>
                                    <strong style="color: #1e40af; font-size: 16px;">Entrega Estimada</strong>
                                </div>
                                <p style="margin: 0 0 0 32px; color: #1e40af; font-size: 14px;">
                                    Tu pedido llegará en <strong>2-5 días laborables</strong>
                                </p>
                            </div>

                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                Si tienes alguna pregunta sobre tu envío, no dudes en contactarnos.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #1f2937; padding: 30px; text-align: center;">
                            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                © 2026 FashionMarket. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Shipping notification email sent to:', order.customer_email);
    } catch (error) {
        console.error('Error sending shipping notification email:', error);
    }
}

// =============================================
// SETTINGS
// =============================================

export async function getSetting(key: string): Promise<any> {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) return null;
    return data?.value;
}

export async function getSettings(): Promise<Setting[]> {
    const { data, error } = await supabase
        .from('settings')
        .select('*');

    if (error) throw error;
    return data || [];
}

export async function updateSetting(key: string, value: any) {
    const { error } = await supabaseAdmin
        .from('settings')
        .update({ value })
        .eq('key', key);

    if (error) throw error;
}

// =============================================
// PRODUCT STOCK (Por Talla)
// =============================================

/**
 * Obtener todo el stock de un producto por tallas
 */
export async function getProductStock(productId: string): Promise<ProductStock[]> {
    const { data, error } = await supabase
        .from('product_stock')
        .select('*')
        .eq('product_id', productId)
        .order('size');

    if (error) throw error;
    return data || [];
}

/**
 * Obtener stock de un producto como objeto { talla: cantidad }
 */
export async function getProductStockBySize(productId: string): Promise<Record<string, number>> {
    const stock = await getProductStock(productId);
    return stock.reduce((acc, item) => {
        acc[item.size] = item.quantity;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Obtener stock de una talla específica
 */
export async function getStockForSize(productId: string, size: string): Promise<number> {
    const { data, error } = await supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', productId)
        .eq('size', size)
        .single();

    if (error) return 0;
    return data?.quantity || 0;
}

/**
 * Actualizar stock de una talla específica
 */
export async function updateStockForSize(productId: string, size: string, quantity: number): Promise<void> {
    const { error } = await supabaseAdmin
        .from('product_stock')
        .upsert({
            product_id: productId,
            size: size,
            quantity: quantity,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'product_id,size'
        });

    if (error) throw error;
}

/**
 * Actualizar stock de múltiples tallas a la vez
 */
export async function updateProductStockBulk(productId: string, stockBySize: Record<string, number>): Promise<void> {
    const updates = Object.entries(stockBySize).map(([size, quantity]) => ({
        product_id: productId,
        size,
        quantity,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
        .from('product_stock')
        .upsert(updates, {
            onConflict: 'product_id,size'
        });

    if (error) throw error;
}

/**
 * Inicializar stock para un producto nuevo (todas las tallas a 0)
 */
export async function initProductStock(productId: string, sizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']): Promise<void> {
    const stockEntries = sizes.map(size => ({
        product_id: productId,
        size,
        quantity: 0
    }));

    const { error } = await supabaseAdmin
        .from('product_stock')
        .upsert(stockEntries, {
            onConflict: 'product_id,size',
            ignoreDuplicates: true
        });

    if (error) throw error;
}

/**
 * Decrementar stock después de una compra
 */
export async function decrementStock(productId: string, size: string, quantity: number = 1): Promise<boolean> {
    // Primero verificar si hay suficiente stock
    const currentStock = await getStockForSize(productId, size);
    
    if (currentStock < quantity) {
        return false; // No hay suficiente stock
    }

    const { error } = await supabaseAdmin
        .from('product_stock')
        .update({ 
            quantity: currentStock - quantity,
            updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('size', size);

    if (error) {
        console.error('Error decrementando stock:', error);
        return false;
    }
    
    return true;
}

/**
 * Obtener stock total de un producto (suma de todas las tallas)
 */
export async function getTotalStock(productId: string): Promise<number> {
    const stock = await getProductStock(productId);
    return stock.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Verificar si hay stock disponible para una talla
 */
export function hasStockForSize(stockBySize: Record<string, number>, size: string): boolean {
    return (stockBySize[size] || 0) > 0;
}

/**
 * Obtener tallas con stock disponible
 */
export function getAvailableSizes(stockBySize: Record<string, number>): string[] {
    return Object.entries(stockBySize)
        .filter(([_, quantity]) => quantity > 0)
        .map(([size]) => size);
}

// =============================================
// CAROUSEL SLIDES
// =============================================

export interface CarouselSlide {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    image_url: string;
    cta_text: string;
    cta_link: string;
    duration: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get all active carousel slides
 */
export async function getCarouselSlides(): Promise<CarouselSlide[]> {
    const { data, error } = await supabase
        .from('carousel_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get all carousel slides (including inactive) for admin
 */
export async function getAllCarouselSlides(): Promise<CarouselSlide[]> {
    const { data, error } = await supabaseAdmin
        .from('carousel_slides')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get a single carousel slide by ID
 */
export async function getCarouselSlideById(id: string): Promise<CarouselSlide | null> {
    const { data, error } = await supabaseAdmin
        .from('carousel_slides')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Create a new carousel slide
 */
export async function createCarouselSlide(slide: Omit<CarouselSlide, 'id' | 'created_at' | 'updated_at'>): Promise<CarouselSlide> {
    const { data, error } = await supabaseAdmin
        .from('carousel_slides')
        .insert(slide)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a carousel slide
 */
export async function updateCarouselSlide(id: string, updates: Partial<CarouselSlide>): Promise<CarouselSlide> {
    const { data, error } = await supabaseAdmin
        .from('carousel_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a carousel slide
 */
export async function deleteCarouselSlide(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('carousel_slides')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// =============================================
// CUSTOMERS
// =============================================

export interface Customer {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    default_address: any;
    newsletter: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get all customers
 */
export async function getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Get customers subscribed to newsletter
 */
export async function getNewsletterSubscribers(): Promise<Customer[]> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('newsletter', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get orders statistics
 */
export async function getOrdersStats() {
    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('status, total_price, created_at');

    if (error) throw error;

    const stats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        paid: orders?.filter(o => o.status === 'paid').length || 0,
        shipped: orders?.filter(o => o.status === 'shipped').length || 0,
        delivered: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
        totalRevenue: orders?.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_price), 0) || 0
    };

    return stats;
}
