import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus 
}) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros y Búsqueda</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, médico, especialidad o hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">Todos los estado</option>
                <option value="pendiente">Pendientes</option>
                <option value="programada">Programadas</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="all">Todas las especialidad</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
