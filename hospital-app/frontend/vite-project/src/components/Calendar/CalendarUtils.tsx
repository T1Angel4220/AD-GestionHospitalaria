import moment from 'moment';
import type { Consulta } from '../../types/consultas';

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    consulta: Consulta;
    status: string;
    color: string;
  };
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pendiente':
      return '#fbbf24'; // amber-400
    case 'programada':
      return '#3b82f6'; // blue-500
    case 'completada':
      return '#10b981'; // emerald-500
    case 'cancelada':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pendiente':
      return 'Pendiente';
    case 'programada':
      return 'Programada';
    case 'completada':
      return 'Completada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return status;
  }
};

export const convertConsultasToEvents = (consultas: Consulta[]): CalendarEvent[] => {
  return consultas.map((consulta) => {
    const startDate = moment(consulta.fecha).toDate();
    const endDate = moment(consulta.fecha).add(1, 'hour').toDate();
    
    return {
      id: consulta.id,
      title: `${consulta.paciente_nombre} ${consulta.paciente_apellido}`,
      start: startDate,
      end: endDate,
      resource: {
        consulta,
        status: consulta.estado,
        color: getStatusColor(consulta.estado)
      }
    };
  });
};

export const formatEventTime = (date: Date): string => {
  return moment(date).format('HH:mm');
};

export const formatEventDate = (date: Date): string => {
  return moment(date).format('DD/MM/YYYY');
};

export const getEventTooltip = (event: CalendarEvent): string => {
  const { consulta } = event.resource;
  return `
    Paciente: ${consulta.paciente_nombre} ${consulta.paciente_apellido}
    Médico: ${consulta.medico_nombres} ${consulta.medico_apellidos}
    Especialidad: ${consulta.especialidad_nombre || 'N/A'}
    Estado: ${getStatusText(consulta.estado)}
    Motivo: ${consulta.motivo || 'N/A'}
  `.trim();
};

export const getCalendarMessages = () => ({
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay consultas en este rango de fechas',
  showMore: (total: number) => `+ Ver ${total} más`
});
