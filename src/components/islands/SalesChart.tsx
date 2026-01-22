/**
 * SalesChart Component - Gráfico de Ventas con Identidad de Marca
 * 
 * Usa los colores de marca definidos en brand-colors.ts para mantener
 * consistencia visual con el tema "Futuristic Dark" del sitio.
 * 
 * NOTA: Recharts no acepta clases Tailwind, por eso importamos los colores
 * como constantes HEX desde brand-colors.ts
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { brandColors, chartColors, hexToRgba } from '../../lib/brand-colors';

interface DailySales {
  date: string;
  total: number;
}

interface SalesChartProps {
  data: DailySales[];
  title?: string;
}

// Formateador de fecha para el eje X
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric' 
  });
};

// Formateador de moneda para tooltips
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(value);
};

// Tooltip personalizado con estilos de marca
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return (
      <div 
        style={{
          background: brandColors.dark[400],
          border: `1px solid ${brandColors.glass.border}`,
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${hexToRgba(brandColors.primary.main, 0.1)}`,
        }}
      >
        <p 
          style={{ 
            fontSize: '12px', 
            color: brandColors.text.muted,
            textTransform: 'capitalize',
            marginBottom: '8px'
          }}
        >
          {formattedDate}
        </p>
        <p 
          style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            background: `linear-gradient(135deg, ${brandColors.primary.main}, ${brandColors.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data, title = 'Ventas últimos 7 días' }: SalesChartProps) {
  // Transformar datos para mostrar formato legible
  const chartData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date),
    formattedTotal: formatCurrency(item.total)
  }));

  // Calcular total del periodo
  const totalPeriod = data.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = totalPeriod / (data.length || 1);
  const maxSales = Math.max(...data.map(d => d.total));
  const minSales = Math.min(...data.map(d => d.total));
  const daysWithSales = data.filter(d => d.total > 0).length;

  return (
    <div 
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: brandColors.dark[400],
        border: `1px solid ${brandColors.glass.border}`,
      }}
    >
      {/* Glow effect sutil */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: brandColors.primary.main }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 
            className="text-lg font-semibold mb-1"
            style={{ color: brandColors.text.primary }}
          >
            {title}
          </h3>
          <p style={{ color: brandColors.text.muted, fontSize: '14px' }}>
            Total: <span style={{ color: brandColors.primary.main, fontWeight: 600 }}>
              {formatCurrency(totalPeriod)}
            </span>
            {' · '}
            Promedio: <span style={{ color: brandColors.text.secondary }}>
              {formatCurrency(avgDaily)}/día
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${brandColors.primary.main}, ${brandColors.primary.light})`,
              boxShadow: `0 0 8px ${hexToRgba(brandColors.primary.main, 0.5)}`
            }}
          />
          <span style={{ color: brandColors.text.muted, fontSize: '13px' }}>
            Ventas
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGradientBrand" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={brandColors.primary.main} 
                  stopOpacity={0.4} 
                />
                <stop 
                  offset="95%" 
                  stopColor={brandColors.primary.main} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={chartColors.grid.line}
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: brandColors.text.muted, fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: brandColors.text.muted, fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={brandColors.primary.main}
              strokeWidth={3}
              fill="url(#salesGradientBrand)"
              dot={{ 
                fill: brandColors.dark[400], 
                stroke: brandColors.primary.main,
                strokeWidth: 2, 
                r: 5 
              }}
              activeDot={{ 
                r: 8, 
                fill: brandColors.primary.main, 
                stroke: brandColors.dark[400], 
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini estadísticas */}
      <div 
        className="grid grid-cols-3 gap-4 mt-6 pt-6 relative z-10"
        style={{ borderTop: `1px solid ${brandColors.glass.border}` }}
      >
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ color: brandColors.status.success }}
          >
            {formatCurrency(maxSales)}
          </p>
          <p style={{ color: brandColors.text.muted, fontSize: '12px', marginTop: '4px' }}>
            Mejor día
          </p>
        </div>
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ color: minSales > 0 ? brandColors.text.secondary : brandColors.status.warning }}
          >
            {formatCurrency(minSales)}
          </p>
          <p style={{ color: brandColors.text.muted, fontSize: '12px', marginTop: '4px' }}>
            Día más bajo
          </p>
        </div>
        <div className="text-center">
          <p 
            className="text-2xl font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${brandColors.primary.main}, ${brandColors.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {daysWithSales}
          </p>
          <p style={{ color: brandColors.text.muted, fontSize: '12px', marginTop: '4px' }}>
            Días con ventas
          </p>
        </div>
      </div>
    </div>
  );
}
