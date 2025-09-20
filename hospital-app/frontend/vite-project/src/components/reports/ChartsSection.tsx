// components/reports/ChartsSection.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ConsultaResumen } from '../../types/reports';

interface ChartsSectionProps {
  data: ConsultaResumen[];
  loading?: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data, loading = false }) => {
  // Preparar datos para gráfico de barras (top 10 médicos)
  const topMedicos = data
    .sort((a, b) => b.total_consultas - a.total_consultas)
    .slice(0, 10)
    .map(medico => ({
      nombre: `${medico.nombres.split(' ')[0]} ${medico.apellidos.split(' ')[0]}`,
      consultas: medico.total_consultas,
      especialidad: medico.especialidad
    }));

  // Preparar datos para gráfico de pie (especialidades)
  const especialidadesData = data.reduce((acc, medico) => {
    const existing = acc.find(item => item.name === medico.especialidad);
    if (existing) {
      existing.value += medico.total_consultas;
    } else {
      acc.push({
        name: medico.especialidad,
        value: medico.total_consultas
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  // Colores profesionales en escala de grises
  const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'];

  if (loading) {
    return (
      <div className="grid-professional grid-2 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="card-elevated p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="icon-container">
                <div className="w-6 h-6 bg-gray-200 rounded loading-skeleton"></div>
              </div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 loading-skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 loading-skeleton"></div>
              </div>
            </div>
            <div className="h-80 bg-gray-200 rounded loading-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-elevated mb-8 p-8 text-center">
        <div className="icon-container mx-auto mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <p className="text-body text-gray-500">No hay datos suficientes para mostrar gráficos</p>
      </div>
    );
  }

  return (
    <div className="grid-professional grid-2 mb-8">
      {/* Gráfico de barras - Top médicos */}
      <div className="card-elevated p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="icon-container">
            <div className="w-6 h-6 bg-white rounded"></div>
          </div>
          <div>
            <h3 className="text-subheading font-semibold">Top 10 Médicos</h3>
            <p className="text-caption">Médicos con más consultas</p>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMedicos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="nombre" 
                stroke="#737373"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#404040', fontWeight: '600' }}
              />
              <Bar dataKey="consultas" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de pie - Especialidades */}
      <div className="card-elevated p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="icon-container">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <div>
            <h3 className="text-subheading font-semibold">Distribución por Especialidades</h3>
            <p className="text-caption">Consultas por especialidad médica</p>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={especialidadesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {especialidadesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#404040', fontWeight: '600' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};