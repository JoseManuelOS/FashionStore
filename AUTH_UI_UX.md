# FashionStore - Autenticación UI/UX

## 🎨 Paleta de Colores

### Colores Principales
| Color | HEX | Uso |
|-------|-----|-----|
| **neon-cyan** | `#06b6d4` | Botones primarios, links, focus states |
| **neon-cyan-light** | `#22d3ee` | Hover states, gradientes |
| **neon-fuchsia** | `#d946ef` | Acentos secundarios |
| **dark-500** | `#0d0d14` | Fondo de inputs |
| **dark-400** | `#12121a` | Fondo de cards |
| **dark-600** | `#0a0a0f` | Fondo body |

### Colores de Estado
| Estado | HEX | Uso |
|--------|-----|-----|
| **Éxito** | `#10b981` | Mensajes de éxito, barras de fuerza |
| **Error** | `#ef4444` | Mensajes de error |
| **Warning** | `#f59e0b` | Contraseña débil |
| **Texto principal** | `#ffffff` | Títulos, inputs |
| **Texto secundario** | `#a1a1aa` | Labels, placeholders |
| **Texto muted** | `#71717a` | Textos auxiliares |

---

## 🔐 Pantalla de Login (`/auth/login`)

### Layout
```
┌─────────────────────────────────────┐
│            Logo FM                   │
│        ¡Bienvenido de nuevo!        │
│    Inicia sesión para acceder...    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 📧 Correo electrónico       │    │
│  │ ────────────────────────    │    │
│  │ tu@email.com                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔒 Contraseña          👁️   │    │
│  │ ────────────────────────    │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ☐ Recuérdame    ¿Olvidaste...?    │
│                                     │
│  ╔═════════════════════════════╗    │
│  ║   Iniciar sesión      →     ║    │
│  ╚═════════════════════════════╝    │
│                                     │
│  ──────── o continúa con ────────  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      🅶  Google              │    │
│  └─────────────────────────────┘    │
│                                     │
│   ¿No tienes cuenta? Regístrate    │
└─────────────────────────────────────┘
```

### Elementos UI

| Elemento | Estilo |
|----------|--------|
| **Card** | `bg-dark-400/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8` |
| **Logo** | `w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-fuchsia` |
| **Título** | `text-3xl font-display font-bold text-white` |
| **Subtítulo** | `text-zinc-400` |
| **Labels** | `text-sm font-medium text-zinc-300 mb-2` |
| **Inputs** | `bg-dark-500 border border-white/10 rounded-xl text-white py-3 px-4` |
| **Input focus** | `focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan` |
| **Botón primario** | `bg-gradient-to-r from-neon-cyan to-neon-cyan-light text-dark-500 font-semibold rounded-xl py-3.5` |
| **Botón hover** | `hover:shadow-lg hover:shadow-neon-cyan/25` |
| **Botón Google** | `bg-dark-500 border border-white/10 rounded-xl hover:bg-dark-300` |
| **Links** | `text-neon-cyan hover:text-neon-cyan-light` |
| **Error box** | `bg-red-500/10 border border-red-500/30 rounded-xl text-red-400` |
| **Checkbox** | `rounded border-white/20 bg-dark-500 text-neon-cyan` |

### Funcionalidades
- ✅ Toggle visibilidad contraseña (icono ojo)
- ✅ Mensaje de error estilizado
- ✅ Spinner en botón durante carga
- ✅ Redirección post-login configurable
- ✅ OAuth con Google

---

## 📝 Pantalla de Registro (`/auth/registro`)

### Layout
```
┌─────────────────────────────────────┐
│            Logo FM                   │
│         Crea tu cuenta              │
│   Únete a FashionMarket y...        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 👤 Nombre completo          │    │
│  │ Juan García                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📧 Correo electrónico       │    │
│  │ tu@email.com                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔒 Contraseña          👁️   │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│  ▓▓▓▓░░░░░░░░ Media               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔒 Confirmar contraseña     │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ☑ Acepto Términos y Privacidad    │
│  ☐ Quiero recibir ofertas...       │
│                                     │
│  ╔═════════════════════════════╗    │
│  ║   Crear cuenta         👤+  ║    │
│  ╚═════════════════════════════╝    │
│                                     │
│  ──────── o regístrate con ─────── │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      🅶  Google              │    │
│  └─────────────────────────────┘    │
│                                     │
│    ¿Ya tienes cuenta? Inicia       │
└─────────────────────────────────────┘
```

### Indicador de Fuerza de Contraseña

```
Contraseña: ********
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Fuerte ← 4 barras verdes
```

| Nivel | Barras | Color | Condición |
|-------|--------|-------|-----------|
| Muy débil | 1 | `#ef4444` (rojo) | < 6 caracteres |
| Débil | 2 | `#f97316` (naranja) | ≥ 6 caracteres |
| Media | 3 | `#eab308` (amarillo) | + mayúsculas/minúsculas |
| Fuerte | 4 | `#22c55e` (verde) | + números o especiales |

### Campos del Formulario

| Campo | Tipo | Validación | Placeholder |
|-------|------|------------|-------------|
| Nombre completo | `text` | Requerido | "Juan García" |
| Email | `email` | Requerido, formato email | "tu@email.com" |
| Contraseña | `password` | Min 6 caracteres | "Mínimo 6 caracteres" |
| Confirmar | `password` | Debe coincidir | "Repite tu contraseña" |
| Términos | `checkbox` | Requerido | - |
| Newsletter | `checkbox` | Opcional | - |

### Mensajes

| Tipo | Estilo |
|------|--------|
| **Error** | `bg-red-500/10 border-red-500/30 text-red-400 rounded-xl p-4` |
| **Éxito** | `bg-green-500/10 border-green-500/30 text-green-400 rounded-xl p-4` |

---

## 🔄 Estados de los Botones

### Normal
```css
bg-gradient-to-r from-neon-cyan to-neon-cyan-light
text-dark-500
font-semibold
rounded-xl
```

### Hover
```css
hover:shadow-lg
hover:shadow-neon-cyan/25
transition-all duration-200
```

### Loading
```html
<svg class="animate-spin w-5 h-5" ...>
<span>Iniciando sesión...</span>
```

### Disabled
```css
disabled: true
opacity reducida
cursor no permitido
```

---

## 📱 Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| Mobile | Card ocupa 100% - padding |
| Desktop | Card max-width: 448px (max-w-md) |
| Altura mínima | `min-h-[80vh]` |
| Centrado | `flex items-center justify-center` |

---

## 🎬 Transiciones y Animaciones

| Elemento | Animación |
|----------|-----------|
| Inputs focus | `transition-colors` suave |
| Botones | `transition-all duration-200` |
| Spinner | `animate-spin` |
| Hover efectos | Shadow glow con `neon-cyan/25` |
| Barras de fuerza | `transition-colors` en cambio |

---

## 🔗 Navegación

| Desde | Hacia | Link |
|-------|-------|------|
| Login | Registro | "Regístrate gratis" |
| Login | Recuperar | "¿Olvidaste tu contraseña?" |
| Registro | Login | "Inicia sesión" |
| Ambos | Home | Logo clicable |
