import { X, Users, Trash2 } from 'lucide-react'
import type { AdminCentro, AdminMedico } from '../api/adminApi'
import type { RegisterRequest } from '../types/auth'
import type { UsuarioAdmin } from '../types/usuarios'

interface UsuarioModalsProps {
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  isDeleteModalOpen: boolean
  setIsDeleteModalOpen: (open: boolean) => void
  selectedUsuario: UsuarioAdmin | null
  usuarioForm: RegisterRequest
  setUsuarioForm: (form: RegisterRequest) => void
  centros: AdminCentro[]
  medicos: AdminMedico[]
  handleCreateUsuario: (e: React.FormEvent) => void
  handleEditUsuario: (e: React.FormEvent) => void
  handleDeleteUsuario: () => void
  onCentroChange?: (centroId: number) => void
  isEditMode?: boolean
  buttonColors: {
    primary: string
    primaryHover: string
    primaryFocus: string
    primaryIcon: string
  }
}

export function UsuarioModals({
  isCreateModalOpen,
  setIsCreateModalOpen,
  isEditModalOpen,
  setIsEditModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedUsuario,
  usuarioForm,
  setUsuarioForm,
  centros,
  medicos,
  handleCreateUsuario,
  handleEditUsuario,
  handleDeleteUsuario,
  onCentroChange,
  isEditMode = false,
  buttonColors
}: UsuarioModalsProps) {
  return (
    <>
      {/* Modal para crear usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsCreateModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className={`px-8 py-6 ${buttonColors.primary} rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Users className={`h-6 w-6 ${buttonColors.primaryIcon}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nuevo Usuario</h3>
                    <p className="text-purple-100 text-sm">Crear usuario del sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCreateUsuario} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={usuarioForm.email}
                    onChange={(e) => setUsuarioForm({...usuarioForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="usuario@hospital.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={usuarioForm.password}
                    onChange={(e) => setUsuarioForm({...usuarioForm, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={usuarioForm.rol}
                    onChange={(e) => setUsuarioForm({...usuarioForm, rol: e.target.value as 'admin' | 'medico'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  >
                    <option value="medico">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centro Médico
                  </label>
                  <select
                    value={usuarioForm.id_centro}
                    onChange={(e) => {
                      const centroId = Number(e.target.value);
                      setUsuarioForm({...usuarioForm, id_centro: centroId, id_medico: undefined});
                      // Filtrar médicos del centro seleccionado
                      if (onCentroChange) {
                        onCentroChange(centroId);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                    disabled={isEditMode}
                  >
                    {centros.map((centro) => (
                      <option key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <p className="mt-1 text-xs text-gray-500">
                      No se puede cambiar el centro médico al editar
                    </p>
                  )}
                </div>

                {usuarioForm.rol === 'medico' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Médico Asociado (Opcional)
                    </label>
                    <select
                      value={usuarioForm.id_medico || ''}
                      onChange={(e) => setUsuarioForm({...usuarioForm, id_medico: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    >
                      <option value="">Seleccionar médico...</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nombres} {medico.apellidos}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Solo se muestran médicos del centro seleccionado que no tienen cuenta
                    </p>
                  </div>
                )}

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
                    className={`px-6 py-3 text-sm font-semibold text-white ${buttonColors.primary} ${buttonColors.primaryHover} rounded-xl transition-all duration-200 transform hover:scale-105`}
                  >
                    Crear Usuario
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {isEditModalOpen && selectedUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className={`px-8 py-6 ${buttonColors.primary} rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Users className={`h-6 w-6 ${buttonColors.primaryIcon}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Editar Usuario</h3>
                    <p className="text-purple-100 text-sm">Actualizar información del usuario</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleEditUsuario} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={usuarioForm.email}
                    onChange={(e) => setUsuarioForm({...usuarioForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="usuario@hospital.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    value={usuarioForm.password}
                    onChange={(e) => setUsuarioForm({...usuarioForm, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Dejar vacío para mantener la actual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={usuarioForm.rol}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    <option value="medico">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    El rol no se puede cambiar al editar
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centro Médico
                  </label>
                  <select
                    value={usuarioForm.id_centro}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    {centros.map((centro) => (
                      <option key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    El centro médico no se puede cambiar al editar
                  </p>
                </div>

                {usuarioForm.rol === 'medico' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Médico Asociado
                    </label>
                    <select
                      value={usuarioForm.id_medico || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      <option value="">Seleccionar médico...</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nombres} {medico.apellidos}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      El médico asociado no se puede cambiar al editar. Si necesitas cambiar la asociación, elimina este usuario y crea uno nuevo.
                    </p>
                  </div>
                )}

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
                    className={`px-6 py-3 text-sm font-semibold text-white ${buttonColors.primary} ${buttonColors.primaryHover} rounded-xl transition-all duration-200 transform hover:scale-105`}
                  >
                    Actualizar Usuario
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para eliminar usuario */}
      {isDeleteModalOpen && selectedUsuario && (
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
                    <h3 className="text-xl font-bold text-white">Eliminar Usuario</h3>
                    <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-8 py-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUsuario.email}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Esta acción eliminará permanentemente el usuario y todos los datos asociados.
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
                  onClick={handleDeleteUsuario}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}