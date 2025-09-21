import React, { useState, useEffect } from 'react';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { StatsCards } from '../../components/reports/StatsCards';
import { ChartsSection } from '../../components/reports/ChartsSection';
import { ConsultasTable } from '../../components/reports/ConsultasTable';
import type { ReporteFiltros, ConsultaResumen } from '../../api/reports';
import { apiService } from '../../api/reports';
import { config } from '../../config/env';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  AlertCircle, 
  CheckCircle, 
  Activity, 
  Calendar, 
  Users, 
  LogOut, 
  Menu,
  X,
  Stethoscope,
  BarChart3,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ReportesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    console.log('ReportesPage cargada correctamente');
    // generarReporte(); // Comentado para evitar error 404
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
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-amber-100 text-xs">Sistema Médico</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <a href="/admin/reportes" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">Dashboard</div>
                <div className="text-xs text-amber-100">Panel principal</div>
              </div>
            </a>
            <a href="/consultas" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Consultas</div>
                <div className="text-xs text-gray-400">Citas médicas</div>
              </div>
            </a>
            <a href="/admin" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Médicos</div>
                <div className="text-xs text-gray-400">Personal médico</div>
              </div>
            </a>
            <a href="/usuarios" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Usuarios</div>
                <div className="text-xs text-gray-400">Gestión usuarios</div>
              </div>
            </a>
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{user?.email}</div>
                <div className="text-gray-400 text-xs">Administrador</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <BarChart3 className="h-8 w-8 mr-3" />
                    Dashboard de Reportes
                  </h1>
                  <p className="text-amber-100 mt-1">Sistema de gestión hospitalaria - Análisis de consultas médicas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">{user?.email}</p>
                  <p className="text-amber-100 text-sm">Administrador</p>
                </div>
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="p-6 bg-gray-50 min-h-[calc(100vh-200px)]">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              <span className="text-sm">Generando reporte...</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros de Reporte</h3>
                <p className="text-sm text-gray-600">Configure los parámetros para generar el reporte</p>
              </div>
            </div>
            
            <ReportFilters
              filtros={filtros}
              onFiltrosChange={setFiltros}
              onGenerarReporte={generarReporte}
              onExportarReporte={exportarReporte}
              loading={loading}
            />
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <StatsCards data={data} loading={loading} />
          </div>

          {/* Charts */}
          <div className="mb-6">
            <ChartsSection data={data} loading={loading} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-lg">
            <ConsultasTable
              data={data}
              loading={loading}
              onError={handleError}
            />
          </div>

          {/* Información adicional */}
          {data.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Información del Reporte</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Período de análisis:</p>
                  <p className="text-sm text-gray-900">
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
                  <p className="text-sm font-medium text-gray-500">Centro médico:</p>
                  <p className="text-sm text-gray-900">ID {filtros.centroId}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Filtro de búsqueda:</p>
                  <p className="text-sm text-gray-900">
                    {filtros.q ? `"${filtros.q}"` : 'Sin filtro de texto'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Total de registros:</p>
                  <p className="text-sm text-gray-900">{data.length} médico{data.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};