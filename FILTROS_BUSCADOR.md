# FashionStore - Filtros del Buscador

## 📍 Ubicación
**Componente:** `src/components/islands/FilterSidebar.tsx`  
**Vista:** `/productos`  

---

## 🔍 Filtros Disponibles

### 1. Búsqueda por Texto
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Input de texto |
| **Parámetro URL** | `buscar` |
| **Placeholder** | "Buscar..." |
| **Acción** | Enter o clic en flecha → Navega con filtro |

---

### 2. Rango de Precio
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Doble slider + inputs numéricos |
| **Parámetro URL Min** | `precioMin` |
| **Parámetro URL Max** | `precioMax` |
| **Rango** | 0 € - `maxPrice` (dinámico) |
| **Separación mínima** | 10 € entre min y max |

---

### 3. Estilos Populares (Tags)
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Botones toggle (selección única) |
| **Parámetro URL** | `buscar` (usa el search) |
| **Comportamiento** | Click activa/desactiva tag |

#### Tags disponibles:
```
Manga corta, Manga larga, Slim fit, Regular, Casual, Formal,
Verano, Invierno, Primavera, Otoño
```

---

### 4. Solo Ofertas
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Toggle switch prominente |
| **Parámetro URL** | `ofertas=true` |
| **Estilo activo** | Gradiente rosa + animación pulse |

---

### 5. Categoría
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Dropdown colapsable (details/summary) |
| **Parámetro URL** | `categoria` |
| **Opciones** | "Todas" + categorías desde DB |
| **Selección** | Única (radio-like) |

---

### 6. Tallas
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Dropdown colapsable con botones |
| **Parámetro URL** | `tallas` (valores separados por coma) |
| **Opciones** | Array `allSizes` desde DB |
| **Selección** | Múltiple (checkbox-like) |

#### Tallas típicas:
```
XS, S, M, L, XL, XXL
```

---

### 7. Color
| Propiedad | Valor |
|-----------|-------|
| **Tipo** | Dropdown colapsable con círculos de color |
| **Parámetro URL** | `color` |
| **Selección** | Única |

#### Colores disponibles:
| Valor | Color | HEX |
|-------|-------|-----|
| `negro` | Negro | `#1a1a1a` |
| `blanco` | Blanco | `#ffffff` |
| `azul` | Azul | `#1e3a5f` |
| `gris` | Gris | `#6b7280` |
| `beige` | Beige | `#d4c4a8` |

---

## 🔗 Estructura de URL

```
/productos?buscar={texto}&categoria={slug}&tallas={S,M,L}&precioMin={0}&precioMax={100}&ofertas=true&color={negro}
```

### Ejemplo URLs:
```
/productos?categoria=camisas&tallas=M,L&ofertas=true
/productos?buscar=Manga+corta&precioMax=50
/productos?color=azul&precioMin=30&precioMax=80
```

---

## 🎨 Estados Visuales

| Estado | Estilo |
|--------|--------|
| **Filtro inactivo** | Borde `white/10`, texto `zinc-400/500` |
| **Filtro activo** | Borde `neon-cyan`, texto `neon-cyan`, fondo `neon-cyan/10` |
| **Ofertas activo** | Gradiente rosa/cyan, borde `fuchsia/40`, sombra |
| **Hover** | Borde `white/30`, texto `white` |

---

## 🔄 Funciones Principales

| Función | Descripción |
|---------|-------------|
| `navigateWithFilters()` | Construye URL y navega |
| `handleCategoryChange()` | Cambia categoría y navega |
| `handleOffersToggle()` | Toggle ofertas |
| `handleStyleTagClick()` | Selecciona/deselecciona tag |
| `handleSizeToggle()` | Agrega/quita talla |
| `handleColorChange()` | Cambia color seleccionado |
| `clearFilters()` | Limpia todos → `/productos` |

---

## 📊 Contador de Filtros Activos

Se muestra botón "Limpiar filtros (N)" cuando hay filtros activos:
- Categoría seleccionada
- Tallas seleccionadas (≥1)
- Precio mínimo > 0
- Precio máximo < max
- Ofertas activado
- Color seleccionado
