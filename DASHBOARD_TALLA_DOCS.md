# Documentación: Dashboard Ejecutivo y Recomendador de Talla

## Resumen de la Implementación

Se han implementado dos funcionalidades críticas para la tienda FashionStore:

1. **Dashboard Ejecutivo** (`/admin/dashboard-ejecutivo`)
2. **Recomendador de Talla** (en la ficha de producto)

---

## 1. Dashboard Ejecutivo

### Ubicación de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/admin/dashboard-ejecutivo.astro` | Página principal del dashboard |
| `src/lib/dashboard-queries.ts` | Funciones de consulta a Supabase |
| `src/components/islands/SalesChart.tsx` | Gráfico de ventas (React Island) |
| `src/components/islands/KPICard.tsx` | Tarjeta de KPI reutilizable |

### Consultas SQL (Supabase)

#### Ventas Totales del Mes
```typescript
// src/lib/dashboard-queries.ts - getMonthlySales()
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const { data } = await supabaseAdmin
    .from('orders')
    .select('total_price')
    .in('status', ['paid', 'shipped', 'delivered'])  // Solo pedidos completados
    .gte('created_at', startOfMonth.toISOString());

// Suma de todos los total_price
return data.reduce((sum, order) => sum + order.total_price, 0);
```

**Explicación:**
- Filtramos por `status` para excluir pedidos pendientes o cancelados
- Usamos `gte` (greater than or equal) para obtener pedidos desde el 1° del mes
- La agregación se hace en JavaScript para simplicidad

#### Pedidos Pendientes
```typescript
// src/lib/dashboard-queries.ts - getPendingOrdersCount()
const { count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid');  // Pagados pero no enviados
```

**Explicación:**
- `head: true` evita traer los datos, solo cuenta
- `count: 'exact'` da el conteo exacto
- Status `paid` = pedidos pagados esperando procesamiento

#### Producto Más Vendido
```typescript
// src/lib/dashboard-queries.ts - getTopProduct()
const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select(`
        product_name,
        quantity,
        order:orders!inner(status)
    `)
    .in('orders.status', ['paid', 'shipped', 'delivered']);

// Agregación en JavaScript
const productSales: Record<string, number> = {};
for (const item of orderItems) {
    productSales[item.product_name] = 
        (productSales[item.product_name] || 0) + item.quantity;
}

// Encontrar el máximo
let topName = '';
let topQty = 0;
for (const [name, qty] of Object.entries(productSales)) {
    if (qty > topQty) { topName = name; topQty = qty; }
}
```

**Explicación:**
- Join implícito con `orders!inner` para filtrar por status
- Agregamos manualmente por `product_name`
- Esto evita crear funciones RPC en Supabase

#### Ventas de los Últimos 7 Días
```typescript
// src/lib/dashboard-queries.ts - getLast7DaysSales()
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const { data } = await supabaseAdmin
    .from('orders')
    .select('created_at, total_price')
    .in('status', ['paid', 'shipped', 'delivered'])
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

// Inicializar los 7 días con 0
const salesByDate: Record<string, number> = {};
for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    salesByDate[date.toISOString().split('T')[0]] = 0;
}

// Sumar ventas por día
for (const order of data) {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    salesByDate[dateStr] += order.total_price;
}

return Object.entries(salesByDate)
    .map(([date, total]) => ({ date, total }));
```

**Explicación:**
- Pre-inicializamos los 7 días para que aparezcan aunque tengan 0 ventas
- Agrupamos por fecha (YYYY-MM-DD)
- El formato resultante es compatible con Recharts

### Transformación de Datos para Recharts

```typescript
// src/components/islands/SalesChart.tsx

// Datos de entrada (de la BD):
[
  { date: '2026-01-15', total: 150.00 },
  { date: '2026-01-16', total: 230.50 },
  // ...
]

// Transformación para el gráfico:
const chartData = data.map(item => ({
  ...item,
  displayDate: formatDate(item.date),     // "Lun 15"
  formattedTotal: formatCurrency(item.total) // "€150,00"
}));

// Recharts consume directamente:
<AreaChart data={chartData}>
  <XAxis dataKey="displayDate" />
  <Area dataKey="total" />
</AreaChart>
```

### ¿Por qué Recharts?

1. **Basado en React**: Se integra naturalmente con los Islands de Astro
2. **Declarativo**: Componentes como `<LineChart>`, `<Bar>`, etc.
3. **Ligero**: Solo carga los componentes que usas (~100KB gzipped)
4. **Responsivo**: `<ResponsiveContainer>` se adapta al contenedor

### Directiva `client:visible`

```astro
<SalesChart 
    client:visible 
    data={salesData}
/>
```

**¿Cómo funciona?**
1. El HTML se renderiza en el servidor (SSR)
2. El JavaScript de Recharts **NO** se carga inicialmente
3. Cuando el usuario hace scroll y el gráfico entra en el viewport:
   - Se descarga el bundle de Recharts
   - Se hidrata el componente React
4. Beneficios:
   - Mejor LCP (Largest Contentful Paint)
   - Menor JavaScript inicial
   - Ahorro de ancho de banda si el usuario no ve el gráfico

---

## 2. Recomendador de Talla

### Ubicación de Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/components/islands/SizeRecommender.tsx` | Componente modal completo |
| `src/pages/productos/[slug].astro` | Integración en la ficha |

### Lógica de Cálculo de Talla

```typescript
// src/components/islands/SizeRecommender.tsx

function calculateSize(altura: number, peso: number): SizeResult {
  // Calcular IMC como referencia adicional
  const alturaM = altura / 100;
  const imc = peso / (alturaM * alturaM);

  // Lógica de decisión
  if (peso < 60 && altura < 170) {
    return { size: 'S', confidence: 'alta', tip: '...' };
  }
  else if (peso < 70 && altura < 175) {
    return { size: 'M', confidence: 'alta', tip: '...' };
  }
  else if (peso >= 70 && peso <= 85 && altura >= 175 && altura <= 185) {
    return { size: 'L', confidence: 'alta', tip: '...' };
  }
  else if (peso > 90) {
    return { size: 'XL', confidence: 'alta', tip: '...' };
  }
  // ... casos intermedios con confidence 'media'
}
```

**Tabla de Referencia:**

| Condición | Talla | Confianza |
|-----------|-------|-----------|
| peso < 60kg Y altura < 170cm | S | Alta |
| peso < 70kg Y altura < 175cm | M | Alta |
| 70kg ≤ peso ≤ 85kg Y 175cm ≤ altura ≤ 185cm | L | Alta |
| peso > 90kg | XL | Alta |
| altura > 185cm Y peso < 75kg | L | Media |
| altura > 185cm Y peso ≥ 75kg | XL | Alta |
| Casos intermedios | Basado en IMC | Media |

### Directiva `client:load`

```astro
<SizeRecommender 
    client:load 
    productName={product.name}
    availableSizes={product.sizes}
/>
```

**¿Por qué `client:load` y no `client:visible`?**

1. **Interacción Inmediata**: El botón "¿Cuál es mi talla?" debe responder al clic sin delay
2. **Modal UX**: El usuario espera que el modal se abra instantáneamente
3. **Posición en la página**: Está cerca del botón de compra, visible rápidamente
4. **Tamaño del componente**: Es relativamente ligero (~9KB gzipped)

**Comparación de Directivas:**

| Directiva | Carga cuando... | Uso ideal |
|-----------|-----------------|-----------|
| `client:load` | La página carga | Componentes interactivos principales |
| `client:visible` | Es visible en viewport | Gráficos, contenido below-the-fold |
| `client:idle` | El navegador está idle | Componentes no críticos |
| `client:media` | Media query coincide | Componentes solo móvil/desktop |

### Integración en la Ficha de Producto

```astro
<!-- src/pages/productos/[slug].astro -->

<div class="glass-card p-6 mb-8">
    <!-- Botón de añadir al carrito -->
    <AddToCartButton client:load product={product} />
    
    <!-- Recomendador de talla -->
    <div class="mt-4 pt-4 border-t border-white/10">
        <SizeRecommender 
            client:load 
            productName={product.name}
            availableSizes={product.sizes || ['S', 'M', 'L', 'XL']}
        />
    </div>
</div>
```

---

## Rutas del Proyecto

- **Dashboard Ejecutivo**: `/admin/dashboard-ejecutivo`
- **Dashboard Original**: `/admin/dashboard`
- **Ficha de Producto** (con recomendador): `/productos/[slug]`

---

## Próximos Pasos Sugeridos

1. **Datos en tiempo real**: Implementar polling o WebSockets para actualizar KPIs
2. **Más métricas**: Tasa de conversión, valor promedio de pedido
3. **Recomendador mejorado**: Añadir tipo de prenda (ajustado vs holgado)
4. **A/B Testing**: Medir impacto del recomendador en devoluciones

---

## Dependencias Añadidas

```json
{
  "dependencies": {
    "recharts": "^2.x.x"  // Librería de gráficos
  }
}
```

Instalación:
```bash
npm install recharts
```
