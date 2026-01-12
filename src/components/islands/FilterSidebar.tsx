import { useState, useEffect, useCallback } from 'react';

interface FilterSidebarProps {
    categories: Array<{ name: string; slug: string }>;
    allSizes: string[];
    maxPrice: number;
    initialFilters: {
        search: string;
        category: string;
        sizes: string[];
        priceMin: number;
        priceMax: number;
        offers: boolean;
        color: string;
    };
}

const colors = [
    { value: 'negro', hex: '#1a1a1a', label: 'Negro' },
    { value: 'blanco', hex: '#ffffff', label: 'Blanco' },
    { value: 'azul', hex: '#1e3a5f', label: 'Azul' },
    { value: 'gris', hex: '#6b7280', label: 'Gris' },
    { value: 'beige', hex: '#d4c4a8', label: 'Beige' },
];

// Popular tags for quick filtering
const styleTags = [
    'Manga corta', 'Manga larga', 'Slim fit', 'Regular', 'Casual', 'Formal',
    'Verano', 'Invierno', 'Primavera', 'Otoño'
];

export default function FilterSidebar({
    categories,
    allSizes,
    maxPrice,
    initialFilters
}: FilterSidebarProps) {
    const [searchQuery, setSearchQuery] = useState(initialFilters.search);
    const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(initialFilters.sizes);
    const [priceMin, setPriceMin] = useState(initialFilters.priceMin);
    const [priceMax, setPriceMax] = useState(initialFilters.priceMax);
    const [offersOnly, setOffersOnly] = useState(initialFilters.offers);
    const [selectedColor, setSelectedColor] = useState(initialFilters.color);

    // Build URL and navigate
    const navigateWithFilters = useCallback((overrides: Partial<{
        search: string;
        category: string;
        sizes: string[];
        priceMin: number;
        priceMax: number;
        offers: boolean;
        color: string;
    }> = {}) => {
        const params = new URLSearchParams();
        
        const search = overrides.search ?? searchQuery;
        const category = overrides.category ?? selectedCategory;
        const sizes = overrides.sizes ?? selectedSizes;
        const pMin = overrides.priceMin ?? priceMin;
        const pMax = overrides.priceMax ?? priceMax;
        const offers = overrides.offers ?? offersOnly;
        const color = overrides.color ?? selectedColor;

        if (search) params.set('buscar', search);
        if (category) params.set('categoria', category);
        if (sizes.length) params.set('tallas', sizes.join(','));
        if (pMin > 0) params.set('precioMin', pMin.toString());
        if (pMax < maxPrice) params.set('precioMax', pMax.toString());
        if (offers) params.set('ofertas', 'true');
        if (color) params.set('color', color);

        window.location.href = `/productos${params.toString() ? '?' + params.toString() : ''}`;
    }, [searchQuery, selectedCategory, selectedSizes, priceMin, priceMax, offersOnly, selectedColor, maxPrice]);

    // Handle category change
    const handleCategoryChange = (slug: string) => {
        setSelectedCategory(slug);
        navigateWithFilters({ category: slug });
    };

    // Handle offers toggle
    const handleOffersToggle = () => {
        const newValue = !offersOnly;
        setOffersOnly(newValue);
        navigateWithFilters({ offers: newValue });
    };

    // Handle style tag click - toggle behavior
    const handleStyleTagClick = (tag: string) => {
        const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
        const newSearch = isActive ? '' : tag;
        setSearchQuery(newSearch);
        navigateWithFilters({ search: newSearch });
    };

    // Handle size toggle
    const handleSizeToggle = (size: string) => {
        const newSizes = selectedSizes.includes(size)
            ? selectedSizes.filter(s => s !== size)
            : [...selectedSizes, size];
        setSelectedSizes(newSizes);
        navigateWithFilters({ sizes: newSizes });
    };

    // Handle color change
    const handleColorChange = (colorValue: string) => {
        const newColor = selectedColor === colorValue ? '' : colorValue;
        setSelectedColor(newColor);
        navigateWithFilters({ color: newColor });
    };

    const clearFilters = () => {
        window.location.href = '/productos';
    };

    const activeFiltersCount = [
        selectedCategory,
        selectedSizes.length > 0,
        priceMin > 0,
        priceMax < maxPrice,
        offersOnly,
        selectedColor
    ].filter(Boolean).length;

    // Handle slider background gradient
    const getSliderBackground = () => {
        const minPercent = (priceMin / maxPrice) * 100;
        const maxPercent = (priceMax / maxPrice) * 100;
        return `linear-gradient(to right, 
      rgba(255,255,255,0.1) ${minPercent}%, 
      #06b6d4 ${minPercent}%, 
      #06b6d4 ${maxPercent}%, 
      rgba(255,255,255,0.1) ${maxPercent}%)`;
    };

    return (
        <div className="glass-card sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">

            {/* Search */}
            <div className="p-4 border-b border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && navigateWithFilters({ search: searchQuery })}
                        placeholder="Buscar..."
                        className="w-full bg-dark-300 border border-white/10 text-white text-sm pl-9 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-neon-cyan/50"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => navigateWithFilters({ search: searchQuery })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neon-cyan hover:text-neon-cyan-light"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Price Range - Compact */}
            <div className="p-4 border-b border-white/5">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Precio</h3>
                <div className="space-y-3">
                    {/* Range Slider */}
                    <div className="relative pt-1 pb-2">
                        <div
                            className="h-1.5 rounded-full"
                            style={{ background: getSliderBackground() }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={maxPrice}
                            value={priceMin}
                            onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10))}
                            className="absolute top-1 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-cyan [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow-cyan"
                        />
                        <input
                            type="range"
                            min={0}
                            max={maxPrice}
                            value={priceMax}
                            onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10))}
                            className="absolute top-1 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-cyan [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow-cyan"
                        />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={priceMin}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setPriceMin(Math.min(val, priceMax - 1));
                                navigateWithFilters({ priceMin: Math.min(val, priceMax - 1), priceMax });
                            }}
                            className="w-16 bg-dark-300 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-neon-cyan/50 text-center"
                        />
                        <span className="text-zinc-600">—</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={priceMax}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || maxPrice;
                                setPriceMax(Math.max(val, priceMin + 1));
                                navigateWithFilters({ priceMin, priceMax: Math.max(val, priceMin + 1) });
                            }}
                            className="w-16 bg-dark-300 border border-white/10 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-neon-cyan/50 text-center"
                        />
                        <span className="text-zinc-500">€</span>
                    </div>
                </div>
            </div>

            {/* Popular Tags */}
            <div className="p-4 border-b border-white/5">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Estilos populares</h3>
                <div className="flex flex-wrap gap-1.5">
                    {styleTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleStyleTagClick(tag)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${searchQuery.toLowerCase() === tag.toLowerCase()
                                    ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                                    : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Offers Toggle - Prominent */}
            <div className="p-4 border-b border-white/5">
                <button
                    onClick={handleOffersToggle}
                    className={`flex items-center justify-between w-full py-3 px-4 rounded-xl text-sm font-medium transition-all ${offersOnly
                        ? 'bg-gradient-to-r from-neon-fuchsia/20 to-neon-cyan/10 text-neon-fuchsia border border-neon-fuchsia/40 shadow-lg shadow-neon-fuchsia/10'
                        : 'bg-dark-300 text-zinc-300 border border-white/10 hover:border-neon-fuchsia/30 hover:text-neon-fuchsia'
                        }`}
                >
                    <span className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${offersOnly ? 'bg-neon-fuchsia animate-pulse' : 'bg-zinc-600'}`} />
                        Ofertas
                    </span>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${offersOnly ? 'bg-neon-fuchsia' : 'bg-dark-400'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${offersOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                </button>
            </div>

            {/* Categories - Dropdown */}
            <details className="group border-b border-white/5">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Categoría {selectedCategory && <span className="text-neon-cyan normal-case">({categories.find(c => c.slug === selectedCategory)?.name})</span>}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="px-4 pb-4 space-y-1">
                    <button
                        onClick={() => handleCategoryChange('')}
                        className={`block w-full text-left py-1.5 text-sm transition-colors ${!selectedCategory ? 'text-neon-cyan' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Todas
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.slug}
                            onClick={() => handleCategoryChange(cat.slug)}
                            className={`block w-full text-left py-1.5 text-sm transition-colors ${selectedCategory === cat.slug ? 'text-neon-cyan' : 'text-zinc-400 hover:text-white'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </details>

            {/* Sizes - Multi-select */}
            <details className="group border-b border-white/5">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Talla {selectedSizes.length > 0 && `(${selectedSizes.length})`}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                    {allSizes.map(size => (
                        <button
                            key={size}
                            onClick={() => handleSizeToggle(size)}
                            className={`px-3 py-1.5 text-xs border rounded-md transition-all ${selectedSizes.includes(size)
                                ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                                : 'border-white/10 text-zinc-400 hover:border-white/30'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </details>

            {/* Colors */}
            <details className="group border-b border-white/5">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Color</span>
                    <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                    {colors.map(color => (
                        <button
                            key={color.value}
                            onClick={() => handleColorChange(color.value)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === color.value
                                ? 'border-neon-cyan scale-110 shadow-glow-cyan'
                                : 'border-white/20 hover:border-white/50'
                                }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                        />
                    ))}
                </div>
            </details>

            {/* Clear Filters - Only show when filters are active */}
            {activeFiltersCount > 0 && (
                <div className="p-4">
                    <button
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpiar filtros ({activeFiltersCount})
                    </button>
                </div>
            )}
        </div>
    );
}
