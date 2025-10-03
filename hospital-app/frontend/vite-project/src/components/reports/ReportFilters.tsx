import React from 'react';
import { Filter, Download } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Filtros principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </div>
  );
};