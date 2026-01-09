import { useState } from 'react';

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

    return (
        <div className="product-card group">
            <a href={`/productos/${product.slug}`} className="block">
                <div className="relative aspect-[4/5] bg-dark-400 overflow-hidden">
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
                                <span className="font-display text-xl text-red-500 font-semibold">
                                    {formatPrice(product.price)}
                                </span>
                                {product.discount_percent && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
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
