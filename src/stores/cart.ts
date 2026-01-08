import { atom, computed } from 'nanostores';

// Types for cart items
export interface CartItem {
    id: string;          // Product ID
    name: string;
    slug: string;
    price: number;       // Price in cents
    quantity: number;
    size: string;
    image: string;
}

// Check for localStorage availability (for SSR compatibility)
const isClient = typeof window !== 'undefined';

// Load cart from localStorage if available
function loadCart(): CartItem[] {
    if (!isClient) return [];
    try {
        const saved = localStorage.getItem('fashionmarket-cart');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

// Save cart to localStorage
function saveCart(items: CartItem[]) {
    if (!isClient) return;
    try {
        localStorage.setItem('fashionmarket-cart', JSON.stringify(items));
    } catch {
        // localStorage not available
    }
}

// =============================================
// CART STORE
// =============================================

// Main cart atom - holds all cart items
export const $cart = atom<CartItem[]>(loadCart());

// Subscribe to changes and persist to localStorage
$cart.subscribe((items) => {
    saveCart(items);
});

// =============================================
// COMPUTED VALUES
// =============================================

// Total number of items in cart
export const $cartCount = computed($cart, (items) =>
    items.reduce((total, item) => total + item.quantity, 0)
);

// Total price in cents
export const $cartTotal = computed($cart, (items) =>
    items.reduce((total, item) => total + (item.price * item.quantity), 0)
);

// Is cart empty?
export const $isCartEmpty = computed($cart, (items) => items.length === 0);

// =============================================
// CART ACTIONS
// =============================================

/**
 * Add an item to the cart
 * If item with same ID + size exists, increment quantity
 */
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
    const currentItems = $cart.get();
    const existingIndex = currentItems.findIndex(
        (i) => i.id === item.id && i.size === item.size
    );

    if (existingIndex >= 0) {
        // Item exists, update quantity
        const updated = [...currentItems];
        updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity
        };
        $cart.set(updated);
    } else {
        // New item
        $cart.set([...currentItems, { ...item, quantity }]);
    }
}

/**
 * Remove an item from the cart completely
 */
export function removeFromCart(id: string, size: string) {
    const currentItems = $cart.get();
    $cart.set(currentItems.filter((item) => !(item.id === id && item.size === size)));
}

/**
 * Update quantity for a specific item
 * If quantity <= 0, remove the item
 */
export function updateQuantity(id: string, size: string, quantity: number) {
    if (quantity <= 0) {
        removeFromCart(id, size);
        return;
    }

    const currentItems = $cart.get();
    const updated = currentItems.map((item) => {
        if (item.id === id && item.size === size) {
            return { ...item, quantity };
        }
        return item;
    });
    $cart.set(updated);
}

/**
 * Clear the entire cart
 */
export function clearCart() {
    $cart.set([]);
}

/**
 * Get a specific item from the cart
 */
export function getCartItem(id: string, size: string): CartItem | undefined {
    return $cart.get().find((item) => item.id === id && item.size === size);
}
