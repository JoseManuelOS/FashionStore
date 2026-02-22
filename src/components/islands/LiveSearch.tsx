import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice: number | null;
    isOffer: boolean;
    image: string | null;
    category: string | null;
    categorySlug: string | null;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(price);
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
    let timer: ReturnType<typeof setTimeout>;
    const debounced = (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced as T & { cancel: () => void };
}

export default function LiveSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search function
    const fetchResults = useCallback(
        debounce(async (q: string) => {
            if (q.length < 2) {
                setResults([]);
                setHasSearched(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                setResults(data.results || []);
                setHasSearched(true);
            } catch {
                setResults([]);
                setHasSearched(true);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setActiveIndex(-1);
        if (val.trim().length >= 2) {
            fetchResults(val.trim());
        } else {
            setResults([]);
            setHasSearched(false);
            setIsLoading(false);
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && results[activeIndex]) {
                navigateToProduct(results[activeIndex]);
            } else if (query.trim().length >= 2) {
                // Go to products page with search
                window.location.href = `/productos?buscar=${encodeURIComponent(query.trim())}`;
            }
        } else if (e.key === 'Escape') {
            closeSearch();
        }
    };

    const navigateToProduct = (product: SearchResult) => {
        window.location.href = `/productos/${product.slug}`;
    };

    const openSearch = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const closeSearch = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setHasSearched(false);
        setActiveIndex(-1);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeSearch();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut: Ctrl/Cmd + K
    useEffect(() => {
        const handleShortcut = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) closeSearch();
                else openSearch();
            }
        };
        document.addEventListener('keydown', handleShortcut);
        return () => document.removeEventListener('keydown', handleShortcut);
    }, [isOpen]);

    const showDropdown = isOpen && (query.length >= 2 || isLoading);

    return (
        <div ref={containerRef} className={`live-search-wrapper${isOpen ? ' is-open' : ''}`}>
            {/* Search trigger button */}
            {!isOpen && (
                <button
                    onClick={openSearch}
                    className="live-search-trigger"
                    aria-label="Buscar productos"
                    title="Buscar (Ctrl+K)"
                >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            )}

            {/* Expanded search input */}
            {isOpen && (
                <div className="live-search-expanded">
                    <div className="live-search-input-wrap">
                        <svg className="live-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar productos..."
                            className="live-search-input"
                            autoComplete="off"
                        />
                        {isLoading && (
                            <div className="live-search-spinner" />
                        )}
                        <button onClick={closeSearch} className="live-search-close" aria-label="Cerrar búsqueda">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Dropdown results */}
                    {showDropdown && (
                        <div ref={dropdownRef} className="live-search-dropdown">
                            {isLoading && results.length === 0 && (
                                <div className="live-search-status">
                                    <div className="live-search-spinner-lg" />
                                    <span>Buscando...</span>
                                </div>
                            )}

                            {!isLoading && hasSearched && results.length === 0 && (
                                <div className="live-search-empty">
                                    <svg className="w-10 h-10 text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-zinc-400 text-sm font-medium">No se encontraron productos</p>
                                    <p className="text-zinc-600 text-xs mt-1">Prueba con otro término de búsqueda</p>
                                </div>
                            )}

                            {results.length > 0 && (
                                <>
                                    <div className="live-search-results">
                                        {results.map((product, index) => (
                                            <a
                                                key={product.id}
                                                href={`/productos/${product.slug}`}
                                                className={`live-search-item ${index === activeIndex ? 'active' : ''}`}
                                                onMouseEnter={() => setActiveIndex(index)}
                                            >
                                                <div className="live-search-item-img">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} loading="lazy" />
                                                    ) : (
                                                        <div className="live-search-item-placeholder">
                                                            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="live-search-item-info">
                                                    <span className="live-search-item-name">{product.name}</span>
                                                    {product.category && (
                                                        <span className="live-search-item-cat">{product.category}</span>
                                                    )}
                                                </div>
                                                <div className="live-search-item-price">
                                                    {product.isOffer && product.originalPrice ? (
                                                        <>
                                                            <span className="live-search-price-current">{formatPrice(product.price)}</span>
                                                            <span className="live-search-price-old">{formatPrice(product.originalPrice)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="live-search-price-current">{formatPrice(product.price)}</span>
                                                    )}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                    <a
                                        href={`/productos?buscar=${encodeURIComponent(query)}`}
                                        className="live-search-viewall"
                                    >
                                        Ver todos los resultados
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
