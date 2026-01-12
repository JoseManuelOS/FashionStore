import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: 'Usuario y contraseña son requeridos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Llamar directamente a la función verify_admin_credentials
        const { data, error } = await supabaseAdmin.rpc('verify_admin_credentials', {
            p_email: email,
            p_password: password
        });

        if (error) {
            console.error('Error RPC:', error);
            return new Response(
                JSON.stringify({ error: 'Error de base de datos: ' + error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!data || data.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Credenciales incorrectas' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const admin = data[0];

        // Crear sesión
        const sessionData = {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
            timestamp: Date.now()
        };

        cookies.set('admin-session', JSON.stringify(sessionData), {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 8,
        });

        return new Response(
            JSON.stringify({ 
                success: true,
                admin: { email: admin.email, full_name: admin.full_name, role: admin.role }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Error: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
