# Documentación de Plantillas de Email - FashionMarket

## Resumen del Sistema de Emails

Se han estandarizado todas las plantillas de email de la plataforma FashionMarket siguiendo la identidad visual corporativa.

### Colores Corporativos Aplicados
- **Color Primario (CTA):** #06b6d4 (Cyan)
- **Color Acento:** #d946ef (Fuchsia)  
- **Fondo Oscuro:** #0a0a0f
- **Gradiente Botón:** linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)

---

## 1. Newsletter de Bienvenida

**Flujo:** Usuario se suscribe al newsletter → Recibe email de bienvenida con código de descuento

**Características:**
- Código promocional WELCOME10 destacado
- Botón CTA "Explorar Colección"
- Lista de beneficios de suscriptor

![Newsletter Bienvenida](/Users/copito/Desktop/FashionStore/email-previews/screenshots/01-newsletter-welcome.png)

---

## 2. Confirmación de Pedido

**Flujo:** Cliente completa checkout → Recibe confirmación inmediata

**Características:**
- Tema oscuro premium
- Indicador visual de estado del pedido (4 pasos)
- Desglose detallado de productos y precios
- Botón "Ver mi pedido"

![Confirmación de Pedido](/Users/copito/Desktop/FashionStore/email-previews/screenshots/02-order-confirmation.png)

---

## 3. Pedido Cancelado

**Flujo:** Cliente solicita cancelación → Sistema cancela y envía confirmación

**Características:**
- Header rojo indicando cancelación
- Resumen del pedido cancelado
- Información sobre reembolso (5-10 días hábiles)
- Botón "Seguir comprando"

![Pedido Cancelado](/Users/copito/Desktop/FashionStore/email-previews/screenshots/03-order-cancelled.png)

---

## 4. Solicitud de Devolución

**Flujo:** Cliente solicita devolución desde su cuenta → Recibe instrucciones

**Características:**
- Header con color acento (fuchsia)
- Instrucciones de envío con dirección
- Información importante sobre condiciones
- Detalles del proceso de reembolso

![Solicitud de Devolución](/Users/copito/Desktop/FashionStore/email-previews/screenshots/04-return-request.png)

---

## 5. Actualización de Envío

**Flujo:** Pedido es enviado → Cliente recibe notificación con tracking

**Características:**
- Tema oscuro premium
- Información del transportista y código de seguimiento
- Indicador visual de progreso (4 pasos, 3 completados)
- Botón "Rastrear mi pedido"
- Tiempo estimado de entrega

![Actualización de Envío](/Users/copito/Desktop/FashionStore/email-previews/screenshots/05-shipping-update.png)

---

## Panel de Administración - Newsletter

El panel de admin permite enviar newsletters personalizados con:

- **Título del Header** - Personalizable
- **URL de Imagen** - Imagen promocional
- **Contenido** - Texto del mensaje
- **Código Promocional** - Con descripción del descuento
- **Botón de Acción** - Texto y URL personalizables

---

## Notas Técnicas

- Todos los emails usan **estilos inline** para máxima compatibilidad
- Sin emojis - tono corporativo profesional
- Iconos SVG en lugar de imágenes externas
- Footer oscuro con enlace de cancelar suscripción
- Responsive design (max-width: 600px)

---

*Documentación generada el 19 de Enero de 2026*
