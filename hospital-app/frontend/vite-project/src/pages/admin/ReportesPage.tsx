// pages/admin/ReportesPage.tsx - Página de reportes para Admin
import React, { useState, useEffect } from 'react';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { StatsCards } from '../../components/reports/StatsCards';
import { ChartsSection } from '../../components/reports/ChartsSection';
import { ConsultasTable } from '../../components/reports/ConsultasTable';
import type { ReporteFiltros, ConsultaResumen } from '../../api/reports';
import { apiService } from '../../api/reports';
import { config } from '../../config/env';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const ReportesPage: React.FC = () => {
  const [filtros, setFiltros] = useState<ReporteFiltros>({
    centroId: config.defaultCentroId,
    desde: undefined,
    hasta: undefined,
    q: undefined
  });

  const [data, setData] = useState<ConsultaResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    generarReporte();
  }, []);

  const generarReporte = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.getResumenConsultas(filtros);
      
      if (response.error) {
        setError(response.error);
        setData([]);
      } else if (response.data) {
        setData(response.data);
        setSuccess(`Reporte generado exitosamente. ${response.data.length} médico${response.data.length !== 1 ? 's' : ''} encontrado${response.data.length !== 1 ? 's' : ''}.`);
      }
    } catch (err) {
      setError('Error inesperado al generar el reporte');
      setData([]);
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
    } catch (err) {
      setError('Error al exportar el reporte');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div>
      {/* Header de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes de Consultas</h1>
        <p className="mt-2 text-gray-600">
          Análisis y visualización de consultas médicas
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Éxito</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <ReportFilters
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onGenerarReporte={generarReporte}
        onExportarReporte={exportarReporte}
        loading={loading}
      />

      {/* Estadísticas */}
      <StatsCards data={data} loading={loading} />

      {/* Gráficos */}
      <ChartsSection data={data} loading={loading} />

      {/* Tabla de consultas */}
      <ConsultasTable
        data={data}
        loading={loading}
        onError={handleError}
      />

      {/* Información adicional */}
      {data.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Reporte</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Período de análisis:</p>
              <p className="text-gray-600">
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
            <div>
              <p className="font-medium text-gray-700">Centro médico:</p>
              <p className="text-gray-600">ID {filtros.centroId}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Filtro de búsqueda:</p>
              <p className="text-gray-600">
                {filtros.q ? `"${filtros.q}"` : 'Sin filtro de texto'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
