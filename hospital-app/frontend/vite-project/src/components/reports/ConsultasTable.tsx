// components/reports/ConsultasTable.tsx
import React, { useState } from 'react';
import { Eye, ChevronDown, ChevronRight, Calendar, User, FileText, Download } from 'lucide-react';
import type { ConsultaResumen, ConsultaDetalle } from '../../types/reports';
import { formatDate, getInitials } from '../../lib/utils';
import { apiService } from '../../api/reports';
import { config } from '../../config/env';

interface ConsultasTableProps {
  data: ConsultaResumen[];
  loading?: boolean;
  onError?: (error: string) => void;
  centroId?: number;
}

export const ConsultasTable: React.FC<ConsultasTableProps> = ({
  data,
  loading = false,
  onError,
  centroId = config.defaultCentroId
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [detalleData, setDetalleData] = useState<Record<number, ConsultaDetalle[]>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<Set<number>>(new Set());

  const toggleRow = async (medicoId: number) => {
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
          const response = await apiService.getDetalleConsultasMedico(medicoId, { centroId });
          
          if (response.error) {
            onError?.(response.error);
          } else if (response.data) {
            setDetalleData(prev => ({
              ...prev,
              [medicoId]: response.data!
            }));
          }
        } catch (err) {
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

  const exportDetalle = (medicoId: number, medicoNombre: string) => {
    const detalles = detalleData[medicoId];
    if (!detalles || detalles.length === 0) return;

    const headers = ['Fecha', 'Paciente', 'Motivo', 'Diagnóstico', 'Tratamiento'];
    const csvContent = [
      headers.join(','),
      ...detalles.map(consulta => [
        formatDate(consulta.fecha),
        `"${consulta.paciente_nombre} ${consulta.paciente_apellido}"`,
        `"${consulta.motivo || 'N/A'}"`,
        `"${consulta.diagnostico || 'N/A'}"`,
        `"${consulta.tratamiento || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `detalle_consultas_${medicoNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="card-elevated mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="icon-container">
              <Eye className="icon-professional" />
            </div>
            <div>
              <h3 className="text-subheading font-semibold">Tabla de Consultas</h3>
              <p className="text-caption">Resumen y detalle de consultas por médico</p>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded loading-skeleton"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-elevated mb-8 p-8 text-center">
        <div className="icon-container mx-auto mb-4">
          <Eye className="icon-professional" />
        </div>
        <p className="text-body text-gray-500">No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="card-elevated mb-8 animate-fade-in">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="icon-container">
              <Eye className="icon-professional" />
            </div>
            <div>
              <h3 className="text-subheading font-semibold">Tabla de Consultas</h3>
              <p className="text-caption">Resumen y detalle de consultas por médico</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-caption text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{data.length} médico{data.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-professional">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Médico</th>
                <th>Especialidad</th>
                <th className="text-center">Total Consultas</th>
                <th>Primera Consulta</th>
                <th>Última Consulta</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((medico, index) => {
                const isExpanded = expandedRows.has(medico.medico_id);
                const isLoadingDetalle = loadingDetalle.has(medico.medico_id);
                const detalles = detalleData[medico.medico_id] || [];

                return (
                  <React.Fragment key={medico.medico_id}>
                    {/* Fila principal */}
                    <tr className="hover:bg-gray-50">
                      <td className="text-center">
                        <div className="avatar-professional">
                          {getInitials(medico.nombres, medico.apellidos)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {medico.nombres} {medico.apellidos}
                          </div>
                          <div className="text-caption text-gray-500">
                            ID: {medico.medico_id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-professional">
                          {medico.especialidad}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-bold text-lg text-gray-900">
                          {medico.total_consultas}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {medico.primera_consulta ? formatDate(medico.primera_consulta) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {medico.ultima_consulta ? formatDate(medico.ultima_consulta) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => toggleRow(medico.medico_id)}
                          className="btn-outline p-2"
                          disabled={isLoadingDetalle}
                        >
                          {isLoadingDetalle ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          ) : isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandida con detalles */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-0">
                          <div className="p-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-600" />
                                <h4 className="text-body font-semibold">Detalle de Consultas</h4>
                                <span className="badge-professional">
                                  {detalles.length} consulta{detalles.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {detalles.length > 0 && (
                                <button
                                  onClick={() => exportDetalle(medico.medico_id, `${medico.nombres} ${medico.apellidos}`)}
                                  className="btn-outline p-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Exportar CSV
                                </button>
                              )}
                            </div>
                            
                            {isLoadingDetalle ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                <span className="ml-2 text-caption">Cargando detalles...</span>
                              </div>
                            ) : detalles.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-3 px-4 text-caption font-semibold text-gray-600">Fecha</th>
                                      <th className="text-left py-3 px-4 text-caption font-semibold text-gray-600">Paciente</th>
                                      <th className="text-left py-3 px-4 text-caption font-semibold text-gray-600">Motivo</th>
                                      <th className="text-left py-3 px-4 text-caption font-semibold text-gray-600">Diagnóstico</th>
                                      <th className="text-left py-3 px-4 text-caption font-semibold text-gray-600">Tratamiento</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detalles.map((consulta) => (
                                      <tr key={consulta.id} className="border-b border-gray-100 hover:bg-white">
                                        <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{formatDate(consulta.fecha)}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{consulta.paciente_nombre} {consulta.paciente_apellido}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{consulta.motivo || 'N/A'}</td>
                                        <td className="py-3 px-4 text-sm">{consulta.diagnostico || 'N/A'}</td>
                                        <td className="py-3 px-4 text-sm">{consulta.tratamiento || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-caption text-gray-500">No hay detalles disponibles</p>
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
    </div>
  );
};