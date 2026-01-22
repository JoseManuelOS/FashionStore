/**
 * Brand Colors - Constantes de colores de marca para componentes JS
 * 
 * Este archivo mapea los colores definidos en tailwind.config.mjs a valores HEX
 * para usar en librerías que no soportan clases Tailwind (ej: Recharts, Canvas, etc.)
 * 
 * IMPORTANTE: Mantener sincronizado con tailwind.config.mjs
 */

// ============================================
// PALETA DE MARCA - FUTURISTIC DARK THEME
// ============================================

export const brandColors = {
  // Colores Principales (Neon)
  primary: {
    main: '#06b6d4',      // neon-cyan - Color principal de marca
    light: '#22d3ee',     // neon-cyan-light
    dark: '#0891b2',      // neon-cyan-dark
  },
  
  secondary: {
    main: '#d946ef',      // neon-fuchsia - Color de acento secundario
    light: '#e879f9',     // neon-fuchsia-light
    dark: '#a21caf',      // neon-fuchsia-dark
  },
  
  accent: {
    blue: '#3b82f6',      // neon-blue
    purple: '#8b5cf6',    // neon-purple
  },

  // Fondos Oscuros
  dark: {
    50: '#f5f5f6',
    100: '#2a2a35',
    200: '#1f1f28',
    300: '#18181f',
    400: '#12121a',
    500: '#0d0d14',       // Fondo principal
    600: '#0a0a0f',       // Fondo body
    700: '#080810',
    800: '#050508',
    900: '#020204',
    950: '#000000',
  },

  // Textos
  text: {
    primary: '#ffffff',
    secondary: '#e4e4e7',   // zinc-200
    muted: '#a1a1aa',       // zinc-400
    subtle: '#71717a',      // zinc-500
  },

  // Estados
  status: {
    success: '#10b981',     // emerald-500
    successLight: '#d1fae5', // emerald-100
    warning: '#f59e0b',      // amber-500
    warningLight: '#fef3c7', // amber-100
    error: '#ef4444',        // red-500
    errorLight: '#fee2e2',   // red-100
    info: '#3b82f6',         // blue-500
    infoLight: '#dbeafe',    // blue-100
  },

  // Glass/Transparencias
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.08)',
    heavy: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Gradientes (como strings CSS)
  gradients: {
    primary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    secondary: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
    cyanFuchsia: 'linear-gradient(90deg, #06b6d4, #d946ef)',
    hero: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #0f172a 50%, #0d0d14 100%)',
    card: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
  },
} as const;

// ============================================
// COLORES ESPECÍFICOS PARA RECHARTS
// ============================================

export const chartColors = {
  // Color principal del gráfico
  primary: brandColors.primary.main,
  primaryLight: brandColors.primary.light,
  primaryDark: brandColors.primary.dark,
  
  // Colores para series múltiples
  series: [
    brandColors.primary.main,    // #06b6d4 - Cyan
    brandColors.secondary.main,  // #d946ef - Fuchsia
    brandColors.accent.purple,   // #8b5cf6 - Purple
    brandColors.accent.blue,     // #3b82f6 - Blue
    brandColors.status.success,  // #10b981 - Green
    brandColors.status.warning,  // #f59e0b - Amber
  ],
  
  // Tooltip
  tooltip: {
    background: brandColors.dark[400],
    border: brandColors.glass.border,
    text: brandColors.text.primary,
    textMuted: brandColors.text.muted,
  },
  
  // Grid y ejes
  grid: {
    line: 'rgba(255, 255, 255, 0.08)',
    axis: brandColors.text.subtle,
  },
  
  // Áreas con gradiente
  gradientStops: {
    start: { color: brandColors.primary.main, opacity: 0.4 },
    end: { color: brandColors.primary.main, opacity: 0 },
  },
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Convierte un color HEX a RGBA
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Obtiene un color de la serie para gráficos con múltiples datasets
 */
export function getSeriesColor(index: number): string {
  return chartColors.series[index % chartColors.series.length];
}

/**
 * Genera paradas de gradiente para AreaChart
 */
export function getAreaGradient(id: string, color: string = chartColors.primary) {
  return {
    id,
    color,
    startOpacity: 0.4,
    endOpacity: 0,
  };
}

// Type exports
export type BrandColors = typeof brandColors;
export type ChartColors = typeof chartColors;
