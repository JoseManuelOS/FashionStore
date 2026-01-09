import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { addToCart, $cart } from '../../stores/cart';
import type { Product } from '../../lib/supabase';

interface AddToCartButtonProps {
    product: Product;
}

function getMainImage(product: Product): string {
    if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
            return firstImage;
        }
        return (firstImage as any).image_url || 'https://placehold.co/400x500/0d0d14/06b6d4?text=Producto';
    }
    return 'https://placehold.co/400x500/0d0d14/06b6d4?text=Producto';
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const cart = useStore($cart);

    const isOutOfStock = product.stock <= 0;
    const image = getMainImage(product);

    const handleAddToCart = () => {
        if (isOutOfStock) return;

        const existingItem = cart.find(i => i.id === product.id && i.size === selectedSize);
        const currentQty = existingItem?.quantity || 0;

        if (currentQty + quantity > product.stock) {
            alert(`Solo hay ${product.stock} unidades disponibles`);
            return;
        }

        setIsAdding(true);

        addToCart({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            size: selectedSize,
            image: image
        }, quantity);

        setTimeout(() => {
            setIsAdding(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }, 300);
    };

    const itemInCart = cart.find(
        (item) => item.id === product.id && item.size === selectedSize
    );

    return (
        <div className="space-y-6">
            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">
                        Talla
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {product.sizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`
                  w-12 h-12 flex items-center justify-center
                  border rounded-xl font-medium text-sm
                  transition-all duration-300
                  ${selectedSize === size
                                        ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan'
                                        : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                                    }
                `}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quantity Selection */}
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                    Cantidad
                </label>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-xl text-zinc-400 hover:border-white/30 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="w-12 text-center font-display text-xl text-white">
                        {quantity}
                    </span>
                    <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-xl text-zinc-400 hover:border-white/30 hover:text-white transition-colors disabled:opacity-30"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stock Info */}
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-400' : product.stock > 0 ? 'bg-neon-fuchsia animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-zinc-500">
                    {isOutOfStock
                        ? 'Sin stock - Agotado'
                        : product.stock <= 5
                            ? `¡Solo quedan ${product.stock} unidades!`
                            : `${product.stock} unidades disponibles`
                    }
                </span>
            </div>

            {/* Add to Cart Button */}
            <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300 transform
          ${isOutOfStock
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : showSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-neon-cyan to-neon-cyan-dark text-dark-600 hover:shadow-glow-cyan-lg active:scale-[0.98]'
                    }
          ${isAdding ? 'scale-95 opacity-75' : ''}
        `}
            >
                {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Añadiendo...
                    </span>
                ) : showSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ¡Añadido al carrito!
                    </span>
                ) : isOutOfStock ? (
                    'Agotado'
                ) : (
                    'Añadir al Carrito'
                )}
            </button>

            {/* Already in cart notice */}
            {itemInCart && !showSuccess && (
                <p className="text-sm text-zinc-500 text-center">
                    Ya tienes {itemInCart.quantity} unidad(es) de talla {itemInCart.size} en el carrito
                </p>
            )}
        </div>
    );
}
