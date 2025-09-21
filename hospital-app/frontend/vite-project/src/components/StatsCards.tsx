import React from 'react';
import { FileText, TrendingUp, CalendarIcon, Users } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    completada: number;
    programada: number;
    cancelada: number;
    pendiente: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      icon: FileText,
      label: 'Total Consultas',
      value: stats.total,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Completadas',
      value: stats.completada,
      color: 'green'
    },
    {
      icon: CalendarIcon,
      label: 'Programadas',
      value: stats.programada,
      color: 'blue'
    },
    {
      icon: Users,
      label: 'Canceladas',
      value: stats.cancelada,
      color: 'red'
    }
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${
                    card.color === 'blue' ? 'bg-blue-500' :
                    card.color === 'green' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.label}</dt>
                    <dd className="text-lg font-medium text-gray-900">{card.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
