-- Migration: Add animations configuration to settings table
-- This allows managing animations from the admin panel without code changes

INSERT INTO settings (key, value, description) VALUES
('animations_config', '{
  "enabled": false,
  "respectReducedMotion": true,
  "hero": {
    "entrance": "zoom-fade",
    "parallax": true,
    "parallaxIntensity": 0.3,
    "duration": 1.5,
    "easing": "power3.out"
  },
  "products": {
    "scrollReveal": true,
    "revealType": "stagger-up",
    "hoverEffect": "lift-glow",
    "staggerDelay": 0.1,
    "duration": 0.8
  },
  "categories": {
    "scrollReveal": true,
    "hoverZoom": true,
    "duration": 0.6
  },
  "buttons": {
    "ripple": true,
    "ctaPulse": true,
    "hoverScale": 1.02,
    "pulseDuration": 2.5
  },
  "cart": {
    "slideAnimation": true,
    "itemsStagger": true,
    "duration": 0.4
  },
  "badges": {
    "pulse": true,
    "pulseDuration": 1.8
  },
  "scrollProgress": {
    "enabled": true,
    "color": "gradient",
    "height": 3
  },
  "pageTransitions": {
    "enabled": true,
    "type": "smooth-fade",
    "duration": 0.3
  }
}', 'Configuración global de animaciones de la tienda')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();
