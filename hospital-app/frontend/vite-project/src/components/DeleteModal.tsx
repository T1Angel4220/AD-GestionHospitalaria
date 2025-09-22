import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Consulta } from '../types/consultas';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  consulta: Consulta | null;
  getStatusText: (estado: string) => string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  consulta,
  getStatusText
}) => {
  if (!isOpen || !consulta) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-lg bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mr-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  ¿Estás seguro de que quieres eliminar esta consulta?
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                {consulta.paciente_nombre} {consulta.paciente_apellido}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Médico:</strong> {consulta.medico_nombres && consulta.medico_apellidos 
                  ? `Dr. ${consulta.medico_nombres} ${consulta.medico_apellidos}${consulta.especialidad_nombre ? ` (${consulta.especialidad_nombre})` : ''}`
                  : `ID: ${consulta.id_medico}`
                }</p>
                <p><strong>Fecha:</strong> {new Date(consulta.fecha).toLocaleDateString("es-ES")} {new Date(consulta.fecha).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
                <p><strong>Estado:</strong> {getStatusText(consulta.estado)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Eliminar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
