import React from 'react';
import { Users, Stethoscope, Calendar, TrendingUp, UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { EstadisticasGenerales } from '../../api/reports';

interface StatsCardsProps {
  data: EstadisticasGenerales | null;
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data, loading = false }) => {
  const cards = [
    {
      title: 'Total Consultas',
      value: data?.total_consultas || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Total Médicos',
      value: data?.total_medicos || 0,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Pacientes',
      value: data?.total_pacientes || 0,
      icon: UserCheck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Pacientes con Consultas',
      value: data?.pacientes_con_consultas || 0,
      icon: Stethoscope,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Consultas Pendientes',
      value: data?.consultas_pendientes || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Consultas Completadas',
      value: data?.consultas_completadas || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Consultas Canceladas',
      value: data?.consultas_canceladas || 0,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      title: 'Duración Promedio',
      value: data?.duracion_promedio_minutos ? `${Math.round(data.duracion_promedio_minutos)} min` : 'N/A',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`bg-white rounded-xl shadow-lg p-6 border ${card.borderColor} hover:shadow-xl transition-shadow duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};