# 🌱 Instrucciones para Seed de Datos

## Problema: No se muestran productos en el Admin

Si no ves productos en `/admin/productos`, es porque la base de datos está vacía.

## Solución: Ejecutar el Seed

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **+ New query**
4. Copia y pega el contenido de `supabase/seed-products.sql`
5. Haz clic en **Run** (o presiona `Cmd/Ctrl + Enter`)
6. Espera a que termine (creará 100 productos)
7. Refresca `/admin/productos` en tu navegación

### Opción 2: Desde CLI (Si tienes Supabase CLI instalado)

```bash
cd /Users/copito/Desktop/Fashion/FashionStore
supabase db reset
```

O ejecuta solo el seed:

```bash
psql $DATABASE_URL -f supabase/seed-products.sql
```

## ¿Qué hace el seed?

- ✅ Crea **100 productos** de ejemplo
- ✅ En 8 categorías: Camisas, Pantalones, Trajes, Chaquetas, Jerseys, Polos, Zapatos, Accesorios
- ✅ Con precios, descripciones, tallas y stock
- ✅ Con imágenes de placeholder
- ✅ Algunos marcados como ofertas con descuentos

## Verificar variables de entorno

Si aún así no funcionara, verifica que tengas estas variables en `.env`:

```env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ IMPORTANTE para el admin
```

⚠️ La `SUPABASE_SERVICE_ROLE_KEY` es esencial para que el admin pueda ver y editar todos los productos (bypassa RLS).

## Cómo obtener las claves

1. Ve a tu proyecto en Supabase
2. **Settings** > **API**
3. Copia:
   - Project URL → `PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

---

## Crear productos manualmente

Si prefieres no usar el seed, puedes:

1. Ir a `/admin/productos/nuevo`
2. Llenar el formulario
3. Subir imágenes desde Cloudinary
4. Guardar

Pero el seed es mucho más rápido para empezar! 🚀
