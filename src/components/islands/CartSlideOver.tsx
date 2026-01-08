import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
    $cart,
    $cartTotal,
    $isCartEmpty,
    removeFromCart,
    updateQuantity
} from '../../stores/cart';

// Format price from cents to display
function formatPrice(priceInCents: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(priceInCents / 100);
}

interface CartSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
    const cart = useStore($cart);
    const total = useStore($cartTotal);
    const isEmpty = useStore($isCartEmpty);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle animation states
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
          fixed inset-0 bg-brand-navy-900/50 z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div
                className={`
          fixed inset-y-0 right-0 w-full max-w-md z-50
          bg-white shadow-elegant-lg
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
                onTransitionEnd={() => !isOpen && setIsAnimating(false)}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-brand-charcoal-100 flex items-center justify-between">
                        <h2 className="font-serif text-xl text-brand-navy-500">
                            Tu Carrito
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-brand-charcoal-400 hover:text-brand-charcoal-600 transition-colors"
                            aria-label="Cerrar carrito"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {isEmpty ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <svg className="w-16 h-16 text-brand-charcoal-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <p className="text-brand-charcoal-500 mb-4">
                                    Tu carrito está vacío
                                </p>
                                <a
                                    href="/productos"
                                    onClick={onClose}
                                    className="text-brand-navy-500 hover:text-brand-navy-600 font-medium underline underline-offset-4"
                                >
                                    Explorar productos
                                </a>
                            </div>
                        ) : (
                            <ul className="divide-y divide-brand-charcoal-100">
                                {cart.map((item) => (
                                    <li key={`${item.id}-${item.size}`} className="px-6 py-4 flex gap-4">
                                        {/* Product Image */}
                                        <div className="w-20 h-24 bg-cream-200 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={`/productos/${item.slug}`}
                                                className="font-medium text-brand-charcoal-700 hover:text-brand-navy-500 line-clamp-1"
                                            >
                                                {item.name}
                                            </a>
                                            <p className="text-sm text-brand-charcoal-400 mt-1">
                                                Talla: {item.size}
                                            </p>
                                            <p className="font-semibold text-brand-navy-500 mt-1">
                                                {formatPrice(item.price)}
                                            </p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-brand-charcoal-200 rounded text-brand-charcoal-500 hover:border-brand-navy-300"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-brand-charcoal-200 rounded text-brand-charcoal-500 hover:border-brand-navy-300"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.size)}
                                                    className="ml-auto p-1 text-brand-charcoal-400 hover:text-red-500 transition-colors"
                                                    aria-label="Eliminar producto"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer with Total & Checkout */}
                    {!isEmpty && (
                        <div className="border-t border-brand-charcoal-100 px-6 py-4 space-y-4 bg-cream-100">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center">
                                <span className="text-brand-charcoal-500">Subtotal</span>
                                <span className="font-serif text-xl text-brand-navy-500">
                                    {formatPrice(total)}
                                </span>
                            </div>

                            <p className="text-xs text-brand-charcoal-400">
                                Envío e impuestos calculados en el checkout
                            </p>

                            {/* Checkout Button */}
                            <a
                                href="/carrito"
                                className="block w-full py-4 px-6 bg-brand-navy-500 text-white text-center font-semibold rounded-lg hover:bg-brand-navy-600 transition-colors"
                            >
                                Finalizar Compra
                            </a>

                            {/* Continue Shopping */}
                            <button
                                onClick={onClose}
                                className="w-full text-center text-sm text-brand-charcoal-500 hover:text-brand-navy-500"
                            >
                                Continuar comprando
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
