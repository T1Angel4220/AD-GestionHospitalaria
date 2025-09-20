// components/reports/StatsCards.tsx
import React from 'react';
import { Users, Stethoscope, Calendar, TrendingUp } from 'lucide-react';
import type { ConsultaResumen } from '../../types/reports';
import { calculateStatistics } from '../../lib/utils';

interface StatsCardsProps {
  data: ConsultaResumen[];
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data, loading = false }) => {
  const stats = calculateStatistics(data);

  const cards = [
    {
      title: 'Total Consultas',
      value: stats.totalConsultas,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Médicos Activos',
      value: stats.totalMedicos,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Promedio por Médico',
      value: stats.promedioConsultasPorMedico,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Especialidad Más Común',
      value: stats.especialidadMasComun,
      icon: Stethoscope,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid-professional grid-4 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="icon-container">
                <div className="w-6 h-6 bg-gray-200 rounded loading-skeleton"></div>
              </div>
              <div className="w-3 h-3 bg-gray-200 rounded-full loading-skeleton"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 loading-skeleton"></div>
              <div className="h-12 bg-gray-200 rounded w-1/2 loading-skeleton"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid-professional grid-4 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="icon-container">
                <Icon className="icon-professional" />
              </div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div>
              <p className="stat-label">{card.title}</p>
              <p className="stat-number">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};