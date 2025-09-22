import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, convertConsultasToEvents, getCalendarMessages } from './CalendarUtils';
import { Consulta, Medico } from '../../types/consultas';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { CalendarFilters } from './CalendarFilters';
import { Plus, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

// Configurar moment para español
moment.locale('es', {
  months: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  weekdays: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  weekdaysMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S']
});

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  consultas: Consulta[];
  medicos: Medico[];
  loading: boolean;
  onCreateConsulta: () => void;
  onEditConsulta: (consulta: Consulta) => void;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  consultas,
  medicos,
  loading,
  onCreateConsulta,
  onEditConsulta,
  onViewChange,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedico, setSelectedMedico] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  // Filtrar consultas
  const filteredConsultas = useMemo(() => {
    return consultas.filter((consulta) => {
      const matchesSearch = !searchTerm || 
        consulta.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.paciente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMedico = selectedMedico === 'all' || 
        consulta.id_medico?.toString() === selectedMedico;

      const matchesStatus = selectedStatus === 'all' || 
        consulta.estado === selectedStatus;

      return matchesSearch && matchesMedico && matchesStatus;
    });
  }, [consultas, searchTerm, selectedMedico, selectedStatus]);

  // Convertir consultas a eventos del calendario
  const events = useMemo(() => {
    return convertConsultasToEvents(filteredConsultas);
  }, [filteredConsultas]);

  // Manejar clic en evento
  const handleSelectEvent = (event: CalendarEvent) => {
    onEditConsulta(event.resource.consulta);
  };

  // Manejar cambio de vista
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    onViewChange(view);
  };

  // Manejar navegación
  const handleNavigate = (date: Date) => {
    onNavigate(date);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMedico('all');
    setSelectedStatus('all');
  };

  // Aplicar filtros
  const handleFilterChange = () => {
    // Los filtros se aplican automáticamente por el useMemo
  };

  // Componente personalizado para eventos
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <CalendarEventComponent
      event={event}
      onClick={handleSelectEvent}
    />
  );

  // Estilos personalizados para el calendario
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: 'white',
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <CalendarFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMedico={selectedMedico}
        setSelectedMedico={setSelectedMedico}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        medicos={medicos}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Consultas</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.resource.status === 'programada').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.resource.status === 'completada').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.resource.status === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Calendario de Consultas</h3>
          <button
            onClick={onCreateConsulta}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Consulta
          </button>
        </div>

        <div className="h-96">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={currentView}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            components={{
              event: EventComponent
            }}
            eventPropGetter={eventStyleGetter}
            messages={getCalendarMessages()}
            popup
            showMultiDayTimes
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 7, 0)} // 7:00 AM
            max={new Date(2024, 0, 1, 19, 0)} // 7:00 PM
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
