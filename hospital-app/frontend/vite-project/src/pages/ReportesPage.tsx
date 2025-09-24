import React, { useState, useEffect } from 'react';
import { ReportFilters } from '../components/reports/ReportFilters';
import { StatsCards } from '../components/reports/StatsCards';
import { ChartsSection } from '../components/reports/ChartsSection';
import { ConsultasTable } from '../components/reports/ConsultasTable';
import { PacientesFrecuentesTable } from '../components/reports/PacientesFrecuentesTable';
import type { ReporteFiltros, ConsultaResumen, EstadisticasGenerales, PacienteFrecuente } from '../api/reports';
import { apiService } from '../api/reports';
import { config } from '../config/env';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  TrendingUp,
  Building2,
  Heart,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminBanner } from '../components/AdminBanner';
import { LogoutModal } from '../components/LogoutModal';
import { getRoleText } from '../utils/roleUtils';
import { getActiveSidebarItem, getHeaderColors } from '../utils/sidebarUtils';

export const ReportesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [filtros, setFiltros] = useState<ReporteFiltros>({
    centroId: config.defaultCentroId,
    desde: undefined,
    hasta: undefined,
    q: undefined
  });

  const [data, setData] = useState<ConsultaResumen[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [pacientesFrecuentes, setPacientesFrecuentes] = useState<PacienteFrecuente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determinar el elemento activo del sidebar y obtener colores
  const activeItem = getActiveSidebarItem(window.location.pathname);
  const headerColors = getHeaderColors(activeItem);

  // Cargar datos iniciales
  useEffect(() => {
    console.log('ReportesPage cargada correctamente');
    // generarReporte(); // Comentado para evitar error 404
  }, []);

  const generarReporte = async () => {
    setLoading(true);
    setLoadingEstadisticas(true);
    setLoadingPacientes(true);
    setError(null);
    setSuccess(null);

    try {
      // Cargar datos en paralelo
      const [consultasResponse, estadisticasResponse, pacientesResponse] = await Promise.all([
        apiService.getResumenConsultas(filtros),
        apiService.getEstadisticasGenerales(filtros),
        apiService.getPacientesFrecuentes(filtros, 10)
      ]);
      
      // Procesar respuesta de consultas
      if (consultasResponse.error) {
        setError(consultasResponse.error);
        setData([]);
      } else if (consultasResponse.data) {
        setData(consultasResponse.data);
      }

      // Procesar respuesta de estadísticas
      if (estadisticasResponse.error) {
        console.error('Error cargando estadísticas:', estadisticasResponse.error);
        setEstadisticas(null);
      } else if (estadisticasResponse.data) {
        setEstadisticas(estadisticasResponse.data);
      }

      // Procesar respuesta de pacientes frecuentes
      if (pacientesResponse.error) {
        console.error('Error cargando pacientes frecuentes:', pacientesResponse.error);
        setPacientesFrecuentes([]);
      } else if (pacientesResponse.data) {
        setPacientesFrecuentes(pacientesResponse.data);
      }

      if (!consultasResponse.error) {
        setSuccess(`Reporte generado exitosamente. ${consultasResponse.data?.length || 0} médico${(consultasResponse.data?.length || 0) !== 1 ? 's' : ''} encontrado${(consultasResponse.data?.length || 0) !== 1 ? 's' : ''}.`);
      }
    } catch (err) {
      setError('Error inesperado al generar el reporte');
      setData([]);
      setEstadisticas(null);
      setPacientesFrecuentes([]);
    } finally {
      setLoading(false);
      setLoadingEstadisticas(false);
      setLoadingPacientes(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const exportarReporte = async () => {
    if (data.length === 0) {
      setError('No hay datos para exportar');
      return;
    }

    try {
      // Obtener detalles de consultas para cada médico
      const detallesConsultas: { [medicoId: number]: ConsultaDetalle[] } = {};
      
      for (const medico of data) {
        try {
          const response = await apiService.getDetalleConsultas(medico.medico_id, filtros);
          if (response.data) {
            detallesConsultas[medico.medico_id] = response.data;
          }
        } catch (err) {
          console.warn(`Error al obtener detalles para médico ${medico.medico_id}:`, err);
        }
      }
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configurar colores del tema
      const primaryColor = [245, 158, 11]; // amber-500
      const textColor = [55, 65, 81]; // gray-700
      const lightGray = [243, 244, 246]; // gray-100

      // Función para agregar texto con estilo
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        doc.setFontSize(options.fontSize || 12);
        if (options.color && Array.isArray(options.color) && options.color.length === 3) {
          doc.setTextColor(options.color[0], options.color[1], options.color[2]);
        } else if (typeof options.color === 'number') {
          doc.setTextColor(options.color);
        } else {
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        }
        doc.text(text, x, y);
      };

      // Función para agregar línea
      const addLine = (x1: number, y1: number, x2: number, y2: number, color: number[] = primaryColor) => {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.5);
        doc.line(x1, y1, x2, y2);
      };

      // Función para agregar rectángulo
      const addRect = (x: number, y: number, width: number, height: number, color: number[] = lightGray) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y, width, height, 'F');
      };

      let yPosition = 20;

      // Encabezado principal
      addRect(0, 0, 210, 30, primaryColor);
      addText('HOSPITALAPP', 20, 15, { fontSize: 20, color: [255, 255, 255] });
      addText('Sistema de Gestión Hospitalaria', 20, 22, { fontSize: 10, color: [255, 255, 255] });
      
      // Fecha de generación
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      addText(`Generado el: ${fechaActual}`, 150, 15, { fontSize: 10, color: [255, 255, 255] });

      yPosition = 40;

      // Título del reporte
      addText('REPORTE DE CONSULTAS MÉDICAS', 20, yPosition, { fontSize: 16, color: primaryColor });
      yPosition += 10;

      // Información de filtros
      addText('Parámetros del Reporte:', 20, yPosition, { fontSize: 12, color: textColor });
      yPosition += 8;

      const filtrosInfo = [
        `Período: ${filtros.desde && filtros.hasta ? `${filtros.desde} - ${filtros.hasta}` : filtros.desde ? `Desde ${filtros.desde}` : filtros.hasta ? `Hasta ${filtros.hasta}` : 'Todos los registros'}`,
        `Centro Médico: ID ${filtros.centroId}`,
        `Búsqueda: ${filtros.q ? `"${filtros.q}"` : 'Sin filtro de texto'}`,
        `Total de registros: ${data.length} médico${data.length !== 1 ? 's' : ''}`
      ];

      filtrosInfo.forEach(info => {
        addText(`• ${info}`, 25, yPosition, { fontSize: 10, color: textColor });
        yPosition += 6;
      });

      yPosition += 10;

      // Estadísticas resumidas
      const totalConsultas = data.reduce((sum, medico) => sum + medico.total_consultas, 0);
      const promedioConsultas = data.length > 0 ? (totalConsultas / data.length).toFixed(1) : 0;
      const especialidadesUnicas = new Set(data.map(medico => medico.especialidad)).size;

      addText('Resumen Estadístico:', 20, yPosition, { fontSize: 12, color: textColor });
      yPosition += 8;

      const estadisticas = [
        `Total de Consultas: ${totalConsultas.toLocaleString()}`,
        `Médicos Activos: ${data.length}`,
        `Promedio por Médico: ${promedioConsultas}`,
        `Especialidades: ${especialidadesUnicas}`
      ];

      estadisticas.forEach(stat => {
        addText(`• ${stat}`, 25, yPosition, { fontSize: 10, color: textColor });
        yPosition += 6;
      });

      yPosition += 15;

      // Tabla de datos
      addText('Detalle por Médico:', 20, yPosition, { fontSize: 12, color: textColor });
      yPosition += 10;

      // Preparar datos para la tabla
      const tableData = data.map(medico => [
        `${medico.nombres} ${medico.apellidos}`,
        medico.especialidad,
        medico.total_consultas.toString(),
        medico.primera_consulta ? new Date(medico.primera_consulta).toLocaleDateString('es-ES') : 'N/A',
        medico.ultima_consulta ? new Date(medico.ultima_consulta).toLocaleDateString('es-ES') : 'N/A'
      ]);

      // Agregar tabla usando autoTable
      autoTable(doc, {
        head: [['Médico', 'Especialidad', 'Total Consultas', 'Primera Consulta', 'Última Consulta']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Médico
          1: { cellWidth: 35 }, // Especialidad
          2: { cellWidth: 25, halign: 'center' }, // Total Consultas
          3: { cellWidth: 30, halign: 'center' }, // Primera Consulta
          4: { cellWidth: 30, halign: 'center' }  // Última Consulta
        },
        margin: { left: 20, right: 20 }
      });

      // Obtener la posición final después de la tabla
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
      let currentY = finalY + 20;

      // Agregar gráficos si hay datos
      if (data.length > 0) {
        try {
          // Paleta de colores bonitos
          const colors = [
            [59, 130, 246],    // azul
            [16, 185, 129],    // verde
            [245, 158, 11],    // ámbar
            [239, 68, 68],     // rojo
            [139, 92, 246],    // púrpura
            [6, 182, 212],     // cian
            [132, 204, 22],    // lima
            [249, 115, 22],    // naranja
            [236, 72, 153],    // rosa
            [34, 197, 94]      // verde esmeralda
          ];
          
          // Crear gráfico de barras mejorado
          addText('Top 10 Médicos - Consultas por Médico:', 20, currentY, { fontSize: 12, color: textColor });
          currentY += 10;
          
          // Obtener top 10 médicos
          const topMedicos = data
            .sort((a, b) => b.total_consultas - a.total_consultas)
            .slice(0, 10);
          
          const maxConsultas = Math.max(...topMedicos.map(m => m.total_consultas));
          const chartWidth = 120;
          const chartHeight = 60;
          const barWidth = chartWidth / Math.min(topMedicos.length, 10);
          
          // Dibujar ejes
          addLine(20, currentY + chartHeight, 20 + chartWidth, currentY + chartHeight, [107, 114, 128]); // eje X
          addLine(20, currentY, 20, currentY + chartHeight, [107, 114, 128]); // eje Y
          
          // Dibujar barras con colores diferentes
          topMedicos.forEach((medico, index) => {
            const barHeight = (medico.total_consultas / maxConsultas) * chartHeight;
            const x = 20 + (index * barWidth);
            const y = currentY + chartHeight - barHeight;
            const color = colors[index % colors.length];
            
            // Dibujar barra
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(x + 1, y, barWidth - 2, barHeight, 'F');
            
            // Agregar valor encima de la barra
            addText(medico.total_consultas.toString(), x + barWidth/2 - 5, y - 2, { fontSize: 8, color: textColor });
            
            // Agregar nombre del médico (abreviado) debajo del eje
            const nombreAbreviado = `${medico.nombres.split(' ')[0].charAt(0)}. ${medico.apellidos.split(' ')[0]}`;
            addText(nombreAbreviado, x + 2, currentY + chartHeight + 8, { fontSize: 7, color: textColor });
          });
          
          currentY += chartHeight + 25;
          
          // Verificar si necesitamos una nueva página
          const pageHeight = doc.internal.pageSize.height;
          const availableSpace = pageHeight - currentY - 50; // 50px para el pie de página
          
          console.log('Posición actual Y:', currentY);
          console.log('Altura de página:', pageHeight);
          console.log('Espacio disponible:', availableSpace);
          
          if (availableSpace < 100) { // Si hay menos de 100px disponibles
            console.log('Agregando nueva página');
            doc.addPage();
            currentY = 20;
          }
          
          // Crear gráfico de especialidades simplificado
          console.log('Creando gráfico de especialidades en Y:', currentY);
          addText('Distribución por Especialidades:', 20, currentY, { fontSize: 12, color: textColor });
          currentY += 10;
          
          // Agrupar por especialidades
          const especialidadesData = data.reduce((acc, medico) => {
            const existing = acc.find(item => item.especialidad === medico.especialidad);
            if (existing) {
              existing.total += medico.total_consultas;
            } else {
              acc.push({
                especialidad: medico.especialidad,
                total: medico.total_consultas
              });
            }
            return acc;
          }, [] as Array<{ especialidad: string; total: number }>);
          
          const totalConsultas = especialidadesData.reduce((sum, item) => sum + item.total, 0);
          const sortedEspecialidades = especialidadesData.sort((a, b) => b.total - a.total);
          
          // Crear gráfico de barras horizontales para especialidades
          const maxEspecialidad = Math.max(...sortedEspecialidades.map(e => e.total));
          const horizontalBarWidth = 80;
          const barHeight = 8;
          const barSpacing = 12;
          
          console.log('Procesando especialidades:', sortedEspecialidades.length);
          sortedEspecialidades.forEach((item, index) => {
            const barLength = (item.total / maxEspecialidad) * horizontalBarWidth;
            const color = colors[index % colors.length];
            const percentage = ((item.total / totalConsultas) * 100).toFixed(1);
            
            console.log(`Dibujando especialidad ${index + 1}: ${item.especialidad} en Y: ${currentY}`);
            
            // Dibujar barra horizontal
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(20, currentY, barLength, barHeight, 'F');
            
            // Agregar texto de la especialidad
            addText(item.especialidad, 25, currentY + 6, { fontSize: 9, color: textColor });
            
            // Agregar valor y porcentaje
            addText(`${item.total} (${percentage}%)`, 20 + horizontalBarWidth + 5, currentY + 6, { fontSize: 9, color: textColor });
            
            currentY += barSpacing;
          });
          
          currentY += 10;
          
        } catch (chartError) {
          console.warn('Error al crear gráficos:', chartError);
          addText('Nota: Los gráficos no pudieron ser incluidos en este reporte.', 20, currentY, { fontSize: 10, color: [107, 114, 128] });
          currentY += 10;
        }
      }

      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      const footerY = Math.max(currentY + 20, pageHeight - 20);

      addLine(20, footerY - 5, 190, footerY - 5, [209, 213, 219]); // gray-300
      addText('HospitalApp - Sistema de Gestión Hospitalaria', 20, footerY, { fontSize: 8, color: [107, 114, 128] });
      addText(`Página ${doc.internal.pages.length}`, 150, footerY, { fontSize: 8, color: [107, 114, 128] });

      // Guardar el PDF
      const fileName = `reporte_consultas_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      setSuccess('Reporte PDF exportado exitosamente');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al exportar el reporte PDF');
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
        <div className={`flex items-center justify-between h-20 px-6 ${headerColors.gradient}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className={`h-8 w-8 ${headerColors.iconColor}`} />
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
            <a href="/reportes" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
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
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Consultas</div>
                <div className="text-xs text-gray-400">Citas médicas</div>
              </div>
            </a>
            <a href="/pacientes" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Pacientes</div>
                <div className="text-xs text-gray-400">Gestión pacientes</div>
              </div>
            </a>
            <a href="/calendario" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-cyan-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Calendario</div>
                <div className="text-xs text-gray-400">Vista mensual</div>
              </div>
            </a>
            <a href="/medicos" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Médicos</div>
                <div className="text-xs text-gray-400">Personal médico</div>
              </div>
            </a>
            <a href="/centros" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Centros Médicos</div>
                <div className="text-xs text-gray-400">Gestión centros</div>
              </div>
            </a>
            <a href="/especialidades" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Especialidades</div>
                <div className="text-xs text-gray-400">Gestión especialidades</div>
              </div>
            </a>
            <a href="/empleados" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Empleados</div>
                <div className="text-xs text-gray-400">Personal administrativo</div>
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
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{user?.email}</div>
                <div className="text-gray-400 text-xs">Administrador</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
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
        <div className={`${headerColors.gradient} shadow-lg`}>
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
                    <BarChart3 className={`h-8 w-8 mr-3 ${headerColors.iconColor}`} />
                    Dashboard de Reportes
                  </h1>
                  <p className="text-amber-100 mt-1">Sistema de gestión hospitalaria - Análisis de consultas médicas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-amber-600"
                  iconBackgroundColor="bg-amber-700"
                  icon={BarChart3}
                  roleText={getRoleText(user)}
                />
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
            <StatsCards data={estadisticas} loading={loadingEstadisticas} />
          </div>

          {/* Charts */}
          <div className="mb-6">
            <ChartsSection data={data} loading={loading} />
          </div>

          {/* Pacientes Frecuentes */}
          <div className="mb-6">
            <PacientesFrecuentesTable data={pacientesFrecuentes} loading={loadingPacientes} />
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
      {/* Modal de confirmación de logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  );
};