# Despliegue en Coolify

## Requisitos previos
- Cuenta en Coolify
- Repositorio de GitHub conectado

## Configuración en Coolify

### 1. Variables de entorno
Configura estas variables en **Configuration → Environment Variables**:

| Variable | Descripción |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de rol de servicio (server-side) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `RESEND_API_KEY` | API key de Resend para emails |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre de cloud en Cloudinary |
| `PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Preset de subida de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `ADMIN_EMAIL` | Email del administrador |

### 2. Configuración del Build Pack

- **Build Pack**: Nixpacks
- **Is it a static site?**: ❌ No (desmarcado)

### 3. Comandos (opcionales - nixpacks.toml los detecta)

Si Nixpacks no detecta la configuración automáticamente:

- **Install Command**: `npm ci`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start` o `node ./dist/server/entry.mjs`

### 4. Puerto

El servidor escucha en el puerto **3000** por defecto. Coolify debería detectarlo automáticamente.

## Archivos de configuración

- `nixpacks.toml` - Configuración de Nixpacks para el build
- `package.json` - Scripts de npm incluyendo `start`
- `astro.config.mjs` - Configuración de Astro con Node adapter

## Despliegue

1. Haz push de los cambios a tu rama `main`
2. En Coolify, haz clic en **Redeploy**
3. Espera a que termine el build
4. Accede a tu dominio configurado

## Troubleshooting

### Error: "supabaseUrl is required"
→ Falta configurar las variables de entorno en Coolify

### Error: "/bin/bash: -c: option requires an argument"
→ Falta el Start Command. Añade: `node ./dist/server/entry.mjs`

### Error: "Unexpected }"
→ Error de sintaxis en el código. Revisa los archivos `.astro`
