import React from 'react';
import { Search, Calendar, Filter, Download, X } from 'lucide-react';
import type { ReporteFiltros } from '../../api/reports';

interface ReportFiltersProps {
  filtros: ReporteFiltros;
  onFiltrosChange: (filtros: ReporteFiltros) => void;
  onGenerarReporte: () => void;
  onExportarReporte: () => void;
  loading?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filtros,
  onFiltrosChange,
  onGenerarReporte,
  onExportarReporte,
  loading = false
}) => {
  const handleInputChange = (field: keyof ReporteFiltros, value: string) => {
    onFiltrosChange({
      ...filtros,
      [field]: value || undefined
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Centro Médico */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Centro Médico
          </label>
          <input
            type="number"
            placeholder="ID del Centro"
            value={filtros.centroId || ''}
            onChange={(e) => handleInputChange('centroId', (parseInt(e.target.value) || 1).toString())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onGenerarReporte}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>

        <button
          onClick={onExportarReporte}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </button>

        {tieneFiltros && (
          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Resumen de filtros activos */}
      {tieneFiltros && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <h4 className="text-sm font-semibold text-blue-900">Filtros Activos</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {filtros.desde && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">Desde:</span>
                <span className="text-blue-900">{filtros.desde}</span>
              </div>
            )}
            {filtros.hasta && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">Hasta:</span>
                <span className="text-blue-900">{filtros.hasta}</span>
              </div>
            )}
            {filtros.q && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">Búsqueda:</span>
                <span className="text-blue-900">"{filtros.q}"</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-700">Centro:</span>
              <span className="text-blue-900">ID {filtros.centroId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};