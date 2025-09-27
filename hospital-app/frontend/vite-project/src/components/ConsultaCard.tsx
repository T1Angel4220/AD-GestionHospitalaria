import React from 'react';
import { 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Building2, 
  Activity, 
  Edit, 
  Trash2 
} from 'lucide-react';
import type { Consulta } from '../types/consultas';

interface ConsultaCardProps {
  consulta: Consulta;
  onEdit: (consulta: Consulta) => void;
  onDelete: (consulta: Consulta) => void;
  getStatusColor: (estado: string) => string;
  getStatusText: (estado: string) => string;
}

const ConsultaCard: React.FC<ConsultaCardProps> = ({ 
  consulta, 
  onEdit, 
  onDelete, 
  getStatusColor, 
  getStatusText 
}) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {consulta.paciente_nombre} {consulta.paciente_apellido}
                </h3>
                <p className="text-sm text-gray-500">ID: {consulta.id}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consulta.estado)}`}>
                {getStatusText(consulta.estado)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Médico:</span>
                <span className="text-gray-600">
                  {consulta.medico_nombres && consulta.medico_apellidos 
                    ? `Dr. ${consulta.medico_nombres} ${consulta.medico_apellidos}`
                    : `ID: ${consulta.id_medico}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Fecha:</span>
                <span className="text-gray-600">{new Date(consulta.fecha).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Hora:</span>
                <span className="text-gray-600">
                  {new Date(consulta.fecha).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Centro:</span>
                <span className="text-gray-600">
                  {consulta.centro_nombre 
                    ? `${consulta.centro_nombre}${consulta.centro_ciudad ? ` - ${consulta.centro_ciudad}` : ''}`
                    : `ID: ${consulta.id_centro}`
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm mb-4">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-700">Especialidad:</span>
              <span className="text-gray-600">
                {consulta.especialidad_nombre || 'No especificada'}
              </span>
            </div>

            {consulta.motivo && (
              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Motivo de la consulta:</p>
                <p className="text-sm text-gray-600">{consulta.motivo}</p>
              </div>
            )}

            {consulta.diagnostico && (
              <div className="bg-green-50 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                <p className="text-sm text-gray-600">{consulta.diagnostico}</p>
              </div>
            )}

            {consulta.tratamiento && (
              <div className="bg-blue-50 rounded-md p-3 mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Tratamiento:</p>
                <p className="text-sm text-gray-600">{consulta.tratamiento}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Creado: {new Date(consulta.created_at).toLocaleString("es-ES")}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              onClick={() => onEdit(consulta)}
              className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(consulta)}
              className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultaCard;
