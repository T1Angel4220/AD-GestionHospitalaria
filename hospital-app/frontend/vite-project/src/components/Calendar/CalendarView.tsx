import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarStyles.css';
import type { CalendarEvent } from './CalendarUtils';
import { convertConsultasToEvents, getCalendarMessages } from './CalendarUtils';
import type { Consulta, Medico } from '../../types/consultas';
import { Plus, Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Filter, CalendarDays, Search, Stethoscope } from 'lucide-react';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

      // Filtro por rango de fechas
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const consultaDate = moment(consulta.fecha);
        if (dateFrom) {
          matchesDateRange = matchesDateRange && consultaDate.isSameOrAfter(moment(dateFrom), 'day');
        }
        if (dateTo) {
          matchesDateRange = matchesDateRange && consultaDate.isSameOrBefore(moment(dateTo), 'day');
        }
      }

      return matchesSearch && matchesMedico && matchesStatus && matchesDateRange;
    });
  }, [consultas, searchTerm, selectedMedico, selectedStatus, dateFrom, dateTo]);

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
    setCurrentDate(date);
    onNavigate(date);
  };

  // Navegación del calendario
  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onNavigate(today);
  };

  const navigateToPrevious = () => {
    let newDate;
    if (currentView === Views.MONTH) {
      newDate = moment(currentDate).subtract(1, 'month').toDate();
    } else if (currentView === Views.WEEK) {
      newDate = moment(currentDate).subtract(1, 'week').toDate();
    } else {
      newDate = moment(currentDate).subtract(1, 'day').toDate();
    }
    setCurrentDate(newDate);
    onNavigate(newDate);
  };

  const navigateToNext = () => {
    let newDate;
    if (currentView === Views.MONTH) {
      newDate = moment(currentDate).add(1, 'month').toDate();
    } else if (currentView === Views.WEEK) {
      newDate = moment(currentDate).add(1, 'week').toDate();
    } else {
      newDate = moment(currentDate).add(1, 'day').toDate();
    }
    setCurrentDate(newDate);
    onNavigate(newDate);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMedico('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
  };

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
      },
      'data-status': event.resource.status
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Consultas</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
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
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
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
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
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

      {/* Calendario Principal */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header del Calendario */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Título y Filtros */}
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-bold text-white">Calendario de Consultas</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>

            {/* Botón Nueva Consulta */}
            <button
              onClick={onCreateConsulta}
              className="flex items-center px-4 py-2 bg-white text-cyan-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Consulta
            </button>
          </div>
        </div>

        {/* Filtros Expandibles */}
        {showFilters && (
          <div className="px-6 py-6 bg-gradient-to-r from-violet-50 to-violet-100 border-b border-violet-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-violet-800">
                  <Search className="h-4 w-4 inline mr-2" />
                  Buscar paciente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre del paciente..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white shadow-sm"
                  />
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-violet-400" />
                </div>
              </div>

              {/* Médico */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-violet-800">
                  <Stethoscope className="h-4 w-4 inline mr-2" />
                  Médico
                </label>
                <select
                  value={selectedMedico}
                  onChange={(e) => setSelectedMedico(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white shadow-sm"
                >
                  <option value="all">Todos los médicos</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id.toString()}>
                      Dr. {medico.nombres} {medico.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-cyan-800">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white shadow-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="programada">Programada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Rango de fechas mejorado */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-cyan-800">
                  <CalendarDays className="h-4 w-4 inline mr-2" />
                  Rango de fechas
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-cyan-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white shadow-sm text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cyan-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white shadow-sm text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción de filtros */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={clearFilters}
                className="px-6 py-2 text-sm font-medium text-cyan-700 bg-cyan-200 rounded-lg hover:bg-cyan-300 transition-colors"
              >
                Limpiar Filtros
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Controles de Navegación y Vista */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Navegación de fechas */}
            <div className="flex items-center space-x-2">
              <button
                onClick={navigateToToday}
                className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-100 border border-cyan-200 rounded-lg hover:bg-cyan-200 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={navigateToPrevious}
                className="p-2 text-cyan-600 bg-cyan-100 border border-cyan-200 rounded-lg hover:bg-cyan-200 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={navigateToNext}
                className="p-2 text-cyan-600 bg-cyan-100 border border-cyan-200 rounded-lg hover:bg-cyan-200 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Vista actual */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900">
                {currentView === Views.MONTH && moment(currentDate).format('MMMM YYYY')}
                {currentView === Views.WEEK && `${moment(currentDate).startOf('week').format('DD MMM')} - ${moment(currentDate).endOf('week').format('DD MMM YYYY')}`}
                {currentView === Views.DAY && moment(currentDate).format('dddd, DD MMMM YYYY')}
                {currentView === Views.AGENDA && 'Agenda de Consultas'}
              </h4>
            </div>

            {/* Controles de vista mejorados */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleViewChange(Views.MONTH)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === Views.MONTH
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200'
                }`}
              >
                <CalendarIcon className="h-4 w-4 inline mr-2" />
                Mes
              </button>
              <button
                onClick={() => handleViewChange(Views.WEEK)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === Views.WEEK
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200'
                }`}
              >
                <CalendarDays className="h-4 w-4 inline mr-2" />
                Semana
              </button>
              <button
                onClick={() => handleViewChange(Views.DAY)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === Views.DAY
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Día
              </button>
              <button
                onClick={() => handleViewChange(Views.AGENDA)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === Views.AGENDA
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Agenda
              </button>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="p-6">
          <div className="h-96">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={currentView}
              date={currentDate}
              onView={handleViewChange}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={getCalendarMessages()}
              components={{
                toolbar: () => null // Ocultar toolbar nativo
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;