import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request, cookies, url, redirect }, next) => {
    // Protect /admin routes (except login)
    const isAdminPage = url.pathname.startsWith('/admin') && url.pathname !== '/admin/login';
    const isAdminApi = url.pathname.startsWith('/api/admin') || 
                       url.pathname.startsWith('/api/products/delete') ||
                       url.pathname.startsWith('/api/email/send-newsletter');

    if (isAdminPage || isAdminApi) {
        // Check for admin-session cookie
        const cookieHeader = request.headers.get('cookie') || '';
        let isValidSession = false;

        if (cookieHeader.includes('admin-session=')) {
            try {
                const match = cookieHeader.match(/admin-session=([^;]+)/);
                if (match) {
                    const decoded = decodeURIComponent(match[1]);
                    const session = JSON.parse(decoded);
                    // Check if session is still valid (8 hours)
                    if (session && session.timestamp && (Date.now() - session.timestamp < 8 * 60 * 60 * 1000)) {
                        isValidSession = true;
                    }
                }
            } catch (e) {
                // Invalid session cookie
            }
        }

        if (!isValidSession) {
            if (isAdminApi) {
                return new Response(
                    JSON.stringify({ error: 'No autorizado' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }
            return redirect('/admin/login');
        }
    }

    const response = await next();

    // Security headers
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
});
