import React, { useState, useEffect } from 'react';
import { ReportFilters } from '../components/reports/ReportFilters';
import { StatsCards } from '../components/reports/StatsCards';
import { ChartsSection } from '../components/reports/ChartsSection';
import { ConsultasTable } from '../components/reports/ConsultasTable';
import { PacientesFrecuentesTable } from '../components/reports/PacientesFrecuentesTable';
import type { ReporteFiltros, ConsultaResumen, ConsultaDetalle, EstadisticasGenerales, PacienteFrecuente } from '../api/reports';
import { apiService } from '../api/reports';
import { useCentro } from '../contexts/CentroContext';
import { AdminApi } from '../api/adminApi';
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
  const { centroId } = useCentro();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [filtros, setFiltros] = useState<ReporteFiltros>({
    centroId: user?.rol === 'admin' ? 'all' : centroId, // Admin empieza con 'all', médico con su centro
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
  const [centros, setCentros] = useState<Array<{id: number, nombre: string, ciudad: string}>>([]);

  // Determinar el elemento activo del sidebar y obtener colores
  const activeItem = getActiveSidebarItem(window.location.pathname);
  const headerColors = getHeaderColors(activeItem);

  // Cargar datos iniciales
  useEffect(() => {
    loadCentros();
  }, []);

  // Cargar datos automáticamente cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      const filtrosPorDefecto: ReporteFiltros = {
        centroId: user.rol === 'admin' ? 'all' : centroId,
        desde: undefined,
        hasta: undefined,
        q: undefined
      };
      setFiltros(filtrosPorDefecto);
      generarReporte(filtrosPorDefecto);
    }
  }, [user]); // Removí centroId de las dependencias

  const loadCentros = async () => {
    try {
      const centrosData = await AdminApi.getCentros();
      setCentros(centrosData);
    } catch (error) {
      console.error('❌ Error cargando centros:', error);
    }
  };

  const generarReporte = async (filtrosParaUsar?: ReporteFiltros) => {
    const filtrosActuales = filtrosParaUsar || filtros;
    
    // Guardar filtros actuales en localStorage para que estén disponibles en los headers
    // Crear una copia limpia de los filtros para evitar referencias circulares
    const filtrosLimpios = {
      centroId: filtrosActuales.centroId,
      desde: filtrosActuales.desde,
      hasta: filtrosActuales.hasta,
      q: filtrosActuales.q
    };
    localStorage.setItem('currentFilters', JSON.stringify(filtrosLimpios));
    
    setLoading(true);
    setLoadingEstadisticas(true);
    setLoadingPacientes(true);
    setError(null);
    setSuccess(null);

    try {
      // Cargar datos en paralelo
      const [consultasResponse, estadisticasResponse, pacientesResponse] = await Promise.all([
        apiService.getResumenConsultas(filtrosActuales),
        apiService.getEstadisticasGenerales(filtrosActuales),
        apiService.getPacientesFrecuentes(filtrosActuales, 10)
      ]);
      
      // Procesar respuesta de consultas (datos directos)
      setData(consultasResponse);

      // Procesar respuesta de estadísticas (datos directos)
      setEstadisticas(estadisticasResponse);

      // Procesar respuesta de pacientes frecuentes (datos directos)
      setPacientesFrecuentes(pacientesResponse);

      setSuccess(`Reporte generado exitosamente. ${consultasResponse.length} médico${consultasResponse.length !== 1 ? 's' : ''} encontrado${consultasResponse.length !== 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Error generando reporte:', error)
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Mostrar progreso
      setSuccess('Generando reporte PDF con detalles completos...');
      
      // Obtener detalles de consultas para cada médico
      const detallesConsultas: { [medicoId: number]: ConsultaDetalle[] } = {};
      
      for (let i = 0; i < data.length; i++) {
        const medico = data[i];
        try {
          setSuccess(`Obteniendo detalles del medico ${i + 1}/${data.length}: Dr. ${medico.nombres} ${medico.apellidos}...`);
          
          const detalleData = await apiService.getDetalleConsultasMedico(
            medico.medico_id, 
            { desde: filtros.desde, hasta: filtros.hasta, q: filtros.q }
          );
          detallesConsultas[medico.medico_id] = detalleData;
        } catch (err) {
          console.warn(`Error al obtener detalles para médico ${medico.medico_id}:`, err);
        }
      }

      setSuccess('Creando documento PDF...');
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configurar fuente para evitar problemas de codificación
      doc.setFont('helvetica', 'normal');
      
      // Configurar colores del tema
      const primaryColor = [245, 158, 11]; // amber-500
      const textColor = [55, 65, 81]; // gray-700
      const lightGray = [243, 244, 246]; // gray-100

      // Función para agregar texto con estilo
      const addText = (text: string, x: number, y: number, options: { fontStyle?: string; fontSize?: number; color?: number[] | number } = {}) => {
        doc.setFont('helvetica', options.fontStyle || 'normal');
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

      // Encabezado principal mejorado
      addRect(0, 0, 210, 35, primaryColor);
      
      // Logo/Icono
      addRect(10, 5, 25, 25, [255, 255, 255]);
      addText('H', 18, 18, { fontSize: 16, color: primaryColor });
      
      // Título principal
      addText('HOSPITALAPP', 40, 15, { fontSize: 22, color: [255, 255, 255] });
      addText('Sistema de Gestion Hospitalaria', 40, 22, { fontSize: 11, color: [255, 255, 255] });
      addText('Reporte de Consultas Medicas', 40, 28, { fontSize: 9, color: [255, 248, 220] });
      
      // Fecha de generación con mejor formato
      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      addText(`Generado: ${fechaActual}`, 130, 15, { fontSize: 9, color: [255, 255, 255] });
      addText(`Usuario: ${user?.email || 'Sistema'}`, 130, 22, { fontSize: 8, color: [255, 248, 220] });

      yPosition = 40;

      // Título del reporte con mejor diseño
      addText('REPORTE DE CONSULTAS MEDICAS', 20, yPosition, { fontSize: 16, color: primaryColor });
      yPosition += 12;

      // Caja de información de filtros
      addRect(15, yPosition - 5, 180, 35, [248, 250, 252]); // gris muy claro
      addLine(15, yPosition - 5, 195, yPosition - 5, primaryColor);
      addLine(15, yPosition + 30, 195, yPosition + 30, primaryColor);
      
      addText('Parametros del Reporte:', 20, yPosition + 5, { fontSize: 12, color: primaryColor });
      yPosition += 8;

      const centroNombre = user?.rol === 'admin' && centros.length > 0 
        ? centros.find(c => c.id === filtros.centroId)?.nombre || `ID ${filtros.centroId}`
        : `ID ${filtros.centroId}`;

      const filtrosInfo = [
        `Periodo: ${filtros.desde && filtros.hasta ? `${filtros.desde} - ${filtros.hasta}` : filtros.desde ? `Desde ${filtros.desde}` : filtros.hasta ? `Hasta ${filtros.hasta}` : 'Todos los registros'}`,
        `Centro Medico: ${centroNombre}`,
        `Busqueda: ${filtros.q ? `"${filtros.q}"` : 'Sin filtro de texto'}`,
        `Total de registros: ${data.length} medico${data.length !== 1 ? 's' : ''}`
      ];

      filtrosInfo.forEach((info, index) => {
        addText(info, 25, yPosition + (index * 4), { fontSize: 9, color: textColor });
      });

      yPosition += 40;

      // Estadísticas resumidas con mejor diseño
      const totalConsultas = data.reduce((sum, medico) => sum + medico.total_consultas, 0);
      const promedioConsultas = data.length > 0 ? (totalConsultas / data.length).toFixed(1) : 0;
      const especialidadesUnicas = new Set(data.map(medico => medico.especialidad)).size;

      // Caja de estadísticas
      addRect(15, yPosition - 5, 180, 30, [240, 248, 255]); // azul muy claro
      addLine(15, yPosition - 5, 195, yPosition - 5, [59, 130, 246]);
      addLine(15, yPosition + 25, 195, yPosition + 25, [59, 130, 246]);
      
      addText('Resumen Estadistico:', 20, yPosition + 5, { fontSize: 12, color: [59, 130, 246] });
      yPosition += 8;

      const estadisticas = [
        `Total de Consultas: ${totalConsultas.toLocaleString()}`,
        `Medicos Activos: ${data.length}`,
        `Promedio por Medico: ${promedioConsultas}`,
        `Especialidades: ${especialidadesUnicas}`
      ];

      estadisticas.forEach((stat, index) => {
        addText(stat, 25, yPosition + (index * 4), { fontSize: 9, color: textColor });
      });

      yPosition += 35;

      // Tabla de datos mejorada
      addText('RESUMEN POR MEDICO', 20, yPosition, { fontSize: 12, color: textColor });
      yPosition += 10;

      // Preparar datos para la tabla con mejor formato
      const tableData = data.map(medico => [
        `Dr. ${medico.nombres} ${medico.apellidos}`,
        medico.especialidad,
        medico.total_consultas.toString(),
        medico.primera_consulta ? new Date(medico.primera_consulta).toLocaleDateString('es-ES') : 'N/A',
        medico.ultima_consulta ? new Date(medico.ultima_consulta).toLocaleDateString('es-ES') : 'N/A'
      ]);

      // Agregar tabla usando autoTable con mejor diseño
      autoTable(doc, {
        head: [['Medico', 'Especialidad', 'Total Consultas', 'Primera Consulta', 'Ultima Consulta']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left',
          lineColor: [209, 213, 219]
        },
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
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
        margin: { left: 20, right: 20 },
        tableLineColor: [59, 130, 246],
        tableLineWidth: 0.5
      });

      // Obtener la posición final después de la tabla
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || yPosition + 50;
      let currentY = finalY + 20;

      // Agregar detalles de consultas por médico
      addText('DETALLES DE CONSULTAS POR MEDICO', 20, currentY, { fontSize: 14, color: primaryColor });
      currentY += 15;

      // Función para verificar espacio y agregar nueva página si es necesario
      const checkPageSpace = (requiredSpace: number) => {
        const pageHeight = doc.internal.pageSize.height;
        const availableSpace = pageHeight - currentY - 50;
        
        if (availableSpace < requiredSpace) {
          doc.addPage();
          currentY = 20;
          return true;
        }
        return false;
      };

      // Función para agregar sección de médico con mejor diseño
      const addMedicoSection = (medico: ConsultaResumen, consultas: ConsultaDetalle[]) => {
        if (consultas.length === 0) return;

        // Verificar espacio para la sección completa
        const estimatedSpace = 80 + (consultas.length * 8);
        checkPageSpace(estimatedSpace);

        // Fondo para el título del médico
        addRect(15, currentY - 5, 180, 25, [240, 248, 255]); // azul muy claro
        addLine(15, currentY - 5, 195, currentY - 5, [59, 130, 246]); // línea azul superior
        addLine(15, currentY + 20, 195, currentY + 20, [59, 130, 246]); // línea azul inferior

        // Título del médico con mejor formato
        addText(`Dr. ${medico.nombres} ${medico.apellidos}`, 20, currentY + 5, { fontSize: 12, color: [59, 130, 246] });
        addText(`${medico.especialidad}`, 20, currentY + 12, { fontSize: 10, color: [107, 114, 128] });
        addText(`Total consultas: ${consultas.length}`, 120, currentY + 12, { fontSize: 10, color: [107, 114, 128] });
        currentY += 25;

        // Crear tabla de detalles con mejor diseño
        const detalleTableData = consultas.map((consulta) => [
          new Date(consulta.fecha).toLocaleDateString('es-ES'),
          `${consulta.paciente_nombre} ${consulta.paciente_apellido}`,
          consulta.motivo || 'Sin motivo',
          consulta.diagnostico || 'Sin diagnóstico',
          consulta.estado.charAt(0).toUpperCase() + consulta.estado.slice(1)
        ]);

        autoTable(doc, {
          head: [['Fecha', 'Paciente', 'Motivo', 'Diagnóstico', 'Estado']],
          body: detalleTableData,
          startY: currentY,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'left',
            lineColor: [209, 213, 219]
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' }, // Fecha
            1: { cellWidth: 35 }, // Paciente
            2: { cellWidth: 30 }, // Motivo
            3: { cellWidth: 30 }, // Diagnóstico
            4: { cellWidth: 20, halign: 'center' }  // Estado
          },
          margin: { left: 20, right: 20 },
          tableLineColor: [59, 130, 246],
          tableLineWidth: 0.5
        });

        // Obtener la posición final después de esta tabla
        const detalleFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || currentY + 50;
        currentY = detalleFinalY + 15;

        // Línea separadora decorativa
        addLine(20, currentY, 190, currentY, [59, 130, 246]);
        addLine(20, currentY + 1, 190, currentY + 1, [209, 213, 219]);
        currentY += 10;
      };

      // Procesar cada médico
      for (const medico of data) {
        const consultasDetalle = detallesConsultas[medico.medico_id] || [];
        addMedicoSection(medico, consultasDetalle);
      }

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
          
          if (availableSpace < 100) { // Si hay menos de 100px disponibles
            doc.addPage();
            currentY = 20;
          }
          
          // Crear gráfico de especialidades simplificado
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
          
          sortedEspecialidades.forEach((item, index) => {
            const barLength = (item.total / maxEspecialidad) * horizontalBarWidth;
            const color = colors[index % colors.length];
            const percentage = ((item.total / totalConsultas) * 100).toFixed(1);
            
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

      // Pie de página mejorado
      const pageHeight = doc.internal.pageSize.height;
      const footerY = Math.max(currentY + 20, pageHeight - 25);

      // Línea decorativa
      addLine(20, footerY - 8, 190, footerY - 8, primaryColor);
      addLine(20, footerY - 7, 190, footerY - 7, [209, 213, 219]);
      
      // Fondo del pie de página
      addRect(15, footerY - 5, 180, 15, [248, 250, 252]);
      
      addText('HospitalApp - Sistema de Gestion Hospitalaria', 20, footerY, { fontSize: 8, color: [107, 114, 128] });
      addText(`Pagina ${doc.internal.pages.length}`, 150, footerY, { fontSize: 8, color: [107, 114, 128] });
      addText('soporte@hospitalapp.com', 20, footerY + 5, { fontSize: 7, color: [156, 163, 175] });
      addText('www.hospitalapp.com', 150, footerY + 5, { fontSize: 7, color: [156, 163, 175] });

      // Guardar el PDF con nombre más descriptivo
      const fechaFormateada = new Date().toISOString().split('T')[0];
      const horaFormateada = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
      const fileName = `Reporte_Consultas_${fechaFormateada}_${horaFormateada}.pdf`;
      doc.save(fileName);

      setSuccess('Reporte PDF exportado exitosamente con detalles completos');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al exportar el reporte PDF');
    } finally {
      setLoading(false);
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
        onFiltrosChange={(newFiltros) => {
          setFiltros(newFiltros);
        }}
        onGenerarReporte={(filtrosParaUsar) => generarReporte(filtrosParaUsar)}
        onExportarReporte={exportarReporte}
        loading={loading}
        centros={centros}
        isAdmin={user?.rol === 'admin'}
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
              centroId={typeof filtros.centroId === 'number' ? filtros.centroId : 1}
              filtros={filtros}
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
                  <p className="text-sm text-gray-900">
                    {user?.rol === 'admin' && centros.length > 0 
                      ? centros.find(c => c.id === filtros.centroId)?.nombre || `ID ${filtros.centroId}`
                      : `ID ${filtros.centroId}`
                    }
                  </p>
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