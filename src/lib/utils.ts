/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

/**
 * Format price for display (expects euros, not cents)
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Format relative time (e.g., "hace 2 días")
 */
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Expand products so that multi-color products appear once per color.
 * Each expanded entry carries `_displayColor` (name), `_displayColorHex` (hex),
 * `_displayImage` (first image of that color), and `_colorSlug` (for URL query).
 * Products with 0 or 1 color pass through unchanged.
 */
export function expandProductsByColor(products: any[]): any[] {
    const result: any[] = [];

    for (const product of products) {
        const colors: Array<{ name: string; hex: string }> = product.colors || [];
        const images: Array<{ image_url: string; color?: string; order?: number }> = product.images || [];

        if (colors.length <= 1) {
            // No expansion needed — keep as-is
            result.push({
                ...product,
                _displayColor: colors[0]?.name || null,
                _displayColorHex: colors[0]?.hex || null,
                _displayImage: images[0]?.image_url || null,
                _colorSlug: null,
            });
            continue;
        }

        // One entry per color
        for (const color of colors) {
            const colorKey = color.name.toLowerCase();
            // Find the first image that matches this color
            const colorImage = images.find(
                (img) => (img.color || '').toLowerCase() === colorKey
            );
            const fallbackImage = images[0]?.image_url || null;

            result.push({
                ...product,
                _displayColor: color.name,
                _displayColorHex: color.hex,
                _displayImage: colorImage?.image_url || fallbackImage,
                _colorSlug: color.name,
            });
        }
    }

    return result;
}
