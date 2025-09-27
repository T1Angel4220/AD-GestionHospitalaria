import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Consulta, Medico, CentroMedico } from '../types/consultas';

interface ConsultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: Partial<Consulta>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Consulta>>>;
  medicos: Medico[];
  centros: CentroMedico[];
  editingConsulta: Consulta | null;
}

const ConsultaModal: React.FC<ConsultaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  medicos,
  centros,
  editingConsulta
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingConsulta ? "Editar Consulta" : "Nueva Consulta Médica"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {editingConsulta
              ? "Modifica los datos de la consulta médica."
              : "Registra una nueva consulta médica en el sistema."}
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="paciente_nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Paciente
                </label>
                <input
                  type="text"
                  id="paciente_nombre"
                  value={formData.paciente_nombre || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paciente_nombre: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 border-2 border-blue-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="paciente_apellido" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido del Paciente
                </label>
                <input
                  type="text"
                  id="paciente_apellido"
                  value={formData.paciente_apellido || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paciente_apellido: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="medico" className="block text-sm font-medium text-gray-700 mb-2">
                  Médico
                </label>
                <select
                  id="medico"
                  value={formData.id_medico || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, id_medico: Number(e.target.value) }))}
                  required
                  disabled={editingConsulta?.estado === 'completada'}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar médico</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      Dr. {medico.nombres} {medico.apellidos} - {medico.especialidad_nombre || 'Sin especialidad'}
                    </option>
                  ))}
                </select>
                {editingConsulta?.estado === 'completada' && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No se puede cambiar el médico en consultas completadas por temas de auditoría
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  id="especialidad"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar especialidad</option>
                  <option value="medicina_general">Medicina General</option>
                  <option value="cardiologia">Cardiología</option>
                  <option value="neurologia">Neurología</option>
                  <option value="pediatria">Pediatría</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="centro" className="block text-sm font-medium text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  id="centro"
                  value={formData.id_centro || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, id_centro: Number(e.target.value) }))}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar centro</option>
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre} - {centro.ciudad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="fecha"
                    value={formData.fecha || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  value={formData.estado || 'pendiente'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value as any }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="programada">Programada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div></div>
            </div>

            <div>
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Consulta
              </label>
              <textarea
                id="motivo"
                value={formData.motivo || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Describe el motivo de la consulta..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="diagnostico" className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico
              </label>
              <textarea
                id="diagnostico"
                value={formData.diagnostico || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, diagnostico: e.target.value }))}
                placeholder="Diagnóstico médico (opcional para consultas programadas)"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tratamiento" className="block text-sm font-medium text-gray-700 mb-2">
                Tratamiento
              </label>
              <textarea
                id="tratamiento"
                value={formData.tratamiento || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, tratamiento: e.target.value }))}
                placeholder="Tratamiento prescrito (opcional para consultas programadas)"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingConsulta ? "Actualizar" : "Crear"} Consulta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsultaModal;
