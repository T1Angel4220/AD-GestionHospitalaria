import React, { useState } from 'react';
import { Eye, ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';
import type { ConsultaResumen, ConsultaDetalle, ReporteFiltros } from '../../api/reports';
import { formatDate, getInitials } from '../../lib/utils';
import { apiService } from '../../api/reports';

interface ConsultasTableProps {
  data: ConsultaResumen[];
  loading?: boolean;
  onError?: (error: string) => void;
  centroId?: number;
  filtros?: ReporteFiltros;
}

export const ConsultasTable: React.FC<ConsultasTableProps> = ({
  data,
  loading = false,
  onError,
  centroId = 1,
  filtros = { centroId: centroId, desde: undefined, hasta: undefined, q: undefined },
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [detalleData, setDetalleData] = useState<Record<number, ConsultaDetalle[]>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<Set<number>>(new Set());

  const toggleRow = async (medicoId: number) => {
    // Validar que el medicoId sea válido
    if (!medicoId || !Number.isFinite(medicoId) || medicoId <= 0) {
      console.error('Invalid medicoId:', medicoId);
      onError?.('ID de médico inválido');
      return;
    }

    const isExpanded = expandedRows.has(medicoId);
    
    if (isExpanded) {
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(medicoId);
        return newSet;
      });
    } else {
      setExpandedRows(prev => new Set(prev).add(medicoId));
      
      if (!detalleData[medicoId]) {
        setLoadingDetalle(prev => new Set(prev).add(medicoId));
        
        try {
          console.log(`🔍 [CONSULTAS_TABLE] Obteniendo detalles para médico ${medicoId} con centroId: ${centroId}`);
          const detalleData = await apiService.getDetalleConsultasMedico(medicoId, filtros);
          
          setDetalleData(prev => ({
            ...prev,
            [medicoId]: detalleData
          }));
        } catch (error) {
          console.error('Error al cargar el detalle de consultas:', error);
          onError?.('Error al cargar el detalle de consultas');
        } finally {
          setLoadingDetalle(prev => {
            const newSet = new Set(prev);
            newSet.delete(medicoId);
            return newSet;
          });
        }
      }
    }
  };

  const exportarDetalle = (medicoId: number) => {
    const detalle = detalleData[medicoId];
    if (!detalle || detalle.length === 0) return;

    const headers = ['Fecha', 'Paciente', 'Cédula', 'Observaciones', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...detalle.map(consulta => [
        `"${formatDate(consulta.fecha)}"`,
        `"${consulta.paciente_nombre} ${consulta.paciente_apellido}"`,
        `"${consulta.cedula || 'N/A'}"`,
        `"${consulta.observaciones || 'N/A'}"`,
        `"${consulta.estado}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `detalle_consultas_medico_${medicoId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Consultas</h3>
              <p className="text-sm text-gray-600">Detalle de consultas por médico</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Consultas</h3>
            <p className="text-sm text-gray-600">Detalle de consultas por médico</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médico
              </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Consultas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pacientes Únicos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primera Consulta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Consulta
                  </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((medico) => {
              const isExpanded = expandedRows.has(medico.medico_id);
              const isLoadingDetalle = loadingDetalle.has(medico.medico_id);
              const detalle = detalleData[medico.medico_id] || [];

              return (
                <React.Fragment key={medico.medico_id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {getInitials(medico.nombres, medico.apellidos)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {medico.nombres} {medico.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">ID: {medico.medico_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {medico.especialidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {medico.total_consultas.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {medico.pacientes_unicos}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medico.primera_consulta ? formatDate(medico.primera_consulta) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medico.ultima_consulta ? formatDate(medico.ultima_consulta) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleRow(medico.medico_id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {isExpanded ? 'Ocultar' : 'Ver'} Detalle
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 ml-1" />
                          ) : (
                            <ChevronRight className="w-3 h-3 ml-1" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Fila expandida con detalle */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              Detalle de Consultas - {medico.nombres} {medico.apellidos}
                            </h4>
                            {detalle.length > 0 && (
                              <button
                                onClick={() => exportarDetalle(medico.medico_id)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Exportar CSV
                              </button>
                            )}
                          </div>

                          {isLoadingDetalle ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                              <span className="text-sm text-gray-600">Cargando detalle...</span>
                            </div>
                          ) : detalle.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Fecha
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Paciente
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Motivo
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Diagnóstico
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Estado
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {detalle.map((consulta) => (
                                    <tr key={consulta.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(consulta.fecha)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {consulta.paciente_nombre} {consulta.paciente_apellido}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {consulta.cedula || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {consulta.observaciones || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          consulta.estado === 'completada' 
                                            ? 'bg-green-100 text-green-800'
                                            : consulta.estado === 'pendiente'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : consulta.estado === 'programada'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {consulta.estado}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">No hay consultas detalladas disponibles</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};