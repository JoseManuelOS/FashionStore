# 🔗 Configuración del Webhook de Stripe

Este documento explica cómo configurar el webhook de Stripe para que los pedidos se creen automáticamente cuando un cliente completa el pago.

## ⚠️ Importante

El webhook es **CRÍTICO** para el funcionamiento correcto de la tienda:
- Sin webhook, los pedidos NO se guardan en la base de datos
- Sin webhook, los clientes NO reciben el email de confirmación
- Sin webhook, NO puedes gestionar los pedidos en el panel de admin

---

## 📋 Pasos de Configuración

### 1. Crear el Webhook en Stripe Dashboard

1. Ve a [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click en **"Add endpoint"**
3. Configura el endpoint:
   - **URL del endpoint:** `https://tu-dominio.com/api/webhooks/stripe`
   - **Versión de API:** Dejar por defecto
   - **Eventos a escuchar:** Selecciona:
     - `checkout.session.completed`
4. Click en **"Add endpoint"**

### 2. Obtener el Webhook Secret

1. Una vez creado, haz click en el webhook
2. En la sección **"Signing secret"**, click en **"Reveal"**
3. Copia el valor que empieza con `whsec_...`

### 3. Añadir Variable de Entorno

Añade la siguiente variable a tu archivo `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 4. Para Desarrollo Local (con Stripe CLI)

Para probar webhooks localmente:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Autenticarse
stripe login

# Escuchar webhooks y reenviar a localhost
stripe listen --forward-to localhost:4321/api/webhooks/stripe

# Esto te dará un webhook secret temporal para desarrollo
# Añádelo a tu .env local
```

---

## 🧪 Probar el Webhook

### Desde Stripe Dashboard

1. Ve al webhook creado
2. Click en **"Send test webhook"**
3. Selecciona `checkout.session.completed`
4. Click en **"Send test webhook"**

### Desde Terminal (con Stripe CLI)

```bash
stripe trigger checkout.session.completed
```

---

## 🔄 Flujo Completo

```
Cliente completa pago en Stripe
        ↓
Stripe envía evento checkout.session.completed
        ↓
Webhook /api/webhooks/stripe recibe el evento
        ↓
Se crea el pedido en Supabase con estado "paid"
        ↓
Se envía email de confirmación al cliente
        ↓
El pedido aparece en el panel de admin
```

---

## 📦 Panel de Administración

Una vez configurado el webhook, los pedidos aparecerán automáticamente en:
- **URL:** `/admin/pedidos`

Desde ahí puedes:
1. Ver todos los pedidos
2. Click en un pedido para ver detalles
3. **Actualizar estado** (Pendiente → Pagado → Enviado → Entregado)
4. **Añadir información de envío:**
   - Seleccionar empresa transportista (SEUR, MRW, Correos, GLS, UPS, DHL, etc.)
   - Introducir código de seguimiento
   - Se genera automáticamente la URL de tracking
   - Marcar como enviado → el cliente recibe email con código de seguimiento

---

## 🔧 Troubleshooting

### El webhook no funciona

1. Verifica que `STRIPE_WEBHOOK_SECRET` está configurado
2. Verifica que la URL del webhook es correcta
3. Revisa los logs en Stripe Dashboard → Webhooks → Logs

### Los pedidos no se crean

1. Verifica que la firma del webhook es correcta
2. Revisa los logs del servidor
3. Asegúrate de que tienes permisos de escritura en Supabase

### Los emails no se envían

1. Verifica que `RESEND_API_KEY` está configurado
2. Revisa los logs de Resend

---

## 🗃️ Migración de Base de Datos

Para añadir los campos de envío a la tabla de orders, ejecuta:

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/orders-shipping-migration.sql
```

O copia y pega el contenido del archivo `supabase/orders-shipping-migration.sql` en el SQL Editor de Supabase.
