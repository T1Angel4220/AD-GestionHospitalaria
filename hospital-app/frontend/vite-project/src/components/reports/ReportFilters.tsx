import React from 'react';
import { Search, Calendar, Filter, Download, X } from 'lucide-react';
import type { ReporteFiltros, CentroMedico } from '../../api/reports';

interface ReportFiltersProps {
  filtros: ReporteFiltros;
  onFiltrosChange: (filtros: ReporteFiltros) => void;
  onGenerarReporte: (filtros: ReporteFiltros) => void;
  onExportarReporte: () => void;
  loading?: boolean;
  centros?: CentroMedico[];
  isAdmin?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filtros,
  onFiltrosChange,
  onGenerarReporte,
  onExportarReporte,
  loading = false,
  centros = [],
  isAdmin = false
}) => {
  const handleInputChange = (field: keyof ReporteFiltros, value: string | number | 'all') => {
    onFiltrosChange({
      ...filtros,
      [field]: value === '' ? undefined : value
    });
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      centroId: filtros.centroId,
      desde: undefined,
      hasta: undefined,
      q: undefined
    });
  };

  const tieneFiltros = filtros.desde || filtros.hasta || filtros.q;

  return (
    <div className="space-y-6">
      {/* Filtros principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha Desde */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            Fecha Desde
          </label>
          <input
            type="date"
            value={filtros.desde || ''}
            onChange={(e) => handleInputChange('desde', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            Fecha Hasta
          </label>
          <input
            type="date"
            value={filtros.hasta || ''}
            onChange={(e) => handleInputChange('hasta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Búsqueda */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            Buscar
          </label>
          <input
            type="text"
            placeholder="Paciente, motivo, diagnóstico..."
            value={filtros.q || ''}
            onChange={(e) => handleInputChange('q', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Centro Médico */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Centro Médico
          </label>
          {isAdmin && centros.length > 0 ? (
            <select
              value={filtros.centroId || 'all'}
              onChange={(e) => handleInputChange('centroId', e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            >
              <option value="all">Todos los centros</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nombre} - {centro.ciudad} (ID: {centro.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              placeholder="ID del Centro"
              value={filtros.centroId || ''}
              onChange={(e) => handleInputChange('centroId', (parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onGenerarReporte(filtros)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          <Filter className="w-4 h-4 mr-2" />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>

        <button
          onClick={onExportarReporte}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-lg hover:from-amber-500 hover:to-yellow-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </button>

        {tieneFiltros && (
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Resumen de filtros activos */}
      {tieneFiltros && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
            <h4 className="text-sm font-semibold text-amber-900">Filtros Activos</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {filtros.desde && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-amber-700">Desde:</span>
                <span className="text-amber-900">{filtros.desde}</span>
              </div>
            )}
            {filtros.hasta && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-amber-700">Hasta:</span>
                <span className="text-amber-900">{filtros.hasta}</span>
              </div>
            )}
            {filtros.q && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-amber-700">Búsqueda:</span>
                <span className="text-amber-900">"{filtros.q}"</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium text-amber-700">Centro:</span>
              <span className="text-amber-900">
                {filtros.centroId === 'all' 
                  ? 'Todos los centros'
                  : isAdmin && centros.length > 0 
                    ? centros.find(c => c.id === filtros.centroId)?.nombre || `ID ${filtros.centroId}`
                    : `ID ${filtros.centroId}`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};