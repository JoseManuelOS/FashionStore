import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
    // Only protect /admin routes (except login)
    if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            return redirect('/admin/login');
        }

        // Verify the session
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        if (error || !data.user) {
            // Clear invalid cookies
            cookies.delete('sb-access-token', { path: '/' });
            cookies.delete('sb-refresh-token', { path: '/' });
            return redirect('/admin/login');
        }

        // Refresh the tokens if needed
        if (data.session) {
            cookies.set('sb-access-token', data.session.access_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });
            cookies.set('sb-refresh-token', data.session.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7
            });
        }
    }

    return next();
});
