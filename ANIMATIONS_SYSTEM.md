# Sistema de Animaciones - FashionStore

## 📋 Resumen

Se ha implementado un sistema completo de animaciones utilizando GSAP que es 100% configurable desde el panel de administración, sin necesidad de tocar código.

## 🗂️ Archivos Creados

### Librería de Animaciones
- `src/lib/animations/gsap-config.ts` - Configuración e inicialización de GSAP
- `src/lib/animations/animation-presets.ts` - Presets y funciones de animación reutilizables

### Componentes React
- `src/components/islands/PageAnimations.tsx` - Controlador principal de animaciones
- `src/components/islands/ScrollProgressBar.tsx` - Barra de progreso de scroll

### Panel de Administración
- `src/pages/admin/animaciones.astro` - Página de gestión de animaciones

### APIs
- `src/pages/api/admin/settings.ts` - API para guardar configuraciones (admin)
- `src/pages/api/animations/config.ts` - API pública para obtener config de animaciones

### Base de Datos
- `supabase/migrations/add_animations_config.sql` - Migración SQL para insertar configuración

### Estilos
- Se añadieron estilos GSAP al final de `src/styles/global.css`

## 🎨 Animaciones Disponibles

### Hero / Banner Principal
- **Tipos**: fadeSlideUp, fadeIn, scaleUp, slideFromLeft, slideFromRight
- **Parámetros**: duración, stagger

### Productos
- **Tipos**: staggerFade, staggerScale, slideUp, flipIn
- **Parámetros**: duración, stagger
- **Trigger**: ScrollTrigger al 80% del viewport

### Categorías
- **Tipos**: scaleIn, fadeSlide, rotateIn
- **Parámetros**: duración, stagger

### Botones e Interacciones
- ✅ Escala al hover
- ✅ Efecto ripple (Material Design)
- ✅ Pulso en CTAs

### Carrito
- ✅ Slide-in del panel
- ✅ Animación de items

### Badges / Etiquetas
- ✅ Efecto pulso
- ✅ Bounce al hover

### Barra de Progreso de Scroll
- **Personalizable**: Color, altura, posición (arriba/abajo)

### Transiciones de Página
- **Tipos**: fade, slide, scale, none
- **Parámetro**: duración

## 🔧 Cómo Usar

### 1. Ejecutar la Migración SQL
Ejecuta el siguiente SQL en Supabase para crear la configuración inicial:

```sql
-- En Supabase SQL Editor
INSERT INTO settings (key, value, updated_at)
VALUES (
  'animations_config',
  '{...}', -- JSON de configuración
  now()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

O simplemente ejecuta el archivo `supabase/migrations/add_animations_config.sql`

### 2. Acceder al Panel de Admin
1. Ve a `/admin/animaciones`
2. Activa/desactiva animaciones globalmente
3. Configura cada sección individualmente
4. Guarda los cambios

### 3. Respetar Accesibilidad
El sistema respeta automáticamente `prefers-reduced-motion` del usuario. Puedes desactivar esta opción desde el admin si lo deseas.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    PublicLayout.astro                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PageAnimations (React Island)              │    │
│  │  - Carga config desde API                            │    │
│  │  - Inicializa GSAP + ScrollTrigger                   │    │
│  │  - Aplica animaciones según config                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               /api/animations/config                         │
│  - Obtiene config de Supabase                               │
│  - Retorna defaults si no existe                            │
│  - Cache de 1 minuto                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (settings)                       │
│  key: 'animations_config'                                    │
│  value: { enabled, hero, products, ... }                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Selectores CSS Utilizados

El sistema busca automáticamente estos elementos:

| Sección | Selectores |
|---------|------------|
| Hero | `#hero-section`, `.hero-section`, `[data-hero]` |
| Productos | `.product-card`, `.product-card-new`, `[data-product]` |
| Categorías | `.category-card`, `[data-category]` |
| Headers | `.section-title`, `.section-header`, `h2` |
| CTAs | `.hero-btn`, `.cta-btn`, `.btn-cta-pulse` |
| Badges | `.badge-offer`, `.badge-sale`, `.offer-badge` |

## ♿ Accesibilidad

- Respeta `prefers-reduced-motion: reduce`
- Sin animaciones si el sistema del usuario lo indica
- Opción configurable desde admin

## 📦 Dependencias

- `gsap` - Ya instalado en package.json
- `gsap/ScrollTrigger` - Plugin incluido

## 🚀 Testing

1. Inicia el servidor: `npm run dev`
2. Abre la tienda: http://localhost:3001
3. Scroll por la página para ver animaciones
4. Prueba el panel admin: http://localhost:3001/admin/animaciones
