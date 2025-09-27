// components/reports/ReportsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ReportFilters } from './ReportFilters';
import { StatsCards } from './StatsCards';
import { ChartsSection } from './ChartsSection';
import { ConsultasTable } from './ConsultasTable';
import type { ReporteFiltros, ConsultaResumen, EstadisticasGenerales } from '../../api/reports';
import { apiService } from '../../api/reports';
import { config } from '../../config/env';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const [filtros, setFiltros] = useState<ReporteFiltros>({
    centroId: config.defaultCentroId,
    desde: undefined,
    hasta: undefined,
    q: undefined
  });

  const [data, setData] = useState<ConsultaResumen[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    generarReporte();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generarReporte = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Cargar datos en paralelo
      const [consultasResponse, estadisticasResponse] = await Promise.all([
        apiService.getResumenConsultas(filtros),
        apiService.getEstadisticasGenerales(filtros)
      ]);
      
      if (consultasResponse.error) {
        setError(consultasResponse.error);
        setData([]);
      } else if (consultasResponse.data) {
        setData(consultasResponse.data);
        setSuccess(`Reporte generado exitosamente. ${consultasResponse.data.length} médico${consultasResponse.data.length !== 1 ? 's' : ''} encontrado${consultasResponse.data.length !== 1 ? 's' : ''}.`);
      }

      if (estadisticasResponse.error) {
        console.error('Error cargando estadísticas:', estadisticasResponse.error);
        setEstadisticas(null);
      } else if (estadisticasResponse.data) {
        setEstadisticas(estadisticasResponse.data);
      }
    } catch {
      setError('Error inesperado al generar el reporte');
      setData([]);
      setEstadisticas(null);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = () => {
    if (data.length === 0) {
      setError('No hay datos para exportar');
      return;
    }

    try {
      // Crear CSV
      const headers = ['Médico', 'Especialidad', 'Total Consultas', 'Primera Consulta', 'Última Consulta'];
      const csvContent = [
        headers.join(','),
        ...data.map(medico => [
          `"${medico.nombres} ${medico.apellidos}"`,
          `"${medico.especialidad}"`,
          medico.total_consultas,
          `"${medico.primera_consulta || 'N/A'}"`,
          `"${medico.ultima_consulta || 'N/A'}"`
        ].join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_consultas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Reporte exportado exitosamente');
    } catch {
      setError('Error al exportar el reporte');
    }
  };

  // const handleError = (errorMessage: string) => {
  //   setError(errorMessage);
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-professional py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-display mb-2">Dashboard de Reportes</h1>
              <p className="text-subheading mb-4">Sistema de gestión hospitalaria - Análisis de consultas médicas</p>
            </div>
            <div className="flex items-center gap-4">
              {loading && (
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-caption">Procesando...</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-caption">Última actualización: {new Date().toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="card-professional mb-8 p-6 border-l-4 border-gray-900 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="icon-container">
                <CheckCircle className="icon-professional" />
              </div>
              <div>
                <h3 className="text-subheading font-semibold">Éxito</h3>
                <p className="text-body">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card-professional mb-8 p-6 border-l-4 border-red-500 bg-red-50 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-subheading font-semibold text-red-800">Error</h3>
                <p className="text-body text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card-professional mb-8 p-8 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-body">Generando reporte...</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <ReportFilters
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onGenerarReporte={generarReporte}
          onExportarReporte={exportarReporte}
          loading={loading}
        />

        {/* Stats Cards */}
        <StatsCards data={estadisticas} loading={loading} />

        {/* Charts */}
        <ChartsSection data={data} loading={loading} />

        {/* Table */}
        <ConsultasTable 
          data={data} 
          loading={loading} 
          onError={setError}
        />

        {/* Información adicional */}
        {data.length > 0 && (
          <div className="card-elevated mt-8 p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="icon-container">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-subheading font-semibold">Información del Reporte</h3>
            </div>
            <div className="grid-professional grid-2 gap-6">
              <div className="space-y-2">
                <p className="text-caption font-semibold">Período de análisis:</p>
                <p className="text-body">
                  {filtros.desde && filtros.hasta 
                    ? `${filtros.desde} - ${filtros.hasta}`
                    : filtros.desde 
                    ? `Desde ${filtros.desde}`
                    : filtros.hasta
                    ? `Hasta ${filtros.hasta}`
                    : 'Todos los registros'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-caption font-semibold">Centro médico:</p>
                <p className="text-body">ID {filtros.centroId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-caption font-semibold">Filtro de búsqueda:</p>
                <p className="text-body">
                  {filtros.q ? `"${filtros.q}"` : 'Sin filtro de texto'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-caption font-semibold">Total de registros:</p>
                <p className="text-body">{data.length} médico{data.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
