# FashionMarket - E-commerce Premium de Moda Masculina

<p align="center">
  <strong>Tienda online de moda masculina premium</strong><br>
  Construida con Astro 5.0, Tailwind CSS, Supabase y Nano Stores
</p>

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos

- Node.js 18+
- Un proyecto en [Supabase](https://supabase.com) (gratuito)

### 2. Configurar Supabase

1. **Crear proyecto** en [supabase.com](https://supabase.com)

2. **Ejecutar el esquema SQL** en el Editor SQL de Supabase:
   - Copia el contenido de `supabase/schema.sql`
   - Ejecútalo en el SQL Editor

3. **Crear bucket de Storage**:
   - Ve a Storage > Nuevo bucket
   - Nombre: `products-images`
   - Público: Sí
   - Ejecuta `supabase/storage-policies.sql` para las políticas

4. **Crear usuario admin**:
   - Ve a Authentication > Users > Add User
   - Crea un usuario con email/password para el panel de admin

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> Encuentra estas credenciales en Supabase: Settings > API

### 4. Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321)

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── islands/          # Componentes React interactivos
│   │   ├── AddToCartButton.tsx
│   │   ├── CartIcon.tsx
│   │   ├── CartSlideOver.tsx
│   │   └── ImageUploader.tsx
│   └── ui/               # Componentes Astro estáticos
├── layouts/
│   ├── BaseLayout.astro  # HTML base
│   ├── PublicLayout.astro # Tienda pública
│   └── AdminLayout.astro # Panel admin (protegido)
├── lib/
│   ├── supabase.ts       # Cliente Supabase
│   └── utils.ts          # Funciones auxiliares
├── pages/
│   ├── index.astro       # Homepage (SSG)
│   ├── productos/        # Catálogo (SSG)
│   ├── categoria/        # Filtro por categoría (SSG)
│   ├── carrito.astro     # Carrito (SSR)
│   ├── admin/            # Panel admin (SSR)
│   └── api/              # Endpoints API
├── stores/
│   └── cart.ts           # Estado del carrito (Nano Stores)
└── middleware.ts         # Auth middleware
```

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Astro 5.0** | Framework híbrido SSG/SSR |
| **React** | Islas interactivas |
| **Tailwind CSS v4** | Estilos |
| **Supabase** | Base de datos, Auth, Storage |
| **Nano Stores** | Estado del carrito |

---

## 📖 Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
```

---

## 🎨 Marca

- **Colores**: Navy (#1e3a5f), Charcoal (#374151), Cream (#faf8f5), Gold (#b08d57)
- **Tipografías**: Playfair Display (títulos), Inter (texto)

---

## 📄 Licencia

MIT
