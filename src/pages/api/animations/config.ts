export const prerender = false;
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// Configuración por defecto
const defaultConfig = {
  enabled: false,
  respectReducedMotion: true,
  hero: {
    enabled: true,
    type: 'fadeSlideUp',
    duration: 1,
    stagger: 0.2
  },
  products: {
    enabled: true,
    type: 'staggerFade',
    duration: 0.6,
    stagger: 0.1
  },
  categories: {
    enabled: true,
    type: 'scaleIn',
    duration: 0.5,
    stagger: 0.15
  },
  buttons: {
    hoverScale: true,
    rippleEffect: true,
    ctaPulse: true
  },
  cart: {
    slideIn: true,
    itemsAnimate: true
  },
  badges: {
    pulseEffect: true,
    bounceOnHover: true
  },
  scrollProgress: {
    enabled: true,
    color: '#06b6d4',
    height: 3,
    position: 'top'
  },
  pageTransitions: {
    enabled: true,
    type: 'fade',
    duration: 0.3
  }
};

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'animations_config')
      .single();

    if (error || !data) {
      // Retornar configuración por defecto si no existe
      return new Response(JSON.stringify(defaultConfig), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache 1 minuto
        }
      });
    }

    return new Response(JSON.stringify(data.value), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (error) {
    console.error('Error fetching animation config:', error);
    return new Response(JSON.stringify(defaultConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
