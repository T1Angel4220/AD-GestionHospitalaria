import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { ConsultaResumen } from '../../api/reports';

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

  // Colores profesionales
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
            <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200 mb-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No hay datos suficientes para mostrar gráficos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Gráfico de barras - Top médicos */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200" data-chart="bar-chart">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top 10 Médicos</h3>
            <p className="text-sm text-gray-600">Médicos con más consultas</p>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMedicos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="nombre" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
              />
              <Bar dataKey="consultas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de pie - Especialidades */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200" data-chart="pie-chart">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <PieChartIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Especialidades</h3>
            <p className="text-sm text-gray-600">Consultas por especialidad médica</p>
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
                label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {especialidadesData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};