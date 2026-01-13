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
 * Get order by ID with items
 */
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
