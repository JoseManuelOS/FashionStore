import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request, cookies, url, redirect }, next) => {
    // Protect /admin routes (except login)
    if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
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
                console.error('Error parsing admin session:', e);
            }
        }

        if (!isValidSession) {
            return redirect('/admin/login');
        }
    }

    return next();
});
