# 🎠 Setup de la Tabla Carousel Slides

## Problema
```
Error: Could not find the table 'public.carousel_slides' in the schema cache
```

## Solución

### Opción 1: SQL Editor en Supabase (⭐ Recomendado)

1. Abre tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** en el menú lateral izquierdo
3. Copia TODO el contenido del archivo: `supabase/carousel-schema.sql`
4. Pégalo en el editor SQL
5. Click en el botón verde **Run** (o presiona Cmd/Ctrl + Enter)
6. Verifica que se ejecutó correctamente (deberías ver "Success" y 3 registros insertados)

### Opción 2: Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# Desde la raíz del proyecto
supabase db reset

# O ejecutar el archivo específico
psql -h [TU_HOST] -U postgres -d postgres -f supabase/carousel-schema.sql
```

## ✅ Verificación

Después de ejecutar el SQL, verifica que funciona:

1. En Supabase Dashboard → **Table Editor**
2. Deberías ver la tabla `carousel_slides` con 3 registros
3. Refresca tu app en `http://localhost:4321`
4. La sección de administración de carrusel debería funcionar

## 📊 Estructura de la Tabla

```sql
carousel_slides:
- id (UUID)
- title (VARCHAR 255) *required
- subtitle (VARCHAR 255)
- description (TEXT)
- image_url (TEXT) *required
- cta_text (VARCHAR 100) - default: 'Ver más'
- cta_link (VARCHAR 255) - default: '/productos'
- duration (INTEGER) - default: 5000ms
- sort_order (INTEGER) - default: 0
- is_active (BOOLEAN) - default: true
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🔐 Políticas RLS

- **SELECT**: Público (todos pueden ver las slides activas)
- **INSERT/UPDATE/DELETE**: Solo usuarios con rol 'admin' en la tabla `profiles`

## 🎯 Datos de Prueba

El script crea automáticamente 3 slides de ejemplo con imágenes de Unsplash.
