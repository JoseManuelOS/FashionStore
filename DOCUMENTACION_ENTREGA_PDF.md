<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

@page {
  size: A4;
  margin: 25mm 20mm 25mm 20mm;
}

body {
  font-family: 'Inter', sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: #27272a;
  background: #ffffff;
}

/* ── PORTADA ── */
.cover {
  page-break-after: always;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  background: #0a0a0f;
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(6,182,212,0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(217,70,239,0.08) 0%, transparent 60%);
  margin: -25mm -20mm;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;
}

.cover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #06b6d4, #d946ef);
}

.cover-badge {
  display: inline-block;
  padding: 8px 24px;
  border: 1px solid rgba(6,182,212,0.5);
  border-radius: 50px;
  color: #06b6d4;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11pt;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 40px;
  backdrop-filter: blur(8px);
  background: rgba(6,182,212,0.06);
}

.cover h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 52pt;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
  line-height: 1.1;
}

.cover h1 .accent {
  color: #06b6d4;
}

.cover h2 {
  font-family: 'Inter', sans-serif;
  font-size: 14pt;
  font-weight: 300;
  color: #a1a1aa;
  margin: 0 0 40px 0;
  letter-spacing: 1px;
}

.cover-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  border-radius: 2px;
  margin: 0 auto 40px auto;
}

.cover-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 460px;
  width: 100%;
}

.cover-meta-item {
  text-align: center;
  padding: 14px 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
}

.cover-meta-label {
  display: block;
  font-size: 8pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #06b6d4;
  margin-bottom: 4px;
}

.cover-meta-value {
  display: block;
  font-size: 11pt;
  color: #e4e4e7;
  font-weight: 500;
}

/* ── ÍNDICE ── */
.toc {
  page-break-after: always;
  padding: 40px 0;
}

.toc-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22pt;
  font-weight: 700;
  color: #0a0a0f;
  text-align: center;
  margin-bottom: 36px;
  position: relative;
}

.toc-title::after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  margin: 12px auto 0;
  border-radius: 2px;
}

.toc ol {
  list-style: none;
  padding: 0;
  max-width: 480px;
  margin: 0 auto;
}

.toc ol li {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e4e4e7;
  font-size: 11pt;
  color: #27272a;
}

.toc ol li span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #ffffff;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 9pt;
  font-weight: 700;
  margin-right: 16px;
  flex-shrink: 0;
}

/* ── CONTENIDO ── */
.content h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18pt;
  font-weight: 700;
  color: #0a0a0f;
  margin: 40px 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #06b6d4;
}

.content h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13pt;
  font-weight: 600;
  color: #18181b;
  margin: 24px 0 10px 0;
}

.content p {
  margin: 10px 0;
  text-align: justify;
}

.content ul, .content ol {
  margin: 10px 0;
  padding-left: 24px;
}

.content li {
  margin: 5px 0;
}

/* ── TABLAS ── */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 10pt;
}

thead {
  background: #0a0a0f;
}

thead th {
  color: #ffffff;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  padding: 10px 14px;
  text-align: left;
}

tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #e4e4e7;
  vertical-align: top;
}

tbody tr:nth-child(even) {
  background: #f8fafc;
}

/* ── CAJAS INFORMATIVAS ── */
.info-box {
  background: #f0fdfa;
  border-left: 4px solid #06b6d4;
  padding: 14px 18px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
  font-size: 10pt;
}

.warn-box {
  background: #fdf4ff;
  border-left: 4px solid #d946ef;
  padding: 14px 18px;
  border-radius: 0 8px 8px 0;
  margin: 16px 0;
  font-size: 10pt;
}

/* ── BADGES de API ── */
.api-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-family: 'Space Grotesk', monospace;
  font-size: 9pt;
  font-weight: 700;
  color: #ffffff;
}

.api-get { background: #0891b2; }
.api-post { background: #059669; }
.api-put { background: #d97706; }
.api-delete { background: #dc2626; }

/* ── FLUJO DE ESTADOS ── */
.flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 14px 0;
}

.flow .step {
  display: inline-block;
  padding: 5px 14px;
  background: #0a0a0f;
  color: #06b6d4;
  border: 1px solid rgba(6,182,212,0.3);
  border-radius: 20px;
  font-size: 9pt;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
}

.flow .arrow {
  color: #d946ef;
  font-size: 14pt;
  font-weight: 700;
}

/* ── GRID DE TECNOLOGÍAS ── */
.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
}

.tech-card {
  padding: 14px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fafafa;
}

.tech-card strong {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  color: #0a0a0f;
  margin-bottom: 4px;
}

.tech-card span {
  font-size: 9.5pt;
  color: #52525b;
}

/* ── CHECKLIST ── */
.checklist {
  list-style: none;
  padding: 0;
}

.checklist li {
  padding: 8px 0;
  border-bottom: 1px solid #f4f4f5;
  font-size: 10.5pt;
}

.checklist li::before {
  content: '✓';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #ffffff;
  border-radius: 6px;
  font-size: 11pt;
  font-weight: 700;
  margin-right: 10px;
  vertical-align: middle;
}

/* ── PIE DE PÁGINA ── */
.doc-footer {
  margin-top: 50px;
  padding: 30px 0 0 0;
  border-top: 3px solid;
  border-image: linear-gradient(to right, #06b6d4, #d946ef) 1;
  text-align: center;
}

.doc-footer p {
  font-size: 9pt;
  color: #71717a;
  text-align: center;
}

hr {
  border: none;
  height: 1px;
  background: #e4e4e7;
  margin: 30px 0;
}
</style>

<!-- PORTADA -->
<div class="cover">
  <div class="cover-badge">Proyecto Final · 2026</div>
  <h1>Fashion<span class="accent">Market</span></h1>
  <h2>Tienda Online de Moda Masculina Premium</h2>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <span class="cover-meta-label">Alumno</span>
      <span class="cover-meta-value">Jose Manuel Ortega Soto</span>
    </div>
    <div class="cover-meta-item">
      <span class="cover-meta-label">Asignatura</span>
      <span class="cover-meta-value">Sistema de Gestión Empresarial</span>
    </div>
    <div class="cover-meta-item">
      <span class="cover-meta-label">Profesor</span>
      <span class="cover-meta-value">David Soto</span>
    </div>
    <div class="cover-meta-item">
      <span class="cover-meta-label">Centro</span>
      <span class="cover-meta-value">Victoriafp</span>
    </div>
    <div class="cover-meta-item" style="grid-column: 1 / -1;">
      <span class="cover-meta-label">Fecha de entrega</span>
      <span class="cover-meta-value">22 de febrero de 2026</span>
    </div>
  </div>
</div>

<div class="content">

<div class="toc">
  <div class="toc-title">Índice de contenidos</div>
  <ol>
    <li><span>01</span> Resumen ejecutivo</li>
    <li><span>02</span> Objetivo del proyecto</li>
    <li><span>03</span> Problema que resuelve</li>
    <li><span>04</span> Público objetivo</li>
    <li><span>05</span> Descripción general</li>
    <li><span>06</span> Funcionalidades principales</li>
    <li><span>07</span> Flujo de compra del cliente</li>
    <li><span>08</span> Pedidos, devoluciones y facturación</li>
    <li><span>09</span> Panel de administración</li>
    <li><span>10</span> Seguridad y confianza</li>
    <li><span>11</span> Arquitectura y tecnologías</li>
    <li><span>12</span> Integraciones externas</li>
    <li><span>13</span> APIs implementadas</li>
    <li><span>14</span> Estado actual y operación</li>
    <li><span>15</span> Impacto y beneficios</li>
    <li><span>16</span> Mejoras futuras</li>
    <li><span>17</span> Conclusión</li>
    <li><span>18</span> Checklist de entrega</li>
  </ol>
</div>

<!-- ═══════════════════════════ SECCIÓN 1 ═══════════════════════════ -->

<h2>1. Resumen ejecutivo</h2>

<p>FashionMarket es una plataforma de comercio electrónico especializada en moda masculina premium. Proporciona a los clientes una experiencia de compra rápida, visual y segura: desde la exploración del catálogo hasta el pago online, pasando por filtros inteligentes, carrito en tiempo real y seguimiento completo de pedidos.</p>

<div class="info-box">
Además de la tienda pública, el sistema incorpora un <strong>panel de administración integral</strong> que permite gestionar productos, stock, pedidos, devoluciones, facturación y comunicaciones desde un único punto de control.
</div>

<table>
  <thead><tr><th>Área</th><th>Descripción</th></tr></thead>
  <tbody>
    <tr><td><strong>Tienda pública</strong></td><td>Catálogo, carrito, checkout, cuenta de cliente y seguimiento postventa</td></tr>
    <tr><td><strong>Panel de administración</strong></td><td>Gestión de productos, pedidos, devoluciones, facturas y configuración de la tienda</td></tr>
    <tr><td><strong>Integraciones</strong></td><td>Pasarela de pago (Stripe), base de datos (Supabase), email (Resend) e imágenes (Cloudinary)</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 2 ═══════════════════════════ -->

<h2>2. Objetivo del proyecto</h2>

<p>Digitalizar la venta de moda masculina premium a través de una plataforma web completa que permita:</p>

<ul>
  <li>Ofrecer al cliente final una experiencia de compra intuitiva y sin fricciones.</li>
  <li>Reducir los tiempos de gestión administrativa del negocio.</li>
  <li>Centralizar el control de pedidos, inventario y comunicaciones en una sola herramienta.</li>
  <li>Escalar la operación comercial sin depender de procesos manuales.</li>
</ul>

<hr>

<!-- ═══════════════════════════ SECCIÓN 3 ═══════════════════════════ -->

<h2>3. Problema que resuelve</h2>

<p>Muchas tiendas de moda operan con herramientas dispersas: redes sociales para captar ventas, hojas de cálculo para controlar el stock y mensajería instantánea para la atención al cliente. Esto genera ineficiencias que FashionMarket resuelve de forma directa:</p>

<table>
  <thead><tr><th>Problema detectado</th><th>Solución implementada</th></tr></thead>
  <tbody>
    <tr><td>Atención al cliente lenta y desorganizada</td><td>Correos automáticos y área de cuenta con información en tiempo real</td></tr>
    <tr><td>Errores frecuentes en el control de stock</td><td>Inventario por variante (talla y color) con actualización automática tras cada venta</td></tr>
    <tr><td>Seguimiento manual de cada pedido</td><td>Ciclo de estados automatizado con notificaciones por email en cada transición</td></tr>
    <tr><td>Pagos fuera de plataforma o poco seguros</td><td>Pasarela Stripe integrada con confirmación instantánea por webhook</td></tr>
    <tr><td>Facturación manual y propensa a errores</td><td>Generación automática de facturas y documentos rectificativos en PDF</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 4 ═══════════════════════════ -->

<h2>4. Público objetivo</h2>

<h3>Cliente final</h3>
<p>Personas interesadas en moda masculina de calidad que valoran la comodidad de comprar online, con información clara sobre productos, plazos de envío y estado de sus pedidos.</p>

<h3>Administrador del negocio</h3>
<p>El responsable de la tienda que necesita gestionar catálogo, pedidos, devoluciones, facturas y comunicaciones de forma centralizada, sin recurrir a múltiples herramientas externas.</p>

<hr>

<!-- ═══════════════════════════ SECCIÓN 5 ═══════════════════════════ -->

<h2>5. Descripción general de la plataforma</h2>

<h3>Área pública (clientes)</h3>
<ul>
  <li>Página de inicio con carrusel configurable y selección de productos destacados.</li>
  <li>Catálogo navegable con filtros por categoría, rango de precio y atributos del producto.</li>
  <li>Carrito de compra persistente con actualización en tiempo real.</li>
  <li>Proceso de checkout guiado: selección de dirección, método de envío, código descuento y pago seguro.</li>
  <li>Área de cliente con perfil personal, historial de pedidos, lista de favoritos y direcciones guardadas.</li>
</ul>

<h3>Área privada (administración)</h3>
<ul>
  <li>Gestión completa de productos: fichas detalladas, galería de imágenes y variantes de talla/color.</li>
  <li>Control de stock por variante con alertas automáticas de inventario bajo.</li>
  <li>Procesamiento de pedidos con cambio de estado y asignación de número de seguimiento.</li>
  <li>Gestión de devoluciones, cancelaciones y generación de facturas rectificativas.</li>
  <li>Configuración visual de la tienda: descuentos, carrusel, animaciones y newsletter.</li>
</ul>

<hr>

<!-- ═══════════════════════════ SECCIÓN 6 ═══════════════════════════ -->

<h2>6. Funcionalidades principales</h2>

<h3>6.1 Catálogo y navegación</h3>
<table>
  <thead><tr><th>Funcionalidad</th><th>Detalle</th></tr></thead>
  <tbody>
    <tr><td>Buscador inteligente</td><td>Búsqueda por nombre, descripción y etiquetas con resultados instantáneos</td></tr>
    <tr><td>Filtros combinados</td><td>Categoría, rango de precio, talla disponible y ordenación (precio, novedad, popularidad)</td></tr>
    <tr><td>Ficha de producto</td><td>Galería de imágenes, selector de talla/color, precio con descuento, descripción y productos relacionados</td></tr>
    <tr><td>Categorías dinámicas</td><td>Sección por categoría con imagen y descripción personalizables desde el panel</td></tr>
  </tbody>
</table>

<h3>6.2 Carrito de compra</h3>
<ul>
  <li>Persistencia en <code>localStorage</code> para que el carrito se mantenga entre sesiones.</li>
  <li>Actualización de cantidades y eliminación de artículos en tiempo real.</li>
  <li>Verificación automática de stock disponible antes de proceder al pago.</li>
  <li>Resumen visual con imágenes, tallas seleccionadas y cálculo del total.</li>
</ul>

<h3>6.3 Proceso de compra (checkout)</h3>
<ul>
  <li>Formulario de dirección de envío con autocompletado desde direcciones guardadas.</li>
  <li>Selección de método de envío con cálculo automático de costes.</li>
  <li>Aplicación de códigos de descuento con validación en tiempo real.</li>
  <li>Pago seguro a través de Stripe Checkout con redirección a la pasarela.</li>
  <li>Confirmación por webhook: el pedido solo se registra cuando el pago es verificado.</li>
</ul>

<h3>6.4 Cuenta de cliente</h3>
<table>
  <thead><tr><th>Sección</th><th>Funcionalidad</th></tr></thead>
  <tbody>
    <tr><td>Perfil</td><td>Edición de nombre, email y contraseña, con verificación de identidad</td></tr>
    <tr><td>Mis pedidos</td><td>Historial completo con detalle de cada pedido, descarga de factura y seguimiento</td></tr>
    <tr><td>Favoritos</td><td>Lista de productos guardados con acceso rápido a la compra</td></tr>
    <tr><td>Direcciones</td><td>Gestión de múltiples direcciones de envío con opción de dirección predeterminada</td></tr>
  </tbody>
</table>

<h3>6.5 Ofertas y descuentos</h3>
<ul>
  <li>Página dedicada a productos en oferta, ordenados por porcentaje de descuento.</li>
  <li>Sistema de códigos promocionales con validación de uso único, fecha de expiración y monto mínimo.</li>
  <li>Precio original y precio con descuento visibles en la ficha del producto.</li>
</ul>

<hr>

<!-- ═══════════════════════════ SECCIÓN 7 ═══════════════════════════ -->

<h2>7. Flujo de compra del cliente</h2>

<p>El recorrido del cliente desde que llega a la tienda hasta que recibe su pedido sigue un flujo lineal y claro:</p>

<div class="flow">
  <span class="step">Explorar catálogo</span>
  <span class="arrow">→</span>
  <span class="step">Seleccionar talla/color</span>
  <span class="arrow">→</span>
  <span class="step">Añadir al carrito</span>
  <span class="arrow">→</span>
  <span class="step">Revisar carrito</span>
  <span class="arrow">→</span>
  <span class="step">Dirección de envío</span>
  <span class="arrow">→</span>
  <span class="step">Método de envío</span>
  <span class="arrow">→</span>
  <span class="step">Código descuento</span>
  <span class="arrow">→</span>
  <span class="step">Pago con Stripe</span>
  <span class="arrow">→</span>
  <span class="step">Confirmación</span>
  <span class="arrow">→</span>
  <span class="step">Seguimiento</span>
</div>

<div class="info-box">
<strong>Momento clave:</strong> el pedido solo se crea en la base de datos cuando Stripe confirma el pago mediante webhook. Esto garantiza que no existan pedidos sin pago verificado.
</div>

<hr>

<!-- ═══════════════════════════ SECCIÓN 8 ═══════════════════════════ -->

<h2>8. Pedidos, devoluciones y facturación</h2>

<h3>8.1 Ciclo de vida de un pedido</h3>

<div class="flow">
  <span class="step">Pendiente</span>
  <span class="arrow">→</span>
  <span class="step">Procesando</span>
  <span class="arrow">→</span>
  <span class="step">Enviado</span>
  <span class="arrow">→</span>
  <span class="step">Entregado</span>
</div>

<p>En cada transición de estado, el sistema envía automáticamente un correo electrónico al cliente informándole del cambio. El administrador puede agregar un número de seguimiento del transportista cuando el pedido pasa a estado «Enviado».</p>

<h3>8.2 Cancelaciones</h3>
<ul>
  <li>El cliente puede cancelar un pedido mientras su estado sea «Pendiente».</li>
  <li>El administrador puede cancelar cualquier pedido que no haya sido enviado.</li>
  <li>Al cancelar, el stock reservado se repone automáticamente y se genera una factura rectificativa.</li>
</ul>

<h3>8.3 Devoluciones</h3>

<div class="flow">
  <span class="step">Solicitud</span>
  <span class="arrow">→</span>
  <span class="step">Revisión</span>
  <span class="arrow">→</span>
  <span class="step">Aceptada / Rechazada</span>
  <span class="arrow">→</span>
  <span class="step">Reembolso</span>
</div>

<ul>
  <li>El cliente inicia la devolución desde su área personal, indicando el motivo.</li>
  <li>El administrador revisa la solicitud y la acepta o rechaza.</li>
  <li>Si se acepta, el stock se repone y se genera un documento rectificativo.</li>
</ul>

<h3>8.4 Facturación</h3>
<ul>
  <li><strong>Factura de venta:</strong> generada automáticamente al crear el pedido, descargable en PDF.</li>
  <li><strong>Factura rectificativa:</strong> generada automáticamente ante cancelación o devolución aceptada.</li>
  <li>Ambos documentos incluyen datos fiscales, desglose de IVA, dirección de envío y detalle de productos.</li>
</ul>

<hr>

<!-- ═══════════════════════════ SECCIÓN 9 ═══════════════════════════ -->

<h2>9. Panel de administración</h2>

<p>El panel de administración es una aplicación protegida por autenticación que centraliza toda la operativa de la tienda. Solo los usuarios registrados con rol de administrador pueden acceder.</p>

<h3>9.1 Dashboard</h3>
<ul>
  <li>Indicadores clave del negocio: ventas del día, del mes, pedidos pendientes y productos con stock bajo.</li>
  <li>Gráfico de evolución de ventas con filtros temporales.</li>
  <li>Listado rápido de los últimos pedidos recibidos.</li>
</ul>

<h3>9.2 Gestión de productos</h3>
<table>
  <thead><tr><th>Acción</th><th>Descripción</th></tr></thead>
  <tbody>
    <tr><td>Crear producto</td><td>Nombre, descripción, precio, categoría, etiquetas y estado (borrador / publicado)</td></tr>
    <tr><td>Variantes</td><td>Definición de tallas y colores con stock independiente y precio opcional por variante</td></tr>
    <tr><td>Imágenes</td><td>Subida múltiple a Cloudinary, reordenación por arrastrar y soltar, imagen principal</td></tr>
    <tr><td>Descuentos</td><td>Precio con descuento y porcentaje de ahorro, visible en la ficha del producto</td></tr>
  </tbody>
</table>

<h3>9.3 Gestión de pedidos</h3>
<ul>
  <li>Listado con filtros por estado, fecha, cliente y monto.</li>
  <li>Vista de detalle con productos comprados, dirección, método de envío y datos de pago.</li>
  <li>Cambio de estado con registro de historial de transiciones.</li>
  <li>Asignación de número de seguimiento del transportista.</li>
</ul>

<h3>9.4 Configuración de la tienda</h3>
<ul>
  <li>Carrusel de la página de inicio: imágenes, textos y enlaces configurables.</li>
  <li>Códigos de descuento: creación, activación/desactivación, condiciones de uso.</li>
  <li>Animaciones del sitio: tipo, duración e intensidad ajustables.</li>
  <li>Newsletter: gestión de suscriptores y envío de campañas.</li>
  <li>Categorías: edición de nombre, descripción, imagen y orden de aparición.</li>
</ul>

<hr>

<!-- ═══════════════════════════ SECCIÓN 10 ═══════════════════════════ -->

<h2>10. Seguridad y confianza</h2>

<table>
  <thead><tr><th>Mecanismo</th><th>Implementación</th></tr></thead>
  <tbody>
    <tr><td>Autenticación</td><td>Supabase Auth con confirmación por email y recuperación de contraseña segura</td></tr>
    <tr><td>Autorización</td><td>Row Level Security (RLS) en todas las tablas: cada usuario solo accede a sus propios datos</td></tr>
    <tr><td>Protección del admin</td><td>Middleware de verificación de rol en cada ruta del panel de administración</td></tr>
    <tr><td>Pagos seguros</td><td>Stripe Checkout: los datos de la tarjeta nunca pasan por nuestro servidor</td></tr>
    <tr><td>Verificación de pagos</td><td>Webhook con firma HMAC — los pedidos solo se confirman tras validación criptográfica</td></tr>
    <tr><td>Variables de entorno</td><td>Claves sensibles almacenadas exclusivamente en variables de entorno del servidor</td></tr>
    <tr><td>HTTPS</td><td>Comunicación cifrada en todas las rutas, tanto públicas como de administración</td></tr>
  </tbody>
</table>

<div class="warn-box">
<strong>Principio de mínimo privilegio:</strong> la aplicación pública solo utiliza la clave anónima de Supabase. Las operaciones administrativas se ejecutan a través de endpoints API protegidos con verificación de sesión y rol.
</div>

<hr>

<!-- ═══════════════════════════ SECCIÓN 11 ═══════════════════════════ -->

<h2>11. Arquitectura y tecnologías</h2>

<div class="tech-grid">
  <div class="tech-card">
    <strong>Astro 5</strong>
    <span>Framework web con renderizado estático y componentes interactivos bajo demanda (islands architecture)</span>
  </div>
  <div class="tech-card">
    <strong>React 19</strong>
    <span>Componentes interactivos: carrito, filtros, formularios dinámicos y paneles del admin</span>
  </div>
  <div class="tech-card">
    <strong>Tailwind CSS</strong>
    <span>Sistema de diseño utility-first con tema personalizado, colores de marca y componentes reutilizables</span>
  </div>
  <div class="tech-card">
    <strong>TypeScript</strong>
    <span>Tipado estricto en todo el proyecto para prevenir errores y mejorar la mantenibilidad del código</span>
  </div>
  <div class="tech-card">
    <strong>Supabase</strong>
    <span>Base de datos PostgreSQL, autenticación, almacenamiento y Row Level Security como backend completo</span>
  </div>
  <div class="tech-card">
    <strong>Stripe</strong>
    <span>Pasarela de pagos con Checkout Sessions y verificación de pagos por webhook</span>
  </div>
  <div class="tech-card">
    <strong>Resend</strong>
    <span>Servicio de email transaccional para confirmaciones, notificaciones de estado y newsletter</span>
  </div>
  <div class="tech-card">
    <strong>Cloudinary</strong>
    <span>Gestión y optimización de imágenes de productos con transformaciones automáticas</span>
  </div>
</div>

<h3>Patrón arquitectónico</h3>
<p>La aplicación sigue el patrón <strong>Islands Architecture</strong> de Astro: las páginas se renderizan como HTML estático y solo los componentes que requieren interactividad (carrito, filtros, formularios) se hidratan como «islas» de React en el navegador. Esto garantiza tiempos de carga mínimos y un rendimiento excelente.</p>

<hr>

<!-- ═══════════════════════════ SECCIÓN 12 ═══════════════════════════ -->

<h2>12. Integraciones externas</h2>

<table>
  <thead><tr><th>Servicio</th><th>Función</th><th>Comunicación</th></tr></thead>
  <tbody>
    <tr><td><strong>Supabase</strong></td><td>Base de datos, autenticación y políticas de acceso</td><td>SDK oficial de JavaScript (supabase-js)</td></tr>
    <tr><td><strong>Stripe</strong></td><td>Cobros online y gestión de sesiones de pago</td><td>API REST + Webhook para confirmación asíncrona</td></tr>
    <tr><td><strong>Resend</strong></td><td>Envío de emails transaccionales con plantillas HTML</td><td>API REST con autenticación por clave</td></tr>
    <tr><td><strong>Cloudinary</strong></td><td>Almacenamiento, transformación y entrega de imágenes</td><td>SDK de Node.js y URLs de transformación</td></tr>
  </tbody>
</table>

<div class="info-box">
Todos los servicios externos se configuran mediante variables de entorno. Ninguna clave privada aparece en el código fuente ni en el repositorio.
</div>

<hr>

<!-- ═══════════════════════════ SECCIÓN 13 ═══════════════════════════ -->

<h2>13. APIs implementadas</h2>

<p>El sistema expone endpoints REST organizados por dominio funcional. Todos los endpoints del administrador verifican la sesión y el rol antes de ejecutar cualquier operación.</p>

<h3>13.1 Endpoints públicos</h3>

<table>
  <thead><tr><th>Método</th><th>Ruta</th><th>Función</th></tr></thead>
  <tbody>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/checkout</td><td>Crear sesión de pago en Stripe</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/webhook</td><td>Recibir confirmación de pago de Stripe</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/newsletter/subscribe</td><td>Suscripción a la newsletter</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/verify-discount</td><td>Validar código de descuento</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/contact</td><td>Envío de formulario de contacto</td></tr>
  </tbody>
</table>

<h3>13.2 Endpoints de cliente autenticado</h3>

<table>
  <thead><tr><th>Método</th><th>Ruta</th><th>Función</th></tr></thead>
  <tbody>
    <tr><td><span class="api-badge api-get">GET</span></td><td>/api/orders</td><td>Obtener pedidos del cliente</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/orders/cancel</td><td>Cancelar un pedido propio</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/orders/return</td><td>Solicitar devolución de un pedido</td></tr>
    <tr><td><span class="api-badge api-get">GET</span></td><td>/api/invoices/[id]</td><td>Descargar factura del pedido en PDF</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/favorites/toggle</td><td>Añadir o quitar favorito</td></tr>
    <tr><td><span class="api-badge api-get">GET</span></td><td>/api/favorites</td><td>Listar productos favoritos</td></tr>
  </tbody>
</table>

<h3>13.3 Endpoints de administración</h3>

<table>
  <thead><tr><th>Método</th><th>Ruta</th><th>Función</th></tr></thead>
  <tbody>
    <tr><td><span class="api-badge api-get">GET</span></td><td>/api/admin/products</td><td>Listar todos los productos</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/products</td><td>Crear nuevo producto</td></tr>
    <tr><td><span class="api-badge api-put">PUT</span></td><td>/api/admin/products/[id]</td><td>Actualizar producto existente</td></tr>
    <tr><td><span class="api-badge api-delete">DELETE</span></td><td>/api/admin/products/[id]</td><td>Eliminar producto</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/orders/update-status</td><td>Cambiar estado de un pedido</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/returns/update</td><td>Gestionar solicitud de devolución</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/upload</td><td>Subir imagen a Cloudinary</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/carousel</td><td>Actualizar configuración del carrusel</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/discounts</td><td>Crear o editar código de descuento</td></tr>
    <tr><td><span class="api-badge api-post">POST</span></td><td>/api/admin/newsletter/send</td><td>Enviar campaña de newsletter</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 14 ═══════════════════════════ -->

<h2>14. Estado actual y operación</h2>

<table>
  <thead><tr><th>Aspecto</th><th>Estado</th></tr></thead>
  <tbody>
    <tr><td>Tienda pública</td><td>Operativa — todas las funcionalidades implementadas y probadas</td></tr>
    <tr><td>Panel de administración</td><td>Operativo — gestión completa de productos, pedidos, devoluciones y configuración</td></tr>
    <tr><td>Pasarela de pago</td><td>Integrada y funcional con Stripe en modo producción</td></tr>
    <tr><td>Email transaccional</td><td>Activo — 11 plantillas de correo para clientes y administradores</td></tr>
    <tr><td>Base de datos</td><td>18+ tablas con políticas RLS, funciones atómicas y triggers automáticos</td></tr>
    <tr><td>Despliegue</td><td>Producción en Railway con dominio personalizado y HTTPS</td></tr>
  </tbody>
</table>

<h3>Emails implementados</h3>

<table>
  <thead><tr><th>Destinatario</th><th>Plantilla</th><th>Momento de envío</th></tr></thead>
  <tbody>
    <tr><td>Cliente</td><td>Bienvenida a la newsletter</td><td>Al suscribirse</td></tr>
    <tr><td>Cliente</td><td>Confirmación de pedido</td><td>Tras pago verificado</td></tr>
    <tr><td>Cliente</td><td>Pedido cancelado</td><td>Al cancelar un pedido</td></tr>
    <tr><td>Cliente</td><td>Actualización de envío</td><td>Al asignar número de seguimiento</td></tr>
    <tr><td>Cliente</td><td>Pedido entregado</td><td>Al marcar como entregado</td></tr>
    <tr><td>Cliente</td><td>Solicitud de devolución recibida</td><td>Al iniciar devolución</td></tr>
    <tr><td>Admin</td><td>Nuevo pedido recibido</td><td>Tras pago verificado</td></tr>
    <tr><td>Admin</td><td>Stock bajo</td><td>Cuando una variante baja del umbral configurado</td></tr>
    <tr><td>Admin</td><td>Cancelación de pedido</td><td>Al cancelar un pedido</td></tr>
    <tr><td>Admin</td><td>Solicitud de devolución</td><td>Cuando un cliente solicita devolución</td></tr>
    <tr><td>Admin</td><td>Pedidos pendientes</td><td>Resumen periódico de pedidos sin procesar</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 15 ═══════════════════════════ -->

<h2>15. Impacto y beneficios</h2>

<table>
  <thead><tr><th>Beneficio</th><th>Descripción</th></tr></thead>
  <tbody>
    <tr><td><strong>Ventas 24/7</strong></td><td>La tienda opera de forma continua sin necesidad de intervención manual</td></tr>
    <tr><td><strong>Reducción de errores</strong></td><td>El stock, la facturación y las notificaciones se gestionan de forma automática</td></tr>
    <tr><td><strong>Experiencia profesional</strong></td><td>Diseño cuidado, animaciones fluidas y navegación intuitiva generan confianza en el cliente</td></tr>
    <tr><td><strong>Escalabilidad</strong></td><td>Arquitectura preparada para crecer en catálogo, tráfico y funcionalidades sin rediseñar</td></tr>
    <tr><td><strong>Control total</strong></td><td>El panel de administración centraliza toda la operativa del negocio en una sola herramienta</td></tr>
    <tr><td><strong>Ahorro de tiempo</strong></td><td>Automatización de procesos repetitivos: emails, facturas, estados de pedido y alertas de stock</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 16 ═══════════════════════════ -->

<h2>16. Mejoras futuras</h2>

<table>
  <thead><tr><th>Mejora</th><th>Descripción</th></tr></thead>
  <tbody>
    <tr><td>Aplicación móvil</td><td>Versión nativa en Flutter para iOS y Android con sincronización completa</td></tr>
    <tr><td>Chat en vivo</td><td>Atención al cliente en tiempo real integrada en la tienda</td></tr>
    <tr><td>Programa de fidelización</td><td>Puntos por compra, descuentos acumulables y niveles de cliente</td></tr>
    <tr><td>Analítica avanzada</td><td>Dashboard con métricas de conversión, productos más vendidos y comportamiento del usuario</td></tr>
    <tr><td>Internacionalización</td><td>Soporte multiidioma y multidivisa para expandir a nuevos mercados</td></tr>
    <tr><td>Opiniones de clientes</td><td>Sistema de valoraciones y reseñas verificadas en los productos</td></tr>
  </tbody>
</table>

<hr>

<!-- ═══════════════════════════ SECCIÓN 17 ═══════════════════════════ -->

<h2>17. Conclusión</h2>

<p>FashionMarket demuestra que es posible construir una plataforma de comercio electrónico profesional, completa y escalable utilizando tecnologías modernas. El proyecto cubre el ciclo completo del negocio digital: desde la experiencia de compra del cliente hasta la operativa interna del administrador.</p>

<p>La combinación de Astro, React, Supabase y Stripe permite ofrecer una solución rápida, segura y fácil de mantener. El panel de administración elimina la necesidad de herramientas externas, y las automatizaciones en email, facturación y gestión de stock reducen significativamente la carga operativa.</p>

<p>El proyecto está en producción y operativo, listo para seguir evolucionando con las mejoras planificadas en la hoja de ruta.</p>

<hr>

<!-- ═══════════════════════════ SECCIÓN 18 ═══════════════════════════ -->

<h2>18. Checklist de entrega</h2>

<ul class="checklist">
  <li>Código fuente completo en repositorio Git</li>
  <li>Aplicación desplegada y accesible en producción</li>
  <li>Base de datos configurada con esquema, migraciones y datos iniciales</li>
  <li>Pasarela de pago integrada y verificada con transacciones reales</li>
  <li>Panel de administración operativo con todas las funcionalidades</li>
  <li>Sistema de emails transaccionales activo con 11 plantillas</li>
  <li>Facturación automática con generación de PDF</li>
  <li>Documentación técnica y funcional entregada</li>
  <li>Variables de entorno documentadas para reproducir el despliegue</li>
  <li>Responsive design verificado en móvil, tablet y escritorio</li>
</ul>

</div>

<!-- ── PIE DE PÁGINA ── -->
<div class="doc-footer">
  <p><strong>FashionMarket</strong> — Documentación de entrega del proyecto</p>
  <p>Jose Manuel Ortega Soto · Sistema de Gestión Empresarial · Victoriafp · 2026</p>
</div>
