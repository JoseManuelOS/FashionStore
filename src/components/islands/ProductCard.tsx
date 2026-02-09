import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ColorVariant {
    color: string;
    colorName: string;
    image: string;
}

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        original_price?: number | null;
        discount_percent?: number | null;
        stock: number;
        is_offer: boolean;
        category?: { name: string; slug: string };
        images?: Array<{ image_url: string; color?: string; color_name?: string }>;
    };
}

// Predefined colors for demo (map image index to color)
const defaultColors = [
    { color: '#1a1a1a', colorName: 'Negro' },
    { color: '#1e3a5f', colorName: 'Azul Marino' },
    { color: '#6b7280', colorName: 'Gris' },
    { color: '#fef3c7', colorName: 'Beige' },
    { color: '#ffffff', colorName: 'Blanco' },
];

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || '',
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ProductCard({ product }: ProductCardProps) {
    const images = product.images || [];
    const mainImage = images[0]?.image_url || 'https://placehold.co/400x500/0d0d14/06b6d4?text=Producto';

    // Create color variants from images
    const colorVariants: ColorVariant[] = images.slice(0, 5).map((img, idx) => ({
        color: img.color || defaultColors[idx % defaultColors.length].color,
        colorName: img.color_name || defaultColors[idx % defaultColors.length].colorName,
        image: img.image_url
    }));

    const [currentImage, setCurrentImage] = useState(mainImage);
    const [activeColor, setActiveColor] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if product is in favorites on mount
    useEffect(() => {
        const checkFavorite = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Use the database function to check
                const { data } = await supabase.rpc('is_favorite', { p_product_id: product.id });
                setIsFavorite(data === true);
            }
        };
        checkFavorite();
    }, [product.id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const handleColorHover = (variant: ColorVariant, index: number) => {
        setCurrentImage(variant.image);
        setActiveColor(index);
    };

    const handleMouseLeave = () => {
        setCurrentImage(mainImage);
        setActiveColor(0);
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);
        setIsAnimating(true);

        // Reset animation after it completes
        setTimeout(() => setIsAnimating(false), 600);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in, redirect to login
                window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
                return;
            }

            if (isFavorite) {
                // Remove from favorites using DB function
                await supabase.rpc('remove_from_favorites', { p_product_id: product.id });
                setIsFavorite(false);
            } else {
                // Add to favorites using DB function
                await supabase.rpc('add_to_favorites', { p_product_id: product.id });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="product-card group">
            <a href={`/productos/${product.slug}`} className="block">
                <div className="relative aspect-4/5 bg-dark-400 overflow-hidden">
                    <img
                        src={currentImage}
                        alt={product.name}
                        className="product-image w-full h-full object-cover transition-all duration-300"
                        loading="lazy"
                    />
                    {product.is_offer && (
                        <div className="absolute top-3 left-3">
                            <span className="badge-offer">Oferta</span>
                        </div>
                    )}

                    {/* Favorite Button */}
                    <button
                        onClick={handleFavoriteClick}
                        disabled={isLoading}
                        className={`absolute top-3 right-3 p-2 flex items-center justify-center transition-all duration-200 z-10 ${isFavorite
                                ? 'text-red-500'
                                : 'text-white/80 hover:text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]'
                            }`}
                        aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                        {isFavorite ? (
                            <svg 
                                className={`w-6 h-6 transition-transform duration-300 drop-shadow-[0_2px_4px_rgba(239,68,68,0.5)] ${isAnimating ? 'animate-heartbeat' : ''}`} 
                                viewBox="0 0 24 24" 
                                fill="currentColor"
                            >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        ) : (
                            <svg 
                                className={`w-6 h-6 transition-transform duration-200 ${isAnimating ? 'scale-125' : 'hover:scale-110'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        )}
                        
                        {/* Particle effects when adding to favorites */}
                        {isAnimating && isFavorite && (
                            <>
                                <span className="absolute w-1.5 h-1.5 bg-red-400 rounded-full animate-particle-1"></span>
                                <span className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full animate-particle-2"></span>
                                <span className="absolute w-1.5 h-1.5 bg-red-300 rounded-full animate-particle-3"></span>
                                <span className="absolute w-1 h-1 bg-pink-300 rounded-full animate-particle-4"></span>
                                <span className="absolute w-1 h-1 bg-red-500 rounded-full animate-particle-5"></span>
                                <span className="absolute w-1 h-1 bg-pink-500 rounded-full animate-particle-6"></span>
                            </>
                        )}
                    </button>

                    {product.stock === 0 && (
                        <div className="absolute inset-0 bg-dark-600/80 flex items-center justify-center">
                            <span className="px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-lg">
                                Agotado
                            </span>
                        </div>
                    )}
                </div>
            </a>

            {/* Color Variants */}
            {colorVariants.length > 1 && (
                <div className="flex items-center gap-1.5 px-5 pt-4">
                    {colorVariants.map((variant, index) => (
                        <button
                            key={index}
                            className={`
                w-5 h-5 rounded-full border-2 transition-all duration-200
                ${activeColor === index
                                    ? 'border-neon-cyan scale-110 shadow-glow-cyan'
                                    : 'border-white/20 hover:border-white/50'
                                }
              `}
                            style={{ backgroundColor: variant.color }}
                            onMouseEnter={() => handleColorHover(variant, index)}
                            onMouseLeave={handleMouseLeave}
                            title={variant.colorName}
                            aria-label={`Ver en color ${variant.colorName}`}
                        />
                    ))}
                    {images.length > 5 && (
                        <span className="text-xs text-zinc-500 ml-1">+{images.length - 5}</span>
                    )}
                </div>
            )}

            {/* Product Info */}
            <a href={`/productos/${product.slug}`} className="block p-5 pt-3">
                {product.category && (
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                        {product.category.name}
                    </span>
                )}
                <h3 className="font-medium text-white mt-1 group-hover:text-neon-cyan transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        {product.is_offer && product.original_price ? (
                            <>
                                <span className="font-display text-sm text-zinc-500 line-through">
                                    {formatPrice(product.original_price)}
                                </span>
                                <span className="font-display text-xl text-red-500 font-semibold animate-price-pulse">
                                    {formatPrice(product.price)}
                                </span>
                                {product.discount_percent && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded animate-discount-badge">
                                        -{product.discount_percent}%
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="font-display text-xl text-zinc-300">
                                {formatPrice(product.price)}
                            </span>
                        )}
                    </div>
                    {product.stock <= 5 && product.stock > 0 && (
                        <span className="text-xs text-neon-fuchsia">Últimas unidades</span>
                    )}
                </div>
            </a>
        </div>
    );
}
