import React from 'react';
import { CalendarEvent as CalendarEventType } from './CalendarUtils';
import { getStatusText, formatEventTime } from './CalendarUtils';
import { Clock, User, Stethoscope, AlertCircle } from 'lucide-react';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ event, onClick }) => {
  const { consulta, status, color } = event.resource;
  
  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className="cursor-pointer p-2 rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftColor: color }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            {formatEventTime(event.start)}
          </span>
        </div>
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${color}20`,
            color: color
          }}
        >
          {getStatusText(status)}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900 truncate">
            {consulta.paciente_nombre} {consulta.paciente_apellido}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-600 truncate">
            Dr. {consulta.medico_nombres} {consulta.medico_apellidos}
          </span>
        </div>
        
        {consulta.especialidad_nombre && (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600 truncate">
              {consulta.especialidad_nombre}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvent;
