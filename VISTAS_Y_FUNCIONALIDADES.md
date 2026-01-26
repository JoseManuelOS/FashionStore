# FashionStore - Documentación de Vistas y Funcionalidades

## 🏠 Área Pública

### 1. Página Principal (`/`)

**Archivo:** `index.astro`

#### Secciones:
| Sección | Descripción | Elementos Interactivos |
|---------|-------------|----------------------|
| Hero Carousel | Slider de imágenes promocionales | Flechas navegación, dots indicadores |
| Categorías | Grid de categorías con imagen | Click → `/categoria/[slug]` |
| Productos Destacados | Grid de 8 productos recientes | Click → `/productos/[slug]` |
| Features | 4 iconos de beneficios (envío, pagos, etc.) | - |
| CTA Banner | Llamada a acción visual | Botón → `/productos` |
| Ofertas | Grid de productos en oferta (si habilitado) | Click → `/productos/[slug]` |

#### Botones:
- `📍 Explorar` → Navega a `/productos`
- `📍 Ver colección` → Navega a categoría específica
- `📍 Comprar ahora` → Navega a `/ofertas`
- `📍 Ver Productos` → Navega a `/productos`
- `⬅️ / ➡️ Carousel` → Cambia slide del carrusel

---

### 2. Carrito (`/carrito`)

**Archivo:** `carrito.astro`

#### Estados:
1. **Loading** - Spinner mientras carga localStorage
2. **Vacío** - Mensaje + botón "Ver Productos"
3. **Con items** - Lista de productos + resumen

#### Elementos:
| Elemento | Función |
|----------|---------|
| Lista de Items | Muestra productos: imagen, nombre, talla, precio |
| Botón `×` | Elimina producto del carrito |
| Botones `+/-` | Aumenta/disminuye cantidad |
| Subtotal | Suma de precios × cantidades |
| Total | Subtotal + envío (gratis) |
| `Proceder al Pago` | Navega a `/checkout` |
| `Continuar comprando` | Navega a `/productos` |

#### Flujo de Datos:
```
localStorage("fashionmarket-cart") ←→ Estado del carrito
                                   ↓
                              Evento 'cart-updated' → Actualiza ícono header
```

---

### 3. Checkout (`/checkout`)

**Archivo:** `checkout/index.astro`

#### Stepper de 4 pasos:

| Paso | Nombre | Campos/Acciones |
|------|--------|-----------------|
| 1 | **Datos** | Email*, Teléfono*, Nombre*, Dirección*, CP*, Ciudad*, Provincia*, País* |
| 2 | **Envío** | Selección método envío (cargado desde DB) |
| 3 | **Descuento** | Input código + `Aplicar`, botón `Eliminar` |
| 4 | **Resumen** | Vista resumen + `Pagar Ahora` |

#### Botones por Paso:
- `Volver al Carrito` (Paso 1)
- `Atrás` / `Continuar` (Pasos 2-3)
- `Atrás` / `Pagar Ahora` (Paso 4)
- `Editar` / `Cambiar` - Vuelve al paso correspondiente

#### Funcionalidades:
- ✅ Direcciones guardadas (usuarios logueados)
- ✅ Validación de campos obligatorios
- ✅ Código de descuento (porcentaje o fijo)
- ✅ Integración con Stripe

---

### 4. Productos (`/productos`)

**Archivo:** `productos/index.astro`

#### Elementos:
| Elemento | Función |
|----------|---------|
| `FilterSidebar` | Filtros: categoría, precio, talla, ofertas |
| Grid de Productos | Cards con imagen, nombre, precio |
| Badges | "Oferta", "Nuevo" |
| `Quick View` | Hover → botón "Vista rápida" |

---

### 5. Detalle de Producto (`/productos/[slug]`)

**Archivo:** `productos/[slug].astro`

#### Secciones:
| Sección | Elementos |
|---------|-----------|
| Galería | Imagen principal + thumbnails |
| Info | Nombre, precio (original/oferta), descripción |
| Selector Talla | Botones S/M/L/XL/XXL |
| SizeRecommender | Recomendador inteligente de talla |
| Stock | Disponibilidad por talla |
| Botón | `Añadir al carrito` |
| Productos Relacionados | Grid de sugerencias |

#### Componentes React:
- `AddToCartButton.tsx` - Lógica de añadir al carrito
- `SizeRecommender.tsx` - Recomendador de tallas

---

### 6. Ofertas (`/ofertas`)

**Archivo:** `ofertas.astro`

- Grid de productos con `is_offer = true`
- Mismo layout que productos

---

## 🔐 Autenticación

### 7. Login (`/auth/login`)

**Archivo:** `auth/login.astro`

#### Campos:
- Email*
- Contraseña* (con toggle visibilidad 👁️)
- Checkbox "Recorárme"

#### Botones:
| Botón | Acción |
|-------|--------|
| `Iniciar sesión` | Login con email/password |
| `Google` | OAuth con Google |
| `¿Olvidaste tu contraseña?` | → `/auth/recuperar` |
| `Regístrate gratis` | → `/auth/registro` |

---

### 8. Registro (`/auth/registro`)

**Archivo:** `auth/registro.astro`

#### Campos:
- Nombre completo*
- Email*
- Contraseña* (con requisitos de seguridad)
- Confirmar contraseña*

#### Botones:
| Botón | Acción |
|-------|--------|
| `Crear cuenta` | Registro con email/password |
| `Google` | OAuth con Google |
| `Inicia sesión` | → `/auth/login` |

---

### 9. Recuperar Contraseña (`/auth/recuperar`)

**Archivo:** `auth/recuperar.astro`

- Campo: Email*
- Botón: `Enviar enlace de recuperación`
- Link: `Volver al login`

---

### 10. Nueva Contraseña (`/auth/nueva-contrasena`)

**Archivo:** `auth/nueva-contrasena.astro`

- Campo: Nueva contraseña*
- Campo: Confirmar contraseña*
- Botón: `Guardar nueva contraseña`

---

## 👤 Área de Usuario

### 11. Mi Perfil (`/cuenta`)

**Archivo:** `cuenta/index.astro`

#### Sidebar:
- Avatar + nombre + email
- Link activo: Mi Perfil
- Link: Mis Pedidos
- Link: Favoritos

#### Secciones:
| Sección | Campos/Acciones |
|---------|-----------------|
| **Información Personal** | Nombre, Email (solo lectura), Teléfono |
| **Direcciones de Envío** | Lista de direcciones guardadas |
| **Sesión** | Botón `Cerrar sesión` |

#### Botones Direcciones:
- `Nueva dirección` → Abre formulario
- `✏️ Editar` → Edita dirección
- `✓ Predeterminada` → Marca como default
- `🗑️ Eliminar` → Elimina dirección
- `Cancelar` / `Guardar dirección` → Formulario

#### Formulario Dirección:
- Etiqueta*, Nombre*, Teléfono, Calle*, Ciudad*, CP*, Provincia*, País*
- Checkbox: "Usar como dirección predeterminada"

---

### 12. Mis Pedidos (`/cuenta/pedidos`)

**Archivo:** `cuenta/pedidos.astro`

#### Lista de Pedidos:
| Columna | Descripción |
|---------|-------------|
| Nº Pedido | ID del pedido |
| Fecha | Fecha de compra |
| Estado | pending/processing/shipped/delivered/cancelled |
| Items | Lista resumida de productos |
| Total | Monto total |

#### Botones:
- `Ver detalles` → Modal con detalle completo
- `Solicitar devolución` → Inicia proceso de devolución

---

### 13. Favoritos (`/cuenta/favoritos`)

**Archivo:** `cuenta/favoritos.astro`

- Grid de productos favoritos
- Cada card: imagen, nombre, precio, botón `❤️` para eliminar
- Botón `Añadir al carrito` en cada producto

---

## ⚙️ Panel de Administración

### 14. Dashboard (`/admin/dashboard`)

**Archivo:** `admin/dashboard.astro`

#### Stats Cards:
| Card | Valor |
|------|-------|
| Productos Activos | Total de productos con `active = true` |
| Unidades en Stock | Suma de stock de todos los productos |
| Stock Bajo (≤5) | Productos con stock crítico |
| Pedidos Pendientes | Pedidos con `status = pending` |

#### Acciones Rápidas:
- `Nuevo Producto` → `/admin/productos/nuevo`
- `Ver Inventario` → `/admin/productos`
- `Ver Tienda` → `/` (nueva pestaña)

#### Productos Recientes:
- Lista de 5 últimos productos con imagen, nombre, stock, precio
- Link `Ver todos →` → `/admin/productos`

---

### 15. Productos Admin (`/admin/productos`)

**Archivo:** `admin/productos/index.astro`

#### Tabla:
| Columna | Descripción |
|---------|-------------|
| Imagen | Thumbnail del producto |
| Nombre | Nombre + badge oferta |
| Categoría | Nombre de categoría |
| Precio | Precio normal / oferta |
| Stock | Cantidad disponible |
| Estado | Activo/Inactivo |
| Acciones | Editar, Eliminar |

#### Botones:
- `+ Nuevo Producto` → `/admin/productos/nuevo`
- `🔍 Búsqueda` → Filtra tabla
- `📝 Editar` → `/admin/productos/[id]`
- `🗑️ Eliminar` → Confirmación + eliminación

---

### 16. Nuevo/Editar Producto (`/admin/productos/nuevo`, `/admin/productos/[id]`)

**Archivos:** `productos/nuevo.astro`, `productos/[id].astro`

#### Campos:
| Campo | Tipo | Validación |
|-------|------|------------|
| Nombre* | text | Requerido |
| Slug | text | Auto-generado |
| Descripción | textarea | - |
| Categoría* | select | Requerido |
| Precio* | number | > 0 |
| Es Oferta | checkbox | - |
| Precio Oferta | number | Requerido si es oferta |
| Tallas | checkboxes | Al menos una |
| Stock* | number | ≥ 0 |
| Activo | toggle | - |

#### Componentes:
- `ProductImagesUploader.tsx` - Subida múltiple de imágenes con drag & drop
- `ImageUploader.tsx` - Upload a Cloudinary

#### Botones:
- `Guardar Producto` → Crea/actualiza producto
- `Cancelar` → Vuelve a lista

---

### 17. Pedidos Admin (`/admin/pedidos`)

**Archivo:** `admin/pedidos/index.astro`

#### Tabla:
| Columna | Descripción |
|---------|-------------|
| Nº Pedido | ID autoincremental |
| Cliente | Nombre del cliente |
| Email | Email de contacto |
| Fecha | Fecha del pedido |
| Total | Monto total |
| Estado | Selector de estado |
| Acciones | Ver detalle |

#### Estados:
- `pending` - Pendiente (amarillo)
- `processing` - Procesando (azul)
- `shipped` - Enviado (cian)
- `delivered` - Entregado (verde)
- `cancelled` - Cancelado (rojo)

---

### 18. Detalle Pedido (`/admin/pedidos/[id]`)

**Archivo:** `admin/pedidos/[id].astro`

#### Secciones:
| Sección | Información |
|---------|-------------|
| Info Pedido | ID, fecha, estado (editable) |
| Cliente | Nombre, email, teléfono |
| Dirección | Dirección de envío completa |
| Productos | Lista con imagen, nombre, talla, cantidad, precio |
| Totales | Subtotal, descuento, envío, total |
| Tracking | Campo para número de seguimiento |

#### Botones:
- `Actualizar Estado` → Cambia estado + notifica cliente
- `Guardar Tracking` → Guarda número de seguimiento
- `Ver Factura` → `/admin/facturas/[id]`
- `Cancelar Pedido` → Confirmación + cancelación

---

### 19. Usuarios Admin (`/admin/usuarios`)

**Archivo:** `admin/usuarios/index.astro`

#### Tabla:
| Columna | Descripción |
|---------|-------------|
| Avatar | Inicial o imagen |
| Nombre | Nombre completo |
| Email | Correo electrónico |
| Teléfono | Número de contacto |
| Pedidos | Cantidad de pedidos |
| Registro | Fecha de registro |

---

### 20. Carrusel Admin (`/admin/carrusel`)

**Archivos:** `carrusel/index.astro`, `carrusel/nuevo.astro`, `carrusel/[id].astro`

#### Lista de Slides:
- Preview de imagen
- Título y subtítulo
- Orden (drag & drop)
- Estado activo/inactivo
- Botones: Editar, Eliminar

#### Formulario Slide:
| Campo | Tipo |
|-------|------|
| Imagen* | Upload con preview |
| Título* | text |
| Subtítulo | text |
| Descripción | textarea |
| Texto CTA | text |
| Link CTA | text |
| Código Descuento | text |
| Duración (ms) | number |
| Orden | number |
| Activo | toggle |
| **Estilos Desktop/Mobile** | Posición y formato de elementos |

#### Componente:
- `CarouselImageUploader.tsx` - Upload de imagen del slide

---

### 21. Códigos de Descuento (`/admin/codigos`)

**Archivo:** `admin/codigos.astro`

#### Tabla:
| Columna | Descripción |
|---------|-------------|
| Código | Texto del código |
| Tipo | Porcentaje o Fijo |
| Valor | Cantidad de descuento |
| Usos | Usados / Límite |
| Válido Desde/Hasta | Rango de fechas |
| Estado | Activo/Inactivo |

#### Botones:
- `+ Nuevo Código` → Modal de creación
- `📝 Editar` → Modal de edición
- `🗑️ Eliminar` → Confirmación

#### Campos Formulario:
- Código*, Descripción, Tipo*, Valor*, Min compra, Límite usos, Fecha inicio, Fecha fin, Activo

---

### 22. Comunicaciones (`/admin/comunicaciones`)

**Archivo:** `admin/comunicaciones.astro`

#### Secciones:
- **Email Marketing** - Envío masivo a clientes
- **Notificaciones** - Configuración de emails automáticos
- **Templates** - Previews de plantillas de email

#### Tipos de Email:
- Confirmación de pedido
- Pedido enviado
- Bienvenida
- Recuperar contraseña
- Alerta stock bajo (admin)
- Nuevo pedido (admin)

---

### 23. Dashboard Ejecutivo (`/admin/dashboard-ejecutivo`)

**Archivo:** `admin/dashboard-ejecutivo.astro`

#### Gráficos y Métricas:
- Ventas del mes (gráfico)
- Productos más vendidos
- Clientes nuevos
- Tasa de conversión
- Valor medio de pedido

#### Componente:
- `SalesChart.tsx` - Gráfico de ventas con Chart.js

---

## 🧩 Componentes React (Islands)

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `CartIcon.tsx` | Header | Muestra contador de items en carrito |
| `CartSlideOver.tsx` | Header | Panel lateral del carrito |
| `UserMenu.tsx` | Header | Menú desplegable de usuario |
| `AddToCartButton.tsx` | Detalle producto | Lógica de añadir al carrito |
| `SizeRecommender.tsx` | Detalle producto | Recomendador de tallas |
| `FilterSidebar.tsx` | Productos | Filtros de búsqueda |
| `ProductCard.tsx` | Grids | Card de producto reutilizable |
| `ImageUploader.tsx` | Admin | Upload de imágenes |
| `ProductImagesUploader.tsx` | Admin | Upload múltiple |
| `CarouselImageUploader.tsx` | Admin | Upload para carrusel |
| `SalesChart.tsx` | Dashboard | Gráfico de ventas |

---

## 🔄 Flujos Principales

### Flujo de Compra
```
Home/Productos → Detalle Producto → Añadir al Carrito → Carrito
       ↓
   Checkout (4 pasos) → Pago Stripe → Success → Historial Pedidos
```

### Flujo de Usuario
```
Registro/Login → Perfil → Direcciones → Pedidos → Favoritos
       ↑                                              ↓
       └──────────────── Cerrar sesión ←─────────────┘
```

### Flujo Admin
```
Login Admin → Dashboard → Productos CRUD
                       → Pedidos (gestión estados)
                       → Usuarios (visualización)
                       → Carrusel (gestión slides)
                       → Códigos (descuentos)
                       → Comunicaciones (emails)
```

---

## 📱 Responsive

Todas las vistas son **responsive** con breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🔧 Tecnologías

- **Framework:** Astro (SSR/SSG híbrido)
- **Islands:** React + TypeScript
- **Estilos:** Tailwind CSS + CSS custom
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth (Email + Google OAuth)
- **Almacenamiento:** Cloudinary (imágenes)
- **Pagos:** Stripe
