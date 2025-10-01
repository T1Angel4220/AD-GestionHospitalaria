import { X, Stethoscope, Trash2 } from 'lucide-react'
import type { AdminMedico, AdminMedicoCreate, AdminEspecialidad, AdminCentro } from '../api/adminApi'
import { useValidation } from '../hooks/useValidation'

interface MedicoModalsProps {
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  isDeleteModalOpen: boolean
  setIsDeleteModalOpen: (open: boolean) => void
  selectedMedico: AdminMedico | null
  medicoForm: AdminMedicoCreate
  setMedicoForm: (form: AdminMedicoCreate) => void
  especialidades: AdminEspecialidad[]
  centros: AdminCentro[]
  handleCreateMedico: (e: React.FormEvent) => void
  handleEditMedico: (e: React.FormEvent) => void
  handleDeleteMedico: () => void
}

export function MedicoModals({
  isCreateModalOpen,
  setIsCreateModalOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedMedico,
  medicoForm,
  setMedicoForm,
  especialidades,
  centros,
  handleCreateMedico,
  handleEditMedico,
  handleDeleteMedico
}: MedicoModalsProps) {
  const { errors, validateMedico, clearAllErrors, sanitizeText } = useValidation()
  return (
    <>
      {/* Modal para crear médico */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsCreateModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nuevo Médico</h3>
                    <p className="text-blue-100 text-sm">Crear médico</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <form onSubmit={(e) => {
              e.preventDefault()
              clearAllErrors()
              
              // Sanitizar datos
              const sanitizedForm = {
                ...medicoForm,
                nombres: sanitizeText(medicoForm.nombres),
                apellidos: sanitizeText(medicoForm.apellidos)
              }
              
              // Validar formulario
              if (validateMedico(sanitizedForm)) {
                handleCreateMedico(e)
              }
            }} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={medicoForm.nombres}
                  onChange={(e) => setMedicoForm({...medicoForm, nombres: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.nombres ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Juan"
                  required
                />
                {errors.nombres && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={medicoForm.apellidos}
                  onChange={(e) => setMedicoForm({...medicoForm, apellidos: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.apellidos ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Pérez"
                  required
                />
                {errors.apellidos && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cédula
                </label>
                <input
                  type="text"
                  value={medicoForm.cedula}
                  onChange={(e) => setMedicoForm({...medicoForm, cedula: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.cedula ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="1234567890"
                  required
                />
                {errors.cedula && (
                  <p className="mt-1 text-sm text-red-600">{errors.cedula}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={medicoForm.telefono || ''}
                  onChange={(e) => setMedicoForm({...medicoForm, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0987654321"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={medicoForm.email || ''}
                  onChange={(e) => setMedicoForm({...medicoForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="medico@hospital.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  value={medicoForm.id_especialidad}
                  onChange={(e) => setMedicoForm({...medicoForm, id_especialidad: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  {especialidades.map((especialidad) => (
                    <option key={especialidad.id} value={especialidad.id}>
                      {especialidad.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  value={medicoForm.id_centro}
                  onChange={(e) => setMedicoForm({...medicoForm, id_centro: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar médico */}
      {isEditModalOpen && selectedMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Stethoscope className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Editar Médico</h3>
                    <p className="text-green-100 text-sm">Actualizar información</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <form onSubmit={handleEditMedico} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={medicoForm.nombres}
                  onChange={(e) => setMedicoForm({...medicoForm, nombres: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={medicoForm.apellidos}
                  onChange={(e) => setMedicoForm({...medicoForm, apellidos: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cédula
                </label>
                <input
                  type="text"
                  value={medicoForm.cedula}
                  onChange={(e) => setMedicoForm({...medicoForm, cedula: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="1234567890"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={medicoForm.telefono || ''}
                  onChange={(e) => setMedicoForm({...medicoForm, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="0987654321"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={medicoForm.email || ''}
                  onChange={(e) => setMedicoForm({...medicoForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="medico@hospital.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  value={medicoForm.id_especialidad}
                  onChange={(e) => setMedicoForm({...medicoForm, id_especialidad: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                >
                  {especialidades.map((especialidad) => (
                    <option key={especialidad.id} value={especialidad.id}>
                      {especialidad.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  value={medicoForm.id_centro}
                  onChange={(e) => setMedicoForm({...medicoForm, id_centro: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                >
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Actualizar Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para eliminar médico */}
      {isDeleteModalOpen && selectedMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsDeleteModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Eliminar Médico</h3>
                    <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-8 py-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar al médico <strong>{selectedMedico.nombres} {selectedMedico.apellidos}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Esta acción eliminará permanentemente el médico y todos los datos asociados.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteMedico}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Eliminar Médico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
