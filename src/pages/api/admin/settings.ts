export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

// Helper para verificar autenticación admin
function getAdminSession(request: Request): any {
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-session=")) {
    try {
      const match = cookieHeader.match(/admin-session=([^;]+)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        const session = JSON.parse(decoded);
        // Verificar si la sesión sigue válida (8 horas)
        if (Date.now() - session.timestamp < 8 * 60 * 60 * 1000) {
          return session;
        }
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  // Verificar autenticación admin
  const adminSession = getAdminSession(request);
  
  if (!adminSession) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upsert: insertar o actualizar
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('Error saving setting:', error);
      return new Response(JSON.stringify({ error: 'Error al guardar' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, request }) => {
  // Verificar autenticación admin
  const adminSession = getAdminSession(request);
  
  if (!adminSession) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const key = url.searchParams.get('key');

  if (key) {
    // Obtener una configuración específica
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'No encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data.value), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // Obtener todas las configuraciones
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*');

    if (error) {
      return new Response(JSON.stringify({ error: 'Error al obtener' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
