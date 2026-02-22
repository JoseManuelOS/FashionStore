# FashionMarket — Diagrama Entidad-Relación y Documentación de Base de Datos

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    categories {
        UUID id PK
        TEXT name
        TEXT slug UK
        TIMESTAMPTZ created_at
    }

    products {
        UUID id PK
        TEXT name
        TEXT slug UK
        TEXT description
        NUMERIC price
        INTEGER stock
        UUID category_id FK
        BOOLEAN is_offer
        TEXT_ARRAY sizes
        BOOLEAN active
        NUMERIC original_price
        INTEGER discount_percent
        JSONB colors
        TIMESTAMPTZ created_at
    }

    product_images {
        UUID id PK
        UUID product_id FK
        TEXT image_url
        INTEGER order
        VARCHAR color
        VARCHAR color_hex
        TIMESTAMPTZ created_at
    }

    product_variants {
        UUID id PK
        UUID product_id FK
        VARCHAR size
        VARCHAR color
        INTEGER stock
        VARCHAR sku
        NUMERIC price
        BOOLEAN is_offer
        TIMESTAMPTZ created_at
    }

    tags {
        UUID id PK
        VARCHAR name UK
        VARCHAR slug UK
        VARCHAR type
    }

    product_tags {
        UUID product_id PK_FK
        UUID tag_id PK_FK
    }

    customers {
        UUID id PK_FK
        TEXT email UK
        TEXT full_name
        TEXT phone
        TEXT avatar_url
        JSONB default_address
        BOOLEAN newsletter
        TIMESTAMPTZ created_at
    }

    customer_addresses {
        UUID id PK
        UUID customer_id FK
        TEXT label
        TEXT street
        TEXT city
        TEXT postal_code
        TEXT province
        BOOLEAN is_default
    }

    customer_favorites {
        UUID id PK
        UUID customer_id FK
        UUID product_id FK
        TIMESTAMPTZ created_at
    }

    orders {
        SERIAL id PK
        BIGINT order_number
        NUMERIC total_price
        TEXT status
        TEXT customer_email
        TEXT customer_name
        TEXT shipping_address
        INTEGER shipping_method_id FK
        UUID customer_id FK
        TEXT stripe_session_id
        TEXT tracking_number
        TEXT tracking_url
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    order_items {
        SERIAL id PK
        INTEGER order_id FK
        UUID product_id FK
        TEXT product_name
        INTEGER quantity
        TEXT size
        VARCHAR color
        NUMERIC price_at_purchase
        TIMESTAMPTZ created_at
    }

    facturacion {
        SERIAL id PK
        INTEGER order_id FK
        TIMESTAMPTZ created_at
    }

    shipping_methods {
        SERIAL id PK
        TEXT name
        TEXT description
        NUMERIC price
        TEXT estimated_days
        BOOLEAN is_active
    }

    discount_codes {
        UUID id PK
        VARCHAR code UK
        TEXT description
        VARCHAR discount_type
        NUMERIC discount_value
        NUMERIC min_purchase
        NUMERIC max_discount
        INTEGER usage_limit
        INTEGER times_used
        BOOLEAN single_use_per_customer
        TIMESTAMPTZ starts_at
        TIMESTAMPTZ expires_at
        BOOLEAN active
    }

    discount_code_usage {
        UUID id PK
        UUID discount_code_id FK
        TEXT customer_email
        UUID order_id FK
        TIMESTAMPTZ used_at
    }

    admins {
        UUID id PK
        TEXT email UK
        TEXT password_hash
        TEXT name
        TEXT role
        TIMESTAMPTZ created_at
    }

    admin_activity_log {
        UUID id PK
        UUID admin_id FK
        TEXT action
        JSONB details
        TIMESTAMPTZ created_at
    }

    carousel_slides {
        UUID id PK
        TEXT title
        TEXT subtitle
        TEXT description
        TEXT image_url
        TEXT mobile_image_url
        TEXT cta_text
        TEXT cta_link
        INTEGER display_order
        BOOLEAN active
        JSONB style_config
    }

    settings {
        TEXT key PK
        JSONB value
        TEXT description
    }

    newsletter_subscribers {
        UUID id PK
        TEXT email UK
        BOOLEAN active
        TIMESTAMPTZ created_at
    }

    %% ========== RELACIONES ==========

    categories ||--o{ products : "tiene"
    products ||--o{ product_images : "tiene"
    products ||--o{ product_variants : "variantes"
    products ||--o{ product_tags : "etiquetado"
    tags ||--o{ product_tags : "etiquetado"
    products ||--o{ order_items : "vendido_en"
    products ||--o{ customer_favorites : "favorito_de"
    customers ||--o{ customer_favorites : "marca_favorito"
    customers ||--o{ customer_addresses : "tiene_direcciones"
    customers ||--o{ orders : "realiza"
    orders ||--o{ order_items : "contiene"
    orders ||--o{ facturacion : "genera_factura"
    orders }o--|| shipping_methods : "usa_envío"
    discount_codes ||--o{ discount_code_usage : "usado_en"
    orders ||--o{ discount_code_usage : "aplica_descuento"
    admins ||--o{ admin_activity_log : "registra"
```

---

## Resumen de Tablas (18 tablas)

| Tabla | Descripción | Relaciones principales |
|---|---|---|
| **categories** | Categorías de productos (Camisas, Pantalones, etc.) | 1:N → products |
| **products** | Catálogo de productos con precio, stock, tallas | N:1 → categories, 1:N → images, variants, tags |
| **product_images** | Imágenes del producto (Cloudinary) con color asociado | N:1 → products |
| **product_variants** | Stock por (talla, color) — granularidad fina | N:1 → products |
| **tags** | Etiquetas (color, estilo, material) | N:M → products via product_tags |
| **product_tags** | Tabla pivote productos ↔ etiquetas | N:1 → products, N:1 → tags |
| **customers** | Perfiles de clientes (vinculados a auth.users) | 1:N → orders, favorites, addresses |
| **customer_addresses** | Direcciones de envío del cliente | N:1 → customers |
| **customer_favorites** | Productos favoritos por cliente | N:1 → customers, N:1 → products |
| **orders** | Pedidos con estado, tracking, Stripe session | N:1 → customers, shipping_methods — 1:N → order_items, facturacion |
| **order_items** | Líneas de pedido (producto, talla, color, precio) | N:1 → orders, N:1 → products |
| **facturacion** | Registro de facturas generadas | N:1 → orders |
| **shipping_methods** | Métodos de envío (Estándar, Express) | 1:N → orders |
| **discount_codes** | Códigos promocionales (% o fijo) | 1:N → discount_code_usage |
| **discount_code_usage** | Registro de uso de códigos por cliente | N:1 → discount_codes, N:1 → orders |
| **admins** | Administradores con hash bcrypt | 1:N → admin_activity_log |
| **admin_activity_log** | Log de acciones del admin | N:1 → admins |
| **carousel_slides** | Slides del carrusel hero con posicionamiento responsive | Independiente |
| **settings** | Configuración global (clave-valor JSONB) | Independiente |

---

## Funciones y Procedimientos SQL

| Función | Tipo | Descripción |
|---|---|---|
| `cancel_order_with_stock_restore(order_id)` | Procedimiento atómico | Cancela pedido, restaura stock por (producto, talla, color), cambia estado. Usa `FOR UPDATE` para evitar race conditions. |
| `decrement_variant_stock(p_product_id, p_size, p_qty, p_color)` | Función stock | Decrementa stock con verificación CHECK >= 0. Usada por webhook de Stripe. |
| `increment_variant_stock(p_product_id, p_size, p_qty, p_color)` | Función stock | Incrementa stock. Usada en cancelaciones/devoluciones. |
| `get_monthly_sales()` | KPI (RPC) | SUM(total_price) del mes actual para pedidos válidos. |
| `get_top_product()` | KPI (RPC) | Producto con mayor SUM(quantity) en pedidos válidos. |
| `get_last_7_days_sales()` | KPI (RPC) | Ventas agrupadas por día (últimos 7 días con generate_series). |
| `get_low_stock_count()` | KPI (RPC) | COUNT(DISTINCT product_id) con alguna variante stock ≤ 5. |

---

## Flujo de Facturación

```
Cliente → Checkout (Stripe) → Webhook recibe payment_intent.succeeded
  ↓
Stripe webhook:
  1. Crea registro en orders (status='paid')
  2. Inserta order_items con producto, talla, color, precio
  3. Decrementa stock en product_variants (atómico)
  4. Envía email de confirmación al cliente (Resend)
  5. Envía notificación al admin (Resend)
  ↓
Admin → Panel de pedidos:
  - Ver pedido → Generar factura PDF (jsPDF)
  - Registro en tabla facturacion
  - Marcar como enviado (status='shipped', tracking)
  - Enviar email de actualización al cliente
  ↓
Cancelación:
  - cancel_order_with_stock_restore(order_id)
  - Restaura stock por (producto, talla, color)
  - Reembolso vía Stripe API
  - Email de cancelación al cliente
  - Genera nota de crédito PDF
```

---

## Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** habilitado:

- **Datos públicos** (products, categories, images, tags): Lectura para `anon` y `authenticated`
- **Datos privados** (orders, order_items, customers): Solo acceso con `service_role` o admin autenticado
- **Admin** (admins, admin_activity_log): Solo `service_role`
- **Operaciones de escritura**: Controladas por políticas específicas por tabla y rol

El cliente usa **dos instancias de Supabase**:
- `supabase` (clave anon) → consultas públicas desde el cliente
- `supabaseAdmin` (service_role) → operaciones del servidor (API routes, webhooks, admin)
