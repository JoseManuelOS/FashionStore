import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $cartCount, $cartTotal, removeFromCart, updateQuantity, clearCart } from '../../stores/cart';

export default function CartSlideOver() {
    const [isOpen, setIsOpen] = useState(false);
    const cart = useStore($cart);
    const count = useStore($cartCount);
    const total = useStore($cartTotal);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        window.addEventListener('toggle-cart', openCart);
        window.addEventListener('close-cart', closeCart);
        return () => {
            window.removeEventListener('toggle-cart', openCart);
            window.removeEventListener('close-cart', closeCart);
        };
    }, [openCart, closeCart]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                onClick={closeCart}
            />

            {/* Slide Over Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 animate-slide-in">
                <div className="h-full bg-dark-500/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="font-display text-xl text-white">Tu Carrito</h2>
                                <p className="text-sm text-zinc-500">{count} artículo{count !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={closeCart}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <p className="text-zinc-400 mb-2">Tu carrito está vacío</p>
                                <p className="text-sm text-zinc-600 mb-6">Añade productos para continuar</p>
                                <a
                                    href="/productos"
                                    onClick={closeCart}
                                    className="inline-block px-6 py-3 bg-neon-cyan text-dark-600 font-semibold rounded-lg hover:shadow-glow-cyan transition-shadow"
                                >
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="w-20 h-24 bg-dark-400 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <a href={`/productos/${item.slug}`} className="font-medium text-white hover:text-neon-cyan transition-colors line-clamp-1">
                                                {item.name}
                                            </a>
                                            {item.size && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-white/5 text-zinc-400 text-xs rounded">
                                                    Talla: {item.size}
                                                </span>
                                            )}
                                            <p className="font-display text-neon-cyan mt-2">{formatPrice(item.price)}</p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.size || '', item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.size || '', item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.size || '')}
                                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="p-6 border-t border-white/5 bg-dark-600/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-zinc-400">Subtotal</span>
                                <span className="font-display text-2xl text-white">{formatPrice(total)}</span>
                            </div>
                            <p className="text-sm text-zinc-500 mb-6">Impuestos y envío calculados en el checkout</p>

                            <a
                                href="/carrito"
                                className="block w-full py-4 bg-gradient-to-r from-neon-cyan to-neon-cyan-dark text-dark-600 font-semibold rounded-lg text-center hover:shadow-glow-cyan transition-shadow"
                            >
                                Finalizar Compra
                            </a>

                            <button
                                onClick={() => clearCart()}
                                className="w-full mt-3 py-3 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                            >
                                Vaciar carrito
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
