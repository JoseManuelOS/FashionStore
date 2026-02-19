/**
 * Admin authentication helper for API routes.
 * Reuses the same cookie-based session logic as the middleware.
 */

/**
 * Check if the request has a valid admin session.
 * Returns true if authenticated, false otherwise.
 */
export function isAdminAuthenticated(request: Request): boolean {
    const cookieHeader = request.headers.get('cookie') || '';

    if (!cookieHeader.includes('admin-session=')) {
        return false;
    }

    try {
        const match = cookieHeader.match(/admin-session=([^;]+)/);
        if (!match) return false;

        const decoded = decodeURIComponent(match[1]);
        const session = JSON.parse(decoded);

        // Check if session is still valid (8 hours)
        if (session && session.timestamp && (Date.now() - session.timestamp < 8 * 60 * 60 * 1000)) {
            return true;
        }
    } catch {
        // Invalid cookie
    }

    return false;
}

/**
 * Return a 401 JSON response for unauthenticated API requests.
 */
export function unauthorizedResponse(): Response {
    return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
