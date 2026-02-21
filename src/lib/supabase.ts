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
    image_url?: string;
    description?: string;
    display_order: number;
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

export interface ProductVariant {
    id: string;
    product_id: string;
    size: string;
    stock: number;
    sku?: string;
    created_at: string;
}

// Alias for backward compatibility if needed, though we should transition to ProductVariant
export type ProductStock = ProductVariant;

export interface ShippingMethod {
    id: number;
    name: string;
    description: string | null;
    price: number;
    estimated_days: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Order {
    id: string; // UUID - kept for compatibility with existing data
    order_number: number;
    total_price: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
    customer_email: string | null;
    customer_name: string | null;
    shipping_address: string | null;
    shipping_method_id: number | null;
    // Campos de Stripe
    stripe_session_id?: string | null;
    stripe_payment_intent?: string | null;
    // Campos de envio
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
    shipping_method?: ShippingMethod;
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
        .order('display_order')
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

    // Si se marca como entregado, enviar email de notificación
    if (status === 'delivered') {
        const order = await getOrderById(orderId);
        if (order?.customer_email) {
            await sendDeliveredNotificationEmail(order);
        }
    }

    // Si se cancela, restaurar el stock de cada item
    if (status === 'cancelled') {
        const { data: orderItems } = await supabaseAdmin
            .from('order_items')
            .select('product_id, size, quantity')
            .eq('order_id', orderId);

        if (orderItems) {
            for (const item of orderItems) {
                if (item.product_id && item.size) {
                    await incrementStock(item.product_id, item.size, item.quantity);
                }
            }
        }
    }
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
        const { buildShippingUpdateHTML } = await import('./email-templates');

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

        const html = buildShippingUpdateHTML({
            customerName: order.customer_name || 'Cliente',
            orderRef: String(order.order_number || order.id),
            carrierName,
            trackingNumber: order.tracking_number || '',
            trackingUrl: order.tracking_url || null
        });

        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [order.customer_email!],
            subject: `Tu pedido #${order.order_number || order.id} está en camino - FashionMarket`,
            html
        });

        console.log('Shipping notification email sent to:', order.customer_email);
    } catch (error) {
        console.error('Error sending shipping notification email:', error);
    }
}

async function sendDeliveredNotificationEmail(order: Order) {
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(import.meta.env.RESEND_API_KEY);
        const { buildOrderDeliveredHTML } = await import('./email-templates');

        const orderItems = (order.items || []).map(item => ({
            product_image: item.product_image || null,
            product_name: item.product_name,
            size: item.size || null,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase
        }));

        const html = buildOrderDeliveredHTML({
            customerName: order.customer_name || 'Cliente',
            orderRef: String(order.order_number || order.id),
            orderItems,
            totalPrice: order.total_price,
            deliveredDate: order.delivered_at || new Date().toISOString()
        });

        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [order.customer_email!],
            subject: `Tu pedido #${order.order_number || order.id} ha sido entregado - FashionMarket`,
            html
        });

        console.log('Delivered notification email sent to:', order.customer_email);
    } catch (error) {
        console.error('Error sending delivered notification email:', error);
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
// PRODUCT VARIANTS (Stock & Prices)
// =============================================

/**
 * Obtener todo el stock de un producto por tallas
 * @deprecated Use getProductVariants instead
 */
export async function getProductStock(productId: string): Promise<ProductVariant[]> {
    return getProductVariants(productId);
}

/**
 * Obtener stock de un producto como objeto { talla: cantidad }
 */
export async function getProductStockBySize(productId: string): Promise<Record<string, number>> {
    const stock = await getProductVariants(productId);
    return stock.reduce((acc, item) => {
        acc[item.size] = item.stock;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Obtener stock de una talla específica
 */
export async function getStockForSize(productId: string, size: string): Promise<number> {
    const { data, error } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)
        .eq('size', size)
        .single();

    if (error) return 0;
    return data?.stock || 0;
}

/**
 * Actualizar stock de una talla específica
 */
export async function updateStockForSize(productId: string, size: string, quantity: number): Promise<void> {
    // Try to update existing variant
    const { data, error: updateError } = await supabaseAdmin
        .from('product_variants')
        .update({ stock: quantity })
        .eq('product_id', productId)
        .eq('size', size)
        .select('id')
        .single();

    // If no row exists, insert a new one
    if (!data) {
        const { error: insertError } = await supabaseAdmin
            .from('product_variants')
            .insert({
                product_id: productId,
                size: size,
                stock: quantity,
            });

        if (insertError) throw insertError;
    } else if (updateError) {
        throw updateError;
    }
}

/**
 * Actualizar stock de múltiples tallas a la vez
 */
/**
 * Obtener variantes de un producto (stock, precio, oferta)
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size');

    if (error) throw error;
    return data || [];
}

/**
 * Actualizar variantes de un producto (stock por talla)
 */
export async function updateProductVariants(
    productId: string,
    variantsData: Record<string, { stock: number; price?: number | null; is_offer?: boolean }>
): Promise<void> {
    // Delete existing variants and re-insert (product_variants has no unique constraint on product_id,size)
    await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

    const insertData = Object.entries(variantsData).map(([size, data]) => ({
        product_id: productId,
        size,
        stock: data.stock,
    }));

    const { error } = await supabaseAdmin
        .from('product_variants')
        .insert(insertData);

    if (error) throw error;
}

/**
 * Legacy: Update stock only (adapts to new table structure)
 */
export async function updateProductStockBulk(productId: string, stockBySize: Record<string, number>): Promise<void> {
    // Delete existing variants and re-insert
    await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

    const insertData = Object.entries(stockBySize).map(([size, quantity]) => ({
        product_id: productId,
        size,
        stock: quantity,
    }));

    const { error } = await supabaseAdmin
        .from('product_variants')
        .insert(insertData);

    if (error) throw error;
}

/**
 * Inicializar stock para un producto nuevo (todas las tallas a 0)
 */
/**
 * Inicializar stock para un producto nuevo (todas las tallas a 0)
 */
export async function initProductStock(productId: string, sizes: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']): Promise<void> {
    const stockEntries = sizes.map(size => ({
        product_id: productId,
        size,
        stock: 0,
    }));

    const { error } = await supabaseAdmin
        .from('product_variants')
        .insert(stockEntries);

    if (error) throw error;
}

/**
 * Decrementar stock después de una compra (operación atómica)
 */
export async function decrementStock(productId: string, size: string, quantity: number = 1): Promise<boolean> {
    // Atomic: decrement only if enough stock, in a single query
    const { data, error } = await supabaseAdmin
        .rpc('decrement_variant_stock', {
            p_product_id: productId,
            p_size: size,
            p_quantity: quantity
        });

    // Fallback to non-RPC approach if function doesn't exist
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        const currentStock = await getStockForSize(productId, size);
        if (currentStock < quantity) return false;

        const { error: updateError } = await supabaseAdmin
            .from('product_variants')
            .update({
                stock: currentStock - quantity
            })
            .eq('product_id', productId)
            .eq('size', size)
            .gte('stock', quantity);

        if (updateError) {
            console.error('Error decrementando stock:', updateError);
            return false;
        }
        await syncProductTotalStock(productId);
        return true;
    }

    if (error) {
        console.error('Error decrementando stock:', error);
        return false;
    }

    if (data === true) {
        // Sync products.stock total
        await syncProductTotalStock(productId);
    }
    return data === true;
}

/**
 * Incrementar stock después de una devolución (operación atómica)
 */
export async function incrementStock(productId: string, size: string, quantity: number = 1): Promise<boolean> {
    // Atomic: increment stock in a single query
    const { data, error } = await supabaseAdmin
        .rpc('increment_variant_stock', {
            p_product_id: productId,
            p_size: size,
            p_quantity: quantity
        });

    // Fallback if RPC function doesn't exist
    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        const currentStock = await getStockForSize(productId, size);

        const { error: updateError } = await supabaseAdmin
            .from('product_variants')
            .update({
                stock: currentStock + quantity
            })
            .eq('product_id', productId)
            .eq('size', size);

        if (updateError) {
            console.error('Error incrementando stock:', updateError);
            return false;
        }
        await syncProductTotalStock(productId);
        return true;
    }

    if (error) {
        console.error('Error incrementando stock:', error);
        return false;
    }

    if (data === true) {
        // Sync products.stock total
        await syncProductTotalStock(productId);
    }
    return data === true;
}

/**
 * Sync products.stock with the sum of all product_variants stock
 */
export async function syncProductTotalStock(productId: string): Promise<void> {
    const total = await getTotalStock(productId);
    await supabaseAdmin
        .from('products')
        .update({ stock: total })
        .eq('id', productId);
}

/**
 * Obtener stock total de un producto (suma de todas las tallas)
 */
export async function getTotalStock(productId: string): Promise<number> {
    const stock = await getProductVariants(productId);
    return stock.reduce((total, item) => total + item.stock, 0);
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
    discount_code?: string | null;
    style_config?: any; // JSONB storage for positioning
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
        .insert({
            ...slide,
            discount_code: slide.discount_code,
            style_config: slide.style_config || {}
        })
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

    if (error) {
        console.error('Error updating carousel slide:', error);
        throw error;
    }

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
 * Newsletter subscriber interface (independent table)
 */
export interface NewsletterSubscriber {
    id: string;
    email: string;
    name: string | null;
    subscribed_at: string;
    source: string;
    is_active: boolean;
    promo_code_sent: string | null;
}

/**
 * Get subscribers from newsletter_subscribers table
 */
export async function getNewsletterSubscribersFromTable(): Promise<NewsletterSubscriber[]> {
    const { data, error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true)
        .order('subscribed_at', { ascending: false });

    if (error) {
        console.error('Error fetching newsletter_subscribers:', error);
        return [];
    }
    return data || [];
}

/**
 * Combined email recipient for newsletter sending
 */
export interface EmailRecipient {
    email: string;
    name: string | null;
    source: 'customer' | 'subscriber';
}

/**
 * Get ALL email recipients for newsletter (combines both sources, removes duplicates)
 */
export async function getAllEmailRecipients(): Promise<EmailRecipient[]> {
    const recipients: Map<string, EmailRecipient> = new Map();

    // Get subscribers from newsletter_subscribers table
    const tableSubscribers = await getNewsletterSubscribersFromTable();
    for (const sub of tableSubscribers) {
        const email = sub.email.toLowerCase();
        if (!recipients.has(email)) {
            recipients.set(email, {
                email: sub.email,
                name: sub.name,
                source: 'subscriber'
            });
        }
    }

    // Get customers with newsletter = true
    const customers = await getNewsletterSubscribers();
    for (const customer of customers) {
        const email = customer.email.toLowerCase();
        if (!recipients.has(email)) {
            recipients.set(email, {
                email: customer.email,
                name: customer.full_name,
                source: 'customer'
            });
        }
    }

    return Array.from(recipients.values());
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
        return_requested: orders?.filter(o => o.status === 'return_requested').length || 0,
        returned: orders?.filter(o => o.status === 'returned').length || 0,
        totalRevenue: orders?.filter(o => o.status !== 'cancelled' && o.status !== 'returned').reduce((sum, o) => sum + Number(o.total_price), 0) || 0
    };

    return stats;
}

export interface Facturacion {
    id: number;
    order_id: string;
    invoice_number: string;
    customer_name: string | null;
    customer_email: string | null;
    shipping_address: string | null;
    items: {
        product_name: string;
        quantity: number;
        size: string | null;
        price: number;
        total: number;
    }[];
    subtotal: number;
    iva_amount: number;
    shipping_cost: number;
    total: number;
    created_at: string;
    // Joined data from orders table (optional, for display)
    orders?: {
        order_number: number;
        customer_email: string;
        customer_name: string;
        total_price: number;
    };
}

/**
 * Generate next invoice number in format YYYY-XXXXXX
 */
async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear().toString();

    // Get the max invoice number for this year (format: FM-YYYY-XXXXXX)
    const { data } = await supabaseAdmin
        .from('facturacion')
        .select('invoice_number')
        .like('invoice_number', `FM-${year}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

    let nextSeq = 1;
    if (data && data.length > 0 && data[0].invoice_number) {
        const parts = data[0].invoice_number.split('-');
        // Format: FM-YYYY-XXXXXX (3 parts)
        if (parts.length === 3) {
            nextSeq = parseInt(parts[2], 10) + 1;
        }
    }

    return `FM-${year}-${nextSeq.toString().padStart(6, '0')}`;
}

/**
 * Create a new facturacion entry for an order with complete invoice data
 */
export async function createFacturacion(orderId: string): Promise<Facturacion> {
    // Fetch order with items
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        throw new Error(`Order not found: ${orderId}`);
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    const items = (order.items || []).map((item: any) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        size: item.size,
        price: item.price_at_purchase,
        total: item.price_at_purchase * item.quantity
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = order.total_price;
    // IVA is already included in prices, calculate base amount
    const baseImponible = subtotal / 1.21;
    const ivaAmount = subtotal - baseImponible;

    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .insert({
            order_id: orderId,
            invoice_number: invoiceNumber,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            shipping_address: order.shipping_address,
            items: items,
            subtotal: subtotal,
            iva_amount: ivaAmount,
            shipping_cost: 0, // Free shipping
            total: total
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get original facturacion (invoice) by Order ID.
 * Returns the original invoice (positive total), not the credit note.
 */
export async function getFacturacionByOrderId(orderId: string): Promise<Facturacion | null> {
    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .select('*, orders(order_number, customer_email, customer_name, total_price)')
        .eq('order_id', orderId)
        .not('invoice_number', 'like', 'FR-%')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * Get existing credit note (factura rectificativa) by Order ID.
 * Credit notes have invoice_number starting with 'FR-'.
 */
export async function getCreditNoteByOrderId(orderId: string): Promise<Facturacion | null> {
    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .select('*, orders(order_number, customer_email, customer_name, total_price)')
        .eq('order_id', orderId)
        .like('invoice_number', 'FR-%')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * Generate next credit note number in format FR-YYYY-XXXXXX
 */
async function generateCreditNoteNumber(): Promise<string> {
    const year = new Date().getFullYear().toString();

    const { data } = await supabaseAdmin
        .from('facturacion')
        .select('invoice_number')
        .like('invoice_number', `FR-${year}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

    let nextSeq = 1;
    if (data && data.length > 0 && data[0].invoice_number) {
        const parts = data[0].invoice_number.split('-');
        if (parts.length === 3) {
            nextSeq = parseInt(parts[2], 10) + 1;
        }
    }

    return `FR-${year}-${nextSeq.toString().padStart(6, '0')}`;
}

/**
 * Create a credit note (factura rectificativa) referencing the original invoice.
 * Amounts are negative to indicate a refund.
 */
export async function createCreditNote(orderId: string): Promise<Facturacion> {
    // Check if a credit note already exists for this order (from a previous attempt)
    const existingCreditNote = await getCreditNoteByOrderId(orderId);
    if (existingCreditNote) {
        console.log('Credit note already exists for order, reusing:', existingCreditNote.invoice_number);
        return existingCreditNote;
    }

    // Get the original invoice
    const originalInvoice = await getFacturacionByOrderId(orderId);
    if (!originalInvoice) {
        throw new Error(`Original invoice not found for order: ${orderId}`);
    }

    const creditNoteNumber = await generateCreditNoteNumber();

    // Items with negative amounts
    const items = (originalInvoice.items || []).map((item: any) => ({
        product_name: item.product_name,
        quantity: -item.quantity,
        size: item.size,
        price: item.price,
        total: -(item.total || item.price * Math.abs(item.quantity))
    }));

    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .insert({
            order_id: orderId,
            invoice_number: creditNoteNumber,
            customer_name: originalInvoice.customer_name,
            customer_email: originalInvoice.customer_email,
            shipping_address: originalInvoice.shipping_address,
            items: items,
            subtotal: -originalInvoice.subtotal,
            iva_amount: -originalInvoice.iva_amount,
            shipping_cost: -originalInvoice.shipping_cost,
            total: -originalInvoice.total
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get facturacion by ID
 */
export async function getFacturacionById(id: number): Promise<Facturacion | null> {
    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .select('*, orders(order_number, customer_email, customer_name, total_price)')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Get all facturacion entries (for Admin)
 */
export async function getAllFacturacion(): Promise<Facturacion[]> {
    const { data, error } = await supabaseAdmin
        .from('facturacion')
        .select('*, orders(order_number, customer_email, customer_name, total_price)')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// =============================================
// SHIPPING METHODS
// =============================================

/**
 * Get all active shipping methods
 */
export async function getShippingMethods(): Promise<ShippingMethod[]> {
    const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get shipping method by ID
 */
export async function getShippingMethodById(id: number): Promise<ShippingMethod | null> {
    const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}
