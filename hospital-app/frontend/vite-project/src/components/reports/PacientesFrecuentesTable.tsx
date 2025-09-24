import React from 'react';
import { User, Phone, Mail, Calendar, Users } from 'lucide-react';
import type { PacienteFrecuente } from '../../api/reports';

interface PacientesFrecuentesTableProps {
  data: PacienteFrecuente[];
  loading?: boolean;
}

export const PacientesFrecuentesTable: React.FC<PacientesFrecuentesTableProps> = ({ 
  data, 
  loading = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return 'N/A';
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pacientes Más Frecuentes</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No hay datos disponibles</p>
          <p className="text-gray-400 text-sm mt-1">No se encontraron pacientes con consultas en el período seleccionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Pacientes Más Frecuentes</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Top {data.length}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {data.map((paciente, index) => (
            <div key={paciente.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">
                    {paciente.nombres} {paciente.apellidos}
                  </h4>
                  {paciente.genero && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      paciente.genero === 'M' ? 'bg-blue-100 text-blue-800' :
                      paciente.genero === 'F' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {paciente.genero === 'M' ? 'Masculino' : paciente.genero === 'F' ? 'Femenino' : 'Otro'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {paciente.cedula && (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Cédula: {paciente.cedula}</span>
                    </div>
                  )}
                  {paciente.telefono && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{paciente.telefono}</span>
                    </div>
                  )}
                  {paciente.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span className="truncate max-w-32">{paciente.email}</span>
                    </div>
                  )}
                  {paciente.fecha_nacimiento && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{calculateAge(paciente.fecha_nacimiento)} años</span>
                    </div>
                  )}
                </div>
                
                {paciente.medicos_atendidos && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Médicos:</span> {paciente.medicos_atendidos}
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1 rounded-lg">
                  {paciente.total_consultas}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  consultas
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  <div>Primera: {formatDate(paciente.primera_consulta)}</div>
                  <div>Última: {formatDate(paciente.ultima_consulta)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
