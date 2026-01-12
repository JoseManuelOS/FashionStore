import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ cookies }) => {
    try {
        const sessionCookie = cookies.get('admin-session');
        
        if (sessionCookie) {
            const session = JSON.parse(sessionCookie.value);
            
            // Registrar logout en el log
            await supabaseAdmin.from('admin_activity_log').insert({
                admin_id: session.id,
                action: 'logout',
                details: { email: session.email }
            });
        }

        // Eliminar cookie de sesión
        cookies.delete('admin-session', { path: '/' });

        return new Response(
            JSON.stringify({ success: true }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error: any) {
        console.error('Error en logout de admin:', error);
        return new Response(
            JSON.stringify({ error: 'Error al cerrar sesión' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
