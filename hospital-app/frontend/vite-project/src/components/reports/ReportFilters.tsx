// components/reports/ReportFilters.tsx
import React from 'react';
import { Button } from '../ui/Button';
import { Search, Calendar, Filter, Download } from 'lucide-react';
import type { ReporteFiltros } from '../../types/reports';

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
    <div className="card-elevated section-spacing animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="icon-container">
          <Filter className="icon-professional" />
        </div>
        <div>
          <h3 className="text-heading">Filtros de Reporte</h3>
          <p className="text-caption">Configure los parámetros para generar el reporte</p>
        </div>
      </div>

      <div className="grid-professional grid-2 lg:grid-4 gap-6 mb-6">
        {/* Fecha Desde */}
        <div className="space-y-2">
          <label className="text-caption font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha Desde
          </label>
          <input
            type="date"
            value={filtros.desde || ''}
            onChange={(e) => handleInputChange('desde', e.target.value)}
            className="input-professional"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="space-y-2">
          <label className="text-caption font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha Hasta
          </label>
          <input
            type="date"
            value={filtros.hasta || ''}
            onChange={(e) => handleInputChange('hasta', e.target.value)}
            className="input-professional"
          />
        </div>

        {/* Búsqueda */}
        <div className="space-y-2">
          <label className="text-caption font-semibold flex items-center gap-2">
            <Search className="w-4 h-4" />
            Buscar
          </label>
          <input
            type="text"
            placeholder="Paciente, motivo, diagnóstico..."
            value={filtros.q || ''}
            onChange={(e) => handleInputChange('q', e.target.value)}
            className="input-professional"
          />
        </div>

        {/* Centro Médico */}
        <div className="space-y-2">
          <label className="text-caption font-semibold">
            Centro Médico
          </label>
          <input
            type="number"
            placeholder="ID del Centro"
            value={filtros.centroId || ''}
            onChange={(e) => handleInputChange('centroId', (parseInt(e.target.value) || 1).toString())}
            className="input-professional"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onGenerarReporte}
          disabled={loading}
          className="btn-professional"
        >
          <Filter className="icon-professional" />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>

        <button
          onClick={onExportarReporte}
          disabled={loading}
          className="btn-outline"
        >
          <Download className="icon-professional" />
          Exportar CSV
        </button>

        {tieneFiltros && (
          <button
            onClick={limpiarFiltros}
            className="btn-outline"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Resumen de filtros activos */}
      {tieneFiltros && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <h4 className="text-body font-semibold">Filtros Activos</h4>
          </div>
          <div className="grid-professional grid-2 gap-3 text-sm">
            {filtros.desde && (
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium">Desde:</span>
                <span className="text-body">{filtros.desde}</span>
              </div>
            )}
            {filtros.hasta && (
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium">Hasta:</span>
                <span className="text-body">{filtros.hasta}</span>
              </div>
            )}
            {filtros.q && (
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium">Búsqueda:</span>
                <span className="text-body">"{filtros.q}"</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium">Centro:</span>
              <span className="text-body">ID {filtros.centroId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};