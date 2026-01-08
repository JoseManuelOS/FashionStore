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
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    category_id: string | null;
    is_offer: boolean;
    sizes: string[];
    active: boolean;
    created_at: string;
    // Joined data
    category?: Category;
    images?: ProductImage[];
    main_image?: string; // From view
}

export interface Order {
    id: string;
    total_price: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    customer_email: string | null;
    customer_name: string | null;
    shipping_address: string | null;
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

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw error;
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
