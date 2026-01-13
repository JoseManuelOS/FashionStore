# 📸 Configuración de Cloudinary para FashionStore

## ¿Por qué Cloudinary?

Se ha migrado de **Supabase Storage** a **Cloudinary** para el almacenamiento de imágenes de productos por las siguientes ventajas:

- ✅ Optimización automática de imágenes
- ✅ Transformaciones on-the-fly (resize, crop, format)
- ✅ CDN global más rápido
- ✅ Tier gratuito generoso (25 créditos/mes)
- ✅ Mejor manejo de imágenes para e-commerce

---

## 🚀 Pasos de Configuración

### 1. Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Regístrate con tu email
3. Verifica tu cuenta

### 2. Obtener credenciales

1. En el dashboard de Cloudinary, encontrarás:
   - **Cloud Name** (ej: `dxyz123abc`)
   - **API Key** (no necesario para uploads desde cliente)
   - **API Secret** (no necesario para uploads desde cliente)

2. Copia tu **Cloud Name**

### 3. Crear Upload Preset

Para subir imágenes desde el navegador necesitas un "upload preset" sin firmar:

1. Ve a **Settings** (⚙️) → **Upload** → **Upload presets**
2. Click en **Add upload preset**
3. Configura:
   - **Preset name**: `fashionstore_products`
   - **Signing Mode**: **Unsigned** ⚠️ (importante para uploads desde cliente)
   - **Folder**: `products` (opcional pero recomendado)
   - **Upload mode**: Allowed
   - **Allowed formats**: `jpg`, `png`, `webp`
   - **Transformations** (opcional):
     - Width: 1200px (max)
     - Quality: Auto
     - Format: Auto
4. Click **Save**

### 4. Configurar variables de entorno

Crea o actualiza tu archivo `.env`:

```bash
# Cloudinary Configuration
PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name-aqui
PUBLIC_CLOUDINARY_UPLOAD_PRESET=fashionstore_products
```

**⚠️ Importante**: 
- Estas variables son seguras para exponer en el cliente porque el upload preset es unsigned
- NO necesitas API Key ni API Secret para uploads desde el navegador
- El prefijo `PUBLIC_` hace que Astro las exponga al cliente

### 5. Reiniciar servidor de desarrollo

```bash
npm run dev
```

---

## 🗂️ Estructura en Cloudinary

Las imágenes se organizan así:

```
tu-cloud-name/
└── products/
    ├── 1234567890-abc123.jpg
    ├── 1234567891-def456.png
    └── 1234567892-ghi789.webp
```

---

## 🔧 Cambios Realizados en el Código

### Archivos Modificados

1. **`src/components/islands/ImageUploader.tsx`**
   - Eliminada dependencia de Supabase Storage
   - Implementado upload directo a Cloudinary
   - Usa Cloudinary Upload API

2. **`supabase/schema.sql`**
   - Eliminadas políticas de Storage
   - `product_images.image_url` ahora almacena URLs de Cloudinary

3. **`.env.example`**
   - Añadidas variables de Cloudinary

### Archivos Eliminados

- ✅ `supabase/storage-policies.sql` (ya no necesario)

### Archivos Nuevos

- ✅ `supabase/remove-storage-policies.sql` (para limpiar políticas viejas)
- ✅ `CLOUDINARY_SETUP.md` (este archivo)

---

## 🧹 Limpieza de Supabase Storage

Si ya tenías imágenes en Supabase Storage:

### Paso 1: Descargar imágenes existentes (opcional)

```bash
# Solo si quieres respaldo local
# Ve a Supabase Dashboard > Storage > products-images
# Descarga las imágenes manualmente o usa la CLI
```

### Paso 2: Ejecutar limpieza en Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta el archivo `supabase/remove-storage-policies.sql`
3. Ve a **Storage** → `products-images` → **Settings** → **Delete bucket**

---

## 🎨 Optimizaciones de Cloudinary

Puedes optimizar las URLs de Cloudinary añadiendo transformaciones:

### Ejemplo de URL original
```
https://res.cloudinary.com/tu-cloud/image/upload/products/imagen.jpg
```

### URL optimizada para thumbnail (200x250px)
```
https://res.cloudinary.com/tu-cloud/image/upload/w_200,h_250,c_fill,f_auto,q_auto/products/imagen.jpg
```

### URL optimizada para vista de producto (800px width)
```
https://res.cloudinary.com/tu-cloud/image/upload/w_800,f_auto,q_auto/products/imagen.jpg
```

**Parámetros útiles:**
- `w_X` - ancho en píxeles
- `h_X` - alto en píxeles
- `c_fill` - crop y rellena
- `f_auto` - formato automático (WebP si el navegador lo soporta)
- `q_auto` - calidad automática optimizada

---

## 🐛 Troubleshooting

### Error: "Upload preset must be whitelisted"
- Asegúrate de que el preset sea **Unsigned**
- Verifica que el nombre del preset sea exacto

### Error: "Invalid cloud name"
- Verifica que `PUBLIC_CLOUDINARY_CLOUD_NAME` esté correcto en `.env`
- Reinicia el servidor de desarrollo

### Las imágenes no se suben
- Abre la consola del navegador (F12) para ver errores
- Verifica que el preset exista en Cloudinary
- Comprueba que las variables de entorno sean correctas

### CORS errors
- Cloudinary permite CORS por defecto
- Si tienes problemas, ve a Settings → Security → Allowed fetch domains

---

## 📚 Recursos

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)

---

## ✅ Checklist de Migración

- [ ] Crear cuenta en Cloudinary
- [ ] Copiar Cloud Name
- [ ] Crear upload preset unsigned `fashionstore_products`
- [ ] Configurar `.env` con las credenciales
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Ejecutar `supabase/remove-storage-policies.sql` en Supabase
- [ ] Eliminar bucket `products-images` en Supabase Storage (opcional)
- [ ] Probar subida de imágenes en admin panel

---

**¡Listo!** 🎉 Tu FashionStore ahora usa Cloudinary para gestionar imágenes de productos.
