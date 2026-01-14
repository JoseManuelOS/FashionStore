# 📊 Estado del Proyecto FashionMarket

> **Última actualización:** 14 de enero de 2026  
> **Hito actual:** Hito 3 - La Tienda Viva (98% completado)

---

## 📑 Índice

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Funcionalidades Completadas](#-funcionalidades-completadas)
4. [Funcionalidades Pendientes](#-funcionalidades-pendientes)
5. [Mejoras de Interfaz Sugeridas](#-mejoras-de-interfaz-sugeridas)
6. [Base de Datos - Estado](#-base-de-datos---estado)
7. [Sistema de Pagos](#-sistema-de-pagos)
8. [Próximos Pasos Prioritarios](#-próximos-pasos-prioritarios)

---

## 🎯 Resumen Ejecutivo

FashionMarket es una tienda online de moda masculina premium construida con tecnologías modernas. El proyecto está en fase avanzada de desarrollo con las funcionalidades core implementadas y funcionando.

### ✅ Completado (98%)
- ✅ Arquitectura base con Astro + Supabase + Stripe
- ✅ Catálogo de productos con filtros y categorías
- ✅ Sistema de carrito persistente
- ✅ Checkout completo con Stripe (tarjeta, PayPal, Revolut Pay)
- ✅ Panel de administración con gestión de productos
- ✅ Sistema de autenticación de usuarios
- ✅ Emails transaccionales (Resend)
- ✅ Panel admin: productos, pedidos, usuarios, comunicaciones, carrusel
- ✅ **Webhook de Stripe para confirmación de pagos automática**
- ✅ **Gestión de envíos (transportista, código seguimiento)**
- ✅ **Emails automáticos de confirmación y envío**
- ✅ **Recuperación de contraseña**
- ✅ **Sistema de códigos promocionales dinámicos (desde BD)**
- ✅ **Panel admin de códigos promocionales**

### ⚠️ Pendiente (2%)
- ⏳ Mejoras de UX/UI identificadas
- ⏳ Despliegue a producción (Coolify/VPS)

---

## 🛠️ Stack Tecnológico

### Frontend
```yaml
Framework: Astro 5.16.7 (Modo Híbrido SSG + SSR)
UI Components: React 19 (Islands Architecture)
Estilos: Tailwind CSS 4.1.18
Estado: Nano Stores 1.1.0
Modo Rendering:
  - SSG: Catálogo público (/productos, /categoria)
  - SSR: Carrito, Checkout, Admin, Cuenta de usuario
```

### Backend & Servicios
```yaml
Base de Datos: Supabase PostgreSQL
Autenticación: Supabase Auth
Almacenamiento: Cloudinary (imágenes de productos)
Emails: Resend (confirmaciones, newsletter, bienvenida)
Pasarela de Pago: Stripe (card, PayPal, Revolut Pay)
```

### Despliegue
```yaml
Objetivo: VPS con Coolify
Formato: Docker container / Node.js
Estado: Pendiente configuración
```

---

## ✅ Funcionalidades Completadas

### 🛍️ A. Tienda Pública (Frontend)

#### 1. **Homepage** (`/`)
- ✅ Hero section con carrusel dinámico
- ✅ Sección de productos destacados
- ✅ Sección de ofertas (activable desde admin)
- ✅ Footer con enlaces útiles

#### 2. **Catálogo de Productos** (`/productos`)
- ✅ Grid responsive de productos
- ✅ Filtros por categoría (Camisas, Pantalones, Trajes)
- ✅ Búsqueda y ordenamiento
- ✅ Sistema de etiquetas (tags)
- ✅ Paginación

**Página de Categoría** (`/categoria/[slug]`)
- ✅ Filtrado automático por categoría
- ✅ Breadcrumbs de navegación
- ✅ Contador de productos

#### 3. **Ficha de Producto** (`/productos/[slug]`)
- ✅ Galería de imágenes con navegación
- ✅ Selector de talla (S, M, L, XL)
- ✅ Indicador de stock real
- ✅ Precio con descuento si aplica
- ✅ Botón "Añadir al Carrito" (React Island)
- ✅ Descripción del producto
- ✅ Información de envío

#### 4. **Carrito de Compra** (`/carrito`)
- ✅ SlideOver (panel lateral deslizante)
- ✅ Persistencia en localStorage
- ✅ Modificar cantidades
- ✅ Eliminar productos
- ✅ Cálculo automático de totales
- ✅ Validación de stock
- ✅ Botón de checkout

#### 5. **Checkout** (`/checkout`)
- ✅ Formulario de datos de cliente
- ✅ Campos: email, nombre, teléfono
- ✅ Dirección de envío completa
- ✅ Prellenado para usuarios registrados
- ✅ Resumen del pedido
- ✅ Aplicación de códigos de descuento
- ✅ Integración con Stripe Checkout
- ✅ Múltiples métodos de pago (Card, PayPal, Revolut Pay)

**Página de Éxito** (`/checkout/success`)
- ✅ Confirmación visual de pago
- ✅ Limpieza automática del carrito
- ✅ Envío de email de confirmación
- ✅ Enlaces a "Ver Pedidos" y "Seguir Comprando"

#### 6. **Sección de Ofertas** (`/ofertas`)
- ✅ Página dedicada de ofertas flash
- ✅ Productos marcados como ofertas
- ✅ Visualización de precio original y descuento
- ✅ Control desde panel admin (activar/desactivar)

#### 7. **Autenticación de Usuarios**

**Login** (`/auth/login`)
- ✅ Formulario de inicio de sesión
- ✅ Integración con Supabase Auth
- ✅ Mensajes de error claros

**Registro** (`/auth/registro`)
- ✅ Formulario de creación de cuenta
- ✅ Validación de campos
- ✅ Checkbox de newsletter
- ✅ Creación automática de perfil en `customers`
- ✅ Email de bienvenida automático (Resend)

**Callback** (`/auth/callback`)
- ✅ Manejo de redirecciones OAuth

#### 8. **Cuenta de Usuario** (`/cuenta`)

**Dashboard** (`/cuenta/index`)
- ✅ Información personal editable
- ✅ Dirección de envío guardada
- ✅ Gestión de preferencias (newsletter)
- ✅ Avatar y datos de perfil

**Pedidos** (`/cuenta/pedidos`)
- ✅ Historial completo de pedidos
- ✅ Estado de cada pedido (pending, paid, shipped, delivered)
- ✅ Detalle de productos comprados
- ✅ Total y fecha

**Favoritos** (`/cuenta/favoritos`)
- ✅ Lista de productos marcados como favoritos
- ✅ Añadir/eliminar favoritos
- ✅ Enlace directo a fichas de producto

---

### 🔐 B. Panel de Administración (Backoffice)

**Ruta base:** `/admin` (protegida con middleware)

#### 1. **Dashboard** (`/admin/dashboard`)
- ✅ Resumen de ventas del día
- ✅ Pedidos pendientes
- ✅ Productos con bajo stock
- ✅ Estadísticas visuales

#### 2. **Gestión de Productos** (`/admin/productos`)

**Listado** (`/admin/productos`)
- ✅ Tabla de todos los productos
- ✅ Búsqueda y filtros
- ✅ Indicador de stock
- ✅ Editar y eliminar productos

**Crear Producto** (`/admin/productos/nuevo`)
- ✅ Formulario completo
- ✅ Nombre, descripción, precio
- ✅ Selector de categoría
- ✅ Stock por talla
- ✅ Subida múltiple de imágenes (Cloudinary)
- ✅ Sistema drag & drop para imágenes
- ✅ Previsualización de imágenes
- ✅ Generación automática de slug
- ✅ Marcado como oferta
- ✅ Precio original y descuento

**Editar Producto** (`/admin/productos/[id]`)
- ✅ Precarga de datos existentes
- ✅ Modificación de todos los campos
- ✅ Gestión de imágenes existentes
- ✅ Agregar nuevas imágenes

#### 3. **Gestión de Pedidos** (`/admin/pedidos`)

**Listado** (`/admin/pedidos`)
- ✅ Tabla de todos los pedidos
- ✅ Filtro por estado
- ✅ Tarjetas de estadísticas:
  - Total de pedidos
  - Pedidos pendientes
  - Pedidos pagados
  - Pedidos enviados
  - Pedidos entregados
  - Revenue total

**Detalle de Pedido** (`/admin/pedidos/[id]`)
- ✅ Información completa del pedido
- ✅ Productos del pedido con imágenes
- ✅ Datos del cliente
- ✅ Dirección de envío
- ✅ Estado actual
- ✅ Cambio de estado (dropdown)
- ✅ Actualización de estado con feedback

#### 4. **Gestión de Usuarios** (`/admin/usuarios`)

**Listado** (`/admin/usuarios`)
- ✅ Tabla de clientes registrados
- ✅ Email, nombre, teléfono
- ✅ Estado de newsletter
- ✅ Fecha de registro
- ✅ Tarjetas de estadísticas:
  - Total de usuarios
  - Suscritos al newsletter

**Perfil de Usuario** (`/admin/usuarios/[id]`)
- ✅ Información de contacto
- ✅ Dirección guardada
- ✅ Estado de newsletter
- ✅ Historial de pedidos del usuario
- ✅ Total gastado

#### 5. **Comunicaciones** (`/admin/comunicaciones`)
- ✅ Formulario de envío de newsletters
- ✅ Campo de asunto
- ✅ Campo de contenido (textarea)
- ✅ Contador de suscriptores
- ✅ Lista de suscriptores en sidebar
- ✅ **Integración con Resend** (emails reales)
- ✅ Plantilla HTML profesional
- ✅ Personalización con nombre del cliente
- ✅ Estadísticas de envío (exitosos/fallidos)

#### 6. **Gestión de Carrusel** (`/admin/carrusel`)

**Listado** (`/admin/carrusel`)
- ✅ Grid de slides del carrusel
- ✅ Vista previa de imágenes
- ✅ Orden de slides
- ✅ Estado activo/inactivo
- ✅ Editar y eliminar slides

**Crear Slide** (`/admin/carrusel/nuevo`)
- ✅ Subida de imagen (Cloudinary)
- ✅ Título, subtítulo, descripción
- ✅ Texto del CTA
- ✅ Enlace del CTA
- ✅ Duración (ms)
- ✅ Orden de visualización

**Editar Slide** (`/admin/carrusel/[id]`)
- ✅ Modificación de todos los campos
- ✅ Cambio de imagen
- ✅ Activar/desactivar slide

#### 7. **Login Admin** (`/admin/login`)
- ✅ Formulario de autenticación
- ✅ Validación de rol admin
- ✅ Redirección automática
- ✅ Gestión de sesión

---

### 📧 C. Sistema de Emails (Resend)

#### 1. **Email de Bienvenida** (`/api/email/send-welcome`)
- ✅ Se envía automáticamente al registrarse
- ✅ Personalizado con nombre del usuario
- ✅ Plantilla HTML profesional
- ✅ Branding FashionMarket
- ✅ Listado de beneficios
- ✅ CTA a la tienda

#### 2. **Email de Confirmación de Pedido** (`/api/email/send-order-confirmation`)
- ✅ Se envía tras pago exitoso
- ✅ Número de pedido (sessionId de Stripe)
- ✅ Detalle de productos con imágenes
- ✅ Total del pedido
- ✅ Dirección de envío
- ✅ Estado del pedido
- ✅ Timeline de seguimiento
- ✅ Enlace a "Seguir mi Pedido"

#### 3. **Newsletter** (`/api/email/send-newsletter`)
- ✅ Envío masivo a suscriptores
- ✅ Personalización con nombre
- ✅ Asunto y contenido personalizables
- ✅ Plantilla HTML consistente
- ✅ Enlace a la tienda
- ✅ Estadísticas de envío

---

### 🗄️ D. Base de Datos (Supabase)

**Tablas principales implementadas:**

1. ✅ `categories` - Categorías de productos
2. ✅ `products` - Catálogo de productos
3. ✅ `product_images` - Imágenes de productos (N:1)
4. ✅ `product_tags` - Relación productos-etiquetas (N:M)
5. ✅ `tags` - Etiquetas (colores, estilos)
6. ✅ `product_variants` - Variantes por talla
7. ✅ `orders` - Pedidos
8. ✅ `order_items` - Detalle de pedidos
9. ✅ `customers` - Perfiles de clientes
10. ✅ `customer_favorites` - Favoritos
11. ✅ `settings` - Configuración global
12. ✅ `carousel_slides` - Carrusel del homepage

**Políticas RLS (Row Level Security):**
- ✅ Productos: Lectura pública, escritura solo admin
- ✅ Pedidos: Cada cliente ve solo sus pedidos
- ✅ Favoritos: Cada cliente gestiona solo sus favoritos
- ✅ Carrusel: Lectura pública, escritura solo admin

---

## ⏳ Funcionalidades Pendientes

### 🚨 A. Críticas (Afectan a la funcionalidad core)

#### 1. **Webhook de Stripe** ⚡ PRIORIDAD ALTA
**Problema actual:**
- Los pagos se procesan en Stripe ✅
- El email de confirmación se envía ✅
- **PERO:** No se crea el pedido en la base de datos ❌
- **PERO:** No se descuenta el stock ❌

**Qué falta implementar:**
```typescript
// Archivo a crear: /src/pages/api/webhooks/stripe.ts
- Recibir evento de Stripe "checkout.session.completed"
- Validar firma del webhook
- Extraer datos del pedido (items, cliente, dirección)
- Crear registro en tabla 'orders'
- Crear registros en tabla 'order_items'
- Descontar stock de cada producto
- Enviar email de confirmación al admin (opcional)
```

**Documentación de referencia:**
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/api/checkout/sessions/retrieve

**Endpoint necesario:**
```
POST /api/webhooks/stripe
```

---

#### 2. **Código de Seguimiento de Pedidos** ⚡ PRIORIDAD ALTA

**Problema actual:**
- Los pedidos se muestran con estado (pending, paid, shipped, delivered)
- No hay código de tracking visible para el cliente
- El email de confirmación dice "Te enviaremos el número de seguimiento"

**Qué falta implementar:**

**Base de datos:**
```sql
ALTER TABLE orders 
ADD COLUMN tracking_number VARCHAR(100),
ADD COLUMN carrier VARCHAR(50); -- 'Correos', 'SEUR', 'MRW', etc.
```

**Panel Admin** (`/admin/pedidos/[id]`):
- Campo de entrada para tracking_number
- Selector de carrier
- Botón "Actualizar tracking"

**Cuenta Usuario** (`/cuenta/pedidos`):
- Mostrar tracking_number si existe
- Enlace directo a página de tracking del carrier

**Email automático:**
```typescript
// Nuevo endpoint: /api/email/send-tracking-update
- Se envía cuando admin añade tracking number
- Incluye enlace directo a tracking del carrier
```

---

#### 3. **Sistema de Notificaciones al Admin**

**Qué falta:**
- Notificación cuando hay un nuevo pedido (email o dashboard)
- Badge de "nuevos pedidos" en sidebar admin
- Sonido/notificación browser cuando hay nuevo pedido (opcional)

**Implementación sugerida:**
```typescript
// Opción 1: Email al admin con cada pedido
// Opción 2: Webhook interno que actualice un contador
// Opción 3: Polling cada X segundos en dashboard admin
```

---

### 📊 B. Mejoras de UX/UI

#### 1. **Mejoras Visuales del Panel Admin**

**Dashboard** (`/admin/dashboard`):
- ❌ Gráficas de ventas (últimos 7/30 días)
- ❌ Top 5 productos más vendidos
- ❌ Comparativa mes actual vs anterior
- ❌ Indicadores de tendencia (↑ ↓)

**Recomendación:**
- Usar Chart.js o Recharts para gráficas
- Colores consistentes con el theme (cyan, zinc)

---

#### 2. **Filtros Avanzados en Catálogo**

**Página de Productos** (`/productos`):
Actualmente tiene:
- ✅ Filtro por categoría
- ✅ Búsqueda por nombre
- ✅ Ordenamiento (precio, fecha)

**Mejoras sugeridas:**
- ❌ Filtro por rango de precio (slider)
- ❌ Filtro por talla disponible
- ❌ Filtro por color (tags)
- ❌ Filtro múltiple de categorías
- ❌ "Limpiar filtros" button

**Ejemplo de implementación:**
```tsx
// Componente: FilterPanel.tsx
<FilterSidebar>
  <PriceRangeSlider min={0} max={200} />
  <SizeFilter sizes={['S', 'M', 'L', 'XL']} />
  <ColorFilter colors={tags} />
</FilterSidebar>
```

---

#### 3. **Mejoras del Carrito**

**SlideOver actual** (`CartSlideOver.tsx`):
- ✅ Añadir/quitar productos
- ✅ Cambiar cantidades
- ✅ Mostrar total

**Mejoras sugeridas:**
- ❌ Animación de "producto añadido"
- ❌ Estimación de envío según país
- ❌ Código de descuento desde el carrito (ahora solo en checkout)
- ❌ Recomendaciones de productos relacionados
- ❌ Botón "Guardar carrito para después" (usuarios registrados)

---

#### 4. **Ficha de Producto Mejorada**

**Página actual** (`/productos/[slug]`):
- ✅ Galería de imágenes
- ✅ Selector de talla
- ✅ Añadir al carrito

**Mejoras sugeridas:**
- ❌ Zoom en imágenes (lightbox)
- ❌ Guía de tallas interactiva
- ❌ Reseñas de clientes (sistema completo)
- ❌ "Productos relacionados" al final
- ❌ Botón "Compartir" (redes sociales)
- ❌ Indicador de "X personas viendo este producto"
- ❌ Botón "Notificarme cuando esté disponible" (si sin stock)

---

#### 5. **Mejoras de Checkout**

**Página actual** (`/checkout`):
- ✅ Formulario funcional
- ✅ Integración con Stripe

**Mejoras sugeridas:**
- ❌ Indicador de progreso (1. Datos → 2. Envío → 3. Pago)
- ❌ Validación en tiempo real de campos
- ❌ Autocompletar dirección (Google Places API)
- ❌ Opción "Factura" (CIF/NIF)
- ❌ Checkbox "Guardar dirección" (usuarios registrados)
- ❌ Resumen sticky del pedido (móvil)
- ❌ Trust badges (SSL, Pagos seguros, etc.)

---

### 🎨 C. Identidad Visual y Branding

**Estado actual:**
- ✅ Colores: Cyan/Blue gradient, zinc para textos
- ✅ Tipografía: Sans-serif limpia
- ✅ Componentes: Tailwind CSS 4

**Mejoras sugeridas:**

#### 1. **Tipografía más Premium**
```css
/* Actualizar en tailwind.config.js */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');

fontFamily: {
  'display': ['Playfair Display', 'serif'],  // Títulos
  'body': ['Inter', 'sans-serif'],            // Textos
}
```

#### 2. **Paleta de Colores Refinada**
```js
// Sugerencia para theme más "fashion"
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... cyan actual
  },
  accent: {
    gold: '#D4AF37',     // Acentos dorados
    leather: '#8B4513',  // Marrón cuero
  },
  neutral: {
    // Mantener zinc actual
  }
}
```

#### 3. **Animaciones y Microinteracciones**
- ❌ Hover effects más suaves en cards
- ❌ Loading skeletons (en vez de spinners)
- ❌ Transiciones entre páginas (View Transitions API)
- ❌ Animación de scroll reveal para productos

---

### 📱 D. Responsive y Mobile

**Estado actual:**
- ✅ Grid responsive
- ✅ Menú hamburguesa
- ✅ Formularios adaptables

**Mejoras sugeridas:**
- ❌ Bottom navigation bar (móvil)
- ❌ Swipe gestures en galería de imágenes
- ❌ Pull to refresh en listados
- ❌ Optimización de imágenes (srcset, lazy loading)
- ❌ PWA (Progressive Web App)
  - Installable app
  - Offline mode para catálogo
  - Push notifications

---

### ⚙️ E. Configuración y Settings

**Tabla `settings` actual:**
```sql
- offers_enabled: true/false
- free_shipping_threshold: 5000
- store_open: true/false
```

**Mejoras sugeridas para panel admin:**
- ❌ Página `/admin/configuracion`
  - Toggle de "Tienda abierta"
  - Umbral de envío gratis
  - Activar/desactivar ofertas
  - Texto del banner de anuncio
  - Horarios de atención
  - Redes sociales
  - Política de devoluciones
  - Términos y condiciones

---

### 🔍 F. SEO y Performance

**Pendiente:**
- ❌ Meta tags dinámicos por producto
- ❌ Schema.org markup (Product, Organization)
- ❌ Sitemap.xml generado automáticamente
- ❌ Robots.txt configurado
- ❌ Open Graph tags para redes sociales
- ❌ Lazy loading de imágenes
- ❌ Preload de recursos críticos
- ❌ Análisis con Google Analytics/Plausible

---

### 📊 G. Analytics y Reportes

**Pendiente:**
- ❌ Dashboard de ventas con gráficas
- ❌ Reporte de productos más vendidos
- ❌ Reporte de abandono de carrito
- ❌ Tasa de conversión
- ❌ Ingresos por categoría
- ❌ Exportar pedidos a CSV/Excel
- ❌ Exportar clientes a CSV

---

## 🎨 Mejoras de Interfaz Sugeridas

### 1. **Homepage**

**Actual:**
```
- Hero con carrusel
- Grid de productos
- Sección de ofertas
```

**Mejoras:**
```
+ Sección "Nuevos Arrivals" separada
+ Testimonios de clientes
+ Instagram feed (@fashionmarket)
+ Newsletter signup en footer
+ Video de presentación de marca
+ Lookbook section (outfits completos)
```

---

### 2. **Página de Producto**

**Mejoras visuales:**
```tsx
// Layout sugerido
<ProductPage>
  <ImageGallery>
    - Imagen principal grande (con zoom)
    - Thumbnails laterales
    - Fullscreen mode
    - Video del producto (opcional)
  </ImageGallery>
  
  <ProductInfo>
    <Breadcrumbs />
    <Title />
    <Price>
      - Precio actual
      - Precio tachado si hay descuento
      - Badge "% OFF"
    </Price>
    <SizeGuide modal />
    <SizeSelector />
    <StockIndicator>
      - "En stock" (verde)
      - "Últimas unidades" (naranja)
      - "Sin stock" (rojo)
    </StockIndicator>
    <AddToCartButton />
    <WishlistButton />
    <Tabs>
      - Descripción
      - Composición
      - Cuidados
      - Envíos y devoluciones
    </Tabs>
  </ProductInfo>
  
  <RelatedProducts />
  <RecentlyViewed />
</ProductPage>
```

---

### 3. **Panel Admin - Rediseño Visual**

**Sugerencias de layout:**

```
┌─────────────────────────────────────────┐
│  Logo     Dashboard     Notif 🔔  User │
├────┬────────────────────────────────────┤
│    │  📊 Dashboard                      │
│ S  │  ┌────────┬────────┬────────┐     │
│ I  │  │ Ventas │Pedidos │Revenue │     │
│ D  │  │ 1,234€ │   12   │3,456€  │     │
│ E  │  └────────┴────────┴────────┘     │
│ B  │                                    │
│ A  │  📈 Gráfica Ventas (últimos 7d)   │
│ R  │  [Chart.js line chart]             │
│    │                                    │
│ 📦 │  🏆 Top Productos                  │
│ 📋 │  1. Camisa Oxford - 45 ventas     │
│ 👥 │  2. Pantalón Chino - 38 ventas    │
│ ✉️ │  3. Blazer Navy - 32 ventas       │
│ 🎠 │                                    │
│ ⚙️ │  ⚠️ Productos con bajo stock       │
│    │  [Lista de productos < 5 uds]      │
└────┴────────────────────────────────────┘
```

**Colores sugeridos:**
- Sidebar: `bg-zinc-900` con items `hover:bg-zinc-800`
- Cards: `bg-white` con `shadow-lg`
- Stats: Gradientes cyan para cifras importantes
- Alertas: Sistema de colores semántico
  - Info: Blue
  - Success: Green
  - Warning: Amber
  - Error: Red

---

### 4. **Componentes UI Nuevos Recomendados**

```typescript
// Crear en /src/components/ui/

1. Badge.astro
   - Para "Nuevo", "Oferta", "Agotado"
   
2. Tooltip.tsx
   - Hover info en iconos
   
3. Modal.tsx
   - Confirmaciones de eliminación
   - Guía de tallas
   
4. Skeleton.astro
   - Loading states
   
5. EmptyState.astro
   - Cuando no hay productos/pedidos
   
6. Pagination.astro
   - Navegación entre páginas
   
7. Breadcrumbs.astro
   - Navegación jerárquica
   
8. Stars.astro
   - Rating de productos (futuro)
```

---

## 🗄️ Base de Datos - Estado

### Tablas Implementadas ✅

```sql
-- Core
✅ categories (3 categorías)
✅ products (con todos los campos necesarios)
✅ product_images (relación 1:N)
✅ product_tags (relación N:M)
✅ tags

-- Ecommerce
✅ orders
✅ order_items
✅ customers (perfil extendido de auth.users)
✅ customer_favorites

-- Config
✅ settings (offers_enabled, etc.)
✅ carousel_slides

-- Variantes
✅ product_variants (stock por talla)
```

### Campos Faltantes 🔧

#### Tabla: `orders`
```sql
-- Añadir:
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN stripe_checkout_session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN notes TEXT; -- Notas del admin
```

#### Tabla: `products`
```sql
-- Opcional (para futuras features):
ALTER TABLE products ADD COLUMN sku VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN weight INTEGER; -- gramos
ALTER TABLE products ADD COLUMN views INTEGER DEFAULT 0; -- contador de vistas
ALTER TABLE products ADD COLUMN sales_count INTEGER DEFAULT 0; -- contador de ventas
```

#### Nueva Tabla: `reviews` (para sistema de reseñas)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, customer_id) -- Una reseña por cliente por producto
);
```

---

## 💳 Sistema de Pagos

### Estado Actual ✅

**Stripe Integration:**
- ✅ Checkout Session creado correctamente
- ✅ Múltiples métodos de pago:
  - Card (Visa, Mastercard, Apple Pay, Google Pay)
  - PayPal
  - Revolut Pay
- ✅ Modo test funcionando
- ✅ Descuentos aplicables
- ✅ Metadata incluida (teléfono, nombre cliente)

**Variables de entorno configuradas:**
```env
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### Lo que falta ⚠️

#### 1. **Webhook de Confirmación** ⚡ CRÍTICO

**Archivo a crear:** `/src/pages/api/webhooks/stripe.ts`

```typescript
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // 1. Retrieve full session with line_items
    const fullSession = await stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ['line_items.data.price.product'] }
    );

    // 2. Extract order data
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const shippingAddress = session.shipping_details?.address;
    const totalAmount = session.amount_total! / 100; // Convert from cents

    // 3. Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_price: totalAmount,
        status: 'paid',
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: JSON.stringify(shippingAddress),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Create order items
    const lineItems = fullSession.line_items?.data || [];
    for (const item of lineItems) {
      const productId = item.price?.product?.metadata?.product_id;
      const size = item.price?.product?.metadata?.size;
      
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_name: item.description,
          quantity: item.quantity,
          size: size,
          price_at_purchase: item.amount_total / 100,
        });

      // 5. Update stock
      if (productId && size) {
        // Opción A: Stock global
        await supabase.rpc('decrement_stock', {
          product_id: productId,
          quantity: item.quantity
        });

        // Opción B: Stock por talla (si usas product_variants)
        await supabase.rpc('decrement_variant_stock', {
          product_id: productId,
          size: size,
          quantity: item.quantity
        });
      }
    }

    // 6. Send confirmation email (ya lo tienes)
    // await sendOrderConfirmation(customerEmail, order);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
```

**Función SQL necesaria para actualizar stock:**
```sql
-- Crear función para decrementar stock de forma atómica
CREATE OR REPLACE FUNCTION decrement_stock(
  product_id UUID,
  quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - quantity
  WHERE id = product_id
  AND stock >= quantity; -- Solo si hay suficiente stock
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Si usas product_variants:
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  product_id UUID,
  size TEXT,
  quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock - quantity
  WHERE product_id = product_id
  AND size = size
  AND stock >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para talla %', size;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Configurar Webhook en Stripe Dashboard:**
1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Crear endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (opcional)
4. Copiar Webhook Secret → `.env` como `STRIPE_WEBHOOK_SECRET`

---

#### 2. **Modo Producción**

**Pasos para activar:**
1. En Stripe Dashboard → Activar cuenta real
2. Reemplazar en `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. Configurar webhook de producción
4. Probar compra real (1€)

---

## 🚀 Próximos Pasos Prioritarios

### Sprint 1: Funcionalidad Core (1-2 días)

**Objetivo:** Completar el ciclo de compra

1. ⚡ **Implementar Webhook de Stripe** (4h)
   - Crear endpoint `/api/webhooks/stripe.ts`
   - Función SQL `decrement_stock`
   - Probar con Stripe CLI
   - Validar creación de pedidos

2. ⚡ **Sistema de Tracking** (3h)
   - Añadir campos `tracking_number`, `carrier` a `orders`
   - UI en `/admin/pedidos/[id]` para añadir tracking
   - Mostrar tracking en `/cuenta/pedidos`
   - Email automático de "Pedido enviado"

3. ⚡ **Notificación al Admin** (2h)
   - Email automático cuando hay nuevo pedido
   - Badge de "nuevos pedidos" en sidebar admin

---

### Sprint 2: UX/UI (2-3 días)

**Objetivo:** Mejorar experiencia visual

4. 🎨 **Mejoras de Catálogo** (4h)
   - Filtros de precio, talla, color
   - Animaciones hover en cards
   - Loading skeletons

5. 🎨 **Ficha de Producto** (3h)
   - Lightbox para imágenes
   - Productos relacionados
   - Guía de tallas modal

6. 🎨 **Dashboard Admin Mejorado** (3h)
   - Gráficas de ventas (Chart.js)
   - Top productos
   - Comparativas

---

### Sprint 3: Features Avanzadas (3-4 días)

**Objetivo:** Funcionalidades premium

7. 📊 **Sistema de Reseñas** (6h)
   - Tabla `reviews`
   - UI para dejar reseña
   - Mostrar en ficha de producto
   - Promedio de rating

8. 📱 **PWA** (4h)
   - Manifest.json
   - Service Worker
   - Offline mode
   - Install prompt

9. 🔍 **SEO Completo** (3h)
   - Meta tags dinámicos
   - Schema.org markup
   - Sitemap.xml
   - Open Graph

---

### Sprint 4: Producción (1-2 días)

**Objetivo:** Desplegar a producción

10. 🚀 **Preparación para Deploy** (4h)
    - Dockerfile
    - Variables de entorno de producción
    - Stripe en modo live
    - CDN para imágenes

11. 🚀 **Deploy en Coolify** (3h)
    - Configurar VPS
    - Domain y SSL
    - Monitoreo
    - Backups automáticos

---

## 📝 Checklist Final Antes de Producción

### Seguridad
- [ ] Todas las rutas admin protegidas con middleware
- [ ] RLS policies revisadas en Supabase
- [ ] API keys en variables de entorno (no en código)
- [ ] HTTPS activado (SSL)
- [ ] CORS configurado correctamente
- [ ] Rate limiting en APIs

### Performance
- [ ] Imágenes optimizadas (WebP)
- [ ] Lazy loading implementado
- [ ] Caché configurado (CDN)
- [ ] Lighthouse score > 90
- [ ] Time to Interactive < 3s

### Funcionalidad
- [ ] Webhook de Stripe funcionando
- [ ] Emails enviándose correctamente
- [ ] Stock descontándose tras compra
- [ ] Pedidos guardándose en BD
- [ ] Tracking de pedidos operativo

### Legal
- [ ] Política de privacidad
- [ ] Términos y condiciones
- [ ] Política de cookies
- [ ] Aviso legal
- [ ] Política de devoluciones

### SEO
- [ ] Meta tags configurados
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Schema.org markup
- [ ] Google Analytics

---

## 📞 Contacto y Recursos

### Enlaces Importantes
- **Repositorio:** https://github.com/JoseManuelOS/FashionStore
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Cloudinary Dashboard:** https://cloudinary.com/console

### Documentación Técnica
- Astro: https://docs.astro.build
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Tailwind: https://tailwindcss.com/docs

---

## 📊 Resumen de Progreso

```
███████████████████████████░░░ 90%

✅ Arquitectura base              100%
✅ Frontend público               95%
✅ Panel admin                    90%
✅ Sistema de pagos               85%
✅ Emails transaccionales         100%
⏳ Webhook & Stock                0%
⏳ Tracking de pedidos            0%
⏳ UX/UI avanzado                 60%
⏳ Deploy producción              0%
```

**Tiempo estimado para completar:**
- Funcionalidad crítica: **1-2 días**
- Mejoras UX/UI: **2-3 días**
- Features avanzadas: **3-4 días**
- Deploy: **1-2 días**

**Total:** **7-11 días de desarrollo**


---

*Documento generado el 13 de enero de 2026*  
*Proyecto: FashionMarket E-commerce*  
*Stack: Astro 5 + Supabase + Stripe + Tailwind CSS*
