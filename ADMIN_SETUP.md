# 🛡️ Sistema de Administración - FashionMarket

## Configuración Inicial

### 1️⃣ Ejecutar el Schema de Administradores

Primero, debes ejecutar el archivo SQL en Supabase para crear las tablas y funciones necesarias:

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Copia y pega el contenido completo de `/supabase/admin-schema.sql`
4. Haz clic en **Run**

Este script creará:
- ✅ Tabla `admins` para usuarios administradores
- ✅ Tabla `admin_activity_log` para registro de actividades
- ✅ Funciones de autenticación (login, crear admin, cambiar contraseña)
- ✅ Políticas de seguridad (RLS)
- ✅ Un super administrador por defecto

### 2️⃣ Credenciales de Acceso Inicial

El script crea automáticamente un super administrador con estas credenciales:

```
Email: admin@fashionmarket.es
Password: Admin123!
```

⚠️ **IMPORTANTE**: Cambia estas credenciales inmediatamente después del primer login por seguridad.

### 3️⃣ Acceder al Panel de Administración

1. Visita: `http://localhost:4321/admin`
2. Serás redirigido automáticamente a `/admin/login`
3. Ingresa las credenciales de administrador
4. Accederás al panel de administración

## 🔐 Sistema de Autenticación

### Diferencias con el Login de Usuarios

El sistema de administración usa un **sistema de autenticación completamente separado** del login de usuarios normales:

| Característica | Usuarios | Administradores |
|----------------|----------|-----------------|
| **Tabla** | `auth.users` (Supabase Auth) | `admins` (tabla custom) |
| **Login URL** | `/auth/login` | `/admin/login` |
| **Cookie** | `sb-access-token` | `admin-session` |
| **Duración** | 7 días | 8 horas |
| **Roles** | customer | admin / super_admin |

### Seguridad

- ✅ Contraseñas encriptadas con **bcrypt**
- ✅ Sesiones con tiempo de expiración (8 horas)
- ✅ Cookies httpOnly y secure en producción
- ✅ Registro de actividad de administradores
- ✅ Row Level Security (RLS) habilitado
- ✅ Separación completa de usuarios y admins

## 👨‍💼 Gestión de Administradores

### Crear un Nuevo Administrador

Puedes crear nuevos administradores desde el SQL Editor de Supabase:

```sql
-- Crear un administrador normal
SELECT create_admin(
  'nuevo@admin.com',
  'ContraseñaSegura123!',
  'Nombre del Admin',
  'admin'
);

-- Crear un super administrador
SELECT create_admin(
  'superadmin@admin.com',
  'ContraseñaSegura123!',
  'Super Admin',
  'super_admin'
);
```

### Cambiar Contraseña de Administrador

```sql
-- Cambiar contraseña (necesitas el UUID del admin)
SELECT change_admin_password(
  'uuid-del-admin',
  'NuevaContraseñaSegura123!'
);
```

### Desactivar un Administrador

```sql
UPDATE admins 
SET is_active = false 
WHERE email = 'admin@email.com';
```

## 📊 Registro de Actividad

Todas las acciones de los administradores se registran automáticamente en la tabla `admin_activity_log`:

- Login / Logout
- Creación de productos
- Modificación de productos
- Eliminación de productos
- Cambios de configuración

### Ver el Log de Actividad

```sql
SELECT 
  al.*,
  a.email as admin_email,
  a.full_name as admin_name
FROM admin_activity_log al
JOIN admins a ON al.admin_id = a.id
ORDER BY al.created_at DESC
LIMIT 100;
```

## 🔑 Roles y Permisos

### Admin (Normal)
- ✅ Ver y gestionar productos
- ✅ Ver pedidos
- ✅ Modificar configuración básica
- ❌ Gestionar otros administradores

### Super Admin
- ✅ Todos los permisos de Admin
- ✅ Crear nuevos administradores
- ✅ Ver lista de todos los admins
- ✅ Modificar/desactivar admins
- ✅ Ver logs de actividad completos

## 📁 Estructura de Archivos

```
src/
├── pages/
│   ├── admin/
│   │   ├── login.astro          # Página de login exclusiva para admins
│   │   ├── index.astro           # Dashboard principal
│   │   └── productos/            # Gestión de productos
│   └── api/
│       └── admin/
│           ├── login.ts          # API para autenticación
│           └── logout.ts         # API para cerrar sesión
├── layouts/
│   └── AdminLayout.astro         # Layout con protección de ruta
└── lib/
    └── supabase.ts               # Configuración de Supabase

supabase/
└── admin-schema.sql              # Schema completo de administración
```

## 🚀 Rutas del Panel de Administración

- `/admin` - Dashboard principal (requiere autenticación)
- `/admin/login` - Login de administradores
- `/admin/productos` - Gestión de productos
- `/admin/productos/nuevo` - Crear nuevo producto
- `/admin/productos/[id]` - Editar producto

## 🔒 Protección de Rutas

Todas las rutas bajo `/admin` (excepto `/admin/login`) están protegidas por el `AdminLayout.astro`:

1. Verifica la existencia de cookie `admin-session`
2. Valida que la sesión no haya expirado (< 8 horas)
3. Si no está autenticado, redirige a `/admin/login`
4. Si está autenticado, permite el acceso

## 💡 Buenas Prácticas

1. **Cambia las credenciales por defecto** inmediatamente
2. **Usa contraseñas seguras** (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos)
3. **No compartas credenciales** de administrador
4. **Revisa el log de actividad** regularmente
5. **Desactiva admins inactivos** en lugar de eliminarlos
6. **Usa super_admin solo cuando sea necesario**
7. **En producción**, configura HTTPS para las cookies seguras

## 🆘 Solución de Problemas

### No puedo iniciar sesión

1. Verifica que ejecutaste el schema SQL
2. Comprueba las credenciales por defecto
3. Revisa que el admin esté activo: `SELECT * FROM admins WHERE email = 'tu@email.com';`

### La sesión expira muy rápido

Las sesiones de admin tienen una duración de 8 horas por seguridad. Puedes modificar esto en `/src/pages/api/admin/login.ts`:

```typescript
maxAge: 60 * 60 * 8, // 8 horas (modifica este valor)
```

### Olvidé mi contraseña de admin

Ejecuta en Supabase SQL Editor:

```sql
SELECT change_admin_password(
  (SELECT id FROM admins WHERE email = 'tu@email.com'),
  'NuevaContraseña123!'
);
```

## 📞 Soporte

Si encuentras problemas, revisa:
1. Los logs del navegador (Consola de Desarrollador)
2. Los logs de Supabase (Logs > Edge Functions)
3. Que todas las funciones SQL se hayan creado correctamente

---

**Última actualización**: 12 de enero de 2026
