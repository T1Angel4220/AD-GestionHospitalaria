import React from 'react';
import { FileText } from 'lucide-react';
import type { Consulta } from '../types/consultas';
import ConsultaCard from './ConsultaCard';

interface ConsultasListProps {
  consultas: Consulta[];
  onEdit: (consulta: Consulta) => void;
  onDelete: (consulta: Consulta) => void;
  getStatusColor: (estado: string) => string;
  getStatusText: (estado: string) => string;
  onCreateNew: () => void;
  searchTerm: string;
  filterStatus: string;
}

const ConsultasList: React.FC<ConsultasListProps> = ({
  consultas,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusText,
  onCreateNew,
  searchTerm,
  filterStatus
}) => {
  const filteredConsultas = consultas.filter((consulta) => {
    const matchesSearch = !searchTerm || 
      consulta.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.paciente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.tratamiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.medico_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.medico_apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.especialidad_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.centro_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || consulta.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (filteredConsultas.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="py-16 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No se encontraron consultas</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza creando tu primera consulta médica"}
          </p>
          {!searchTerm && filterStatus === "all" && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Crear Primera Consulta
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredConsultas.map((consulta) => (
        <ConsultaCard
          key={consulta.id}
          consulta={consulta}
          onEdit={onEdit}
          onDelete={onDelete}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ))}
    </div>
  );
};

export default ConsultasList;
