import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { access_token, refresh_token } = await request.json();

        if (!access_token || !refresh_token) {
            return new Response(
                JSON.stringify({ error: 'Missing tokens' }),
                { status: 400 }
            );
        }

        // Set HTTP-only cookies
        cookies.set('sb-access-token', access_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
        });

        cookies.set('sb-refresh-token', refresh_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
        });

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error setting session:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
};
