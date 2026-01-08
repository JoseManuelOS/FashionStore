import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect }) => {
    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return new Response('ID is required', { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return new Response('Error deleting product', { status: 500 });
        }

        return redirect('/admin/productos?deleted=true');
    } catch (e) {
        console.error('Delete error:', e);
        return new Response('Server error', { status: 500 });
    }
};
