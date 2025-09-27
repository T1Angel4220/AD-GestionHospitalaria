import React from 'react';
import { Filter, Search, User, Stethoscope, Building2 } from 'lucide-react';
import type { Medico } from '../../types/consultas';

interface CalendarFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMedico: string;
  setSelectedMedico: (medico: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  medicos: Medico[];
  onFilterChange: () => void;
  onClearFilters: () => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedMedico,
  setSelectedMedico,
  selectedStatus,
  setSelectedStatus,
  medicos,
  onFilterChange,
  onClearFilters
}) => {
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'programada', label: 'Programada' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const hasActiveFilters = searchTerm || selectedMedico !== 'all' || selectedStatus !== 'all';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros del Calendario</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda por paciente */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            Buscar paciente
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre del paciente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filtro por médico */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Médico
          </label>
          <select
            value={selectedMedico}
            onChange={(e) => setSelectedMedico(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="all">Todos los médicos</option>
            {medicos.map((medico) => (
              <option key={medico.id} value={medico.id.toString()}>
                Dr. {medico.nombres} {medico.apellidos}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por estado */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-gray-500" />
            Estado
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Botón de aplicar filtros */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 opacity-0">
            Aplicar
          </label>
          <button
            onClick={onFilterChange}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">Filtros activos:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-indigo-100 rounded text-indigo-800">
                Búsqueda: "{searchTerm}"
              </span>
            )}
            {selectedMedico !== 'all' && (
              <span className="px-2 py-1 bg-indigo-100 rounded text-indigo-800">
                Médico: {medicos.find(m => m.id.toString() === selectedMedico)?.nombres}
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="px-2 py-1 bg-indigo-100 rounded text-indigo-800">
                Estado: {statusOptions.find(s => s.value === selectedStatus)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarFilters;
