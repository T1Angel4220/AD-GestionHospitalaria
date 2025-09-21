"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Usuario, CentroMedico, Medico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  LogOut,
  Plus,
  Menu,
  Search,
  Edit,
  Trash2,
  X,
  Stethoscope,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react'

export default function UsuariosPage() {
  const { user, logout } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [centros, setCentros] = useState<CentroMedico[]>([])
  const [medicosDisponibles, setMedicosDisponibles] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  // Estados para formularios
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    rol: 'medico' as 'admin' | 'medico',
    id_centro: 1,
    id_medico: undefined as number | undefined
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usuariosData, centrosData, medicosDisponiblesData] = await Promise.all([
        ConsultasApi.getUsuarios(),
        ConsultasApi.getCentros(),
        ConsultasApi.getMedicosDisponibles(),
      ])
      setUsuarios(usuariosData)
      setCentros(centrosData)
      setMedicosDisponibles(medicosDisponiblesData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await ConsultasApi.createUsuario(userForm)
      setIsUserModalOpen(false)
      setUserForm({ email: '', password: '', rol: 'medico', id_centro: 1, id_medico: undefined })
      // Recargar datos después de crear usuario
      loadData()
    } catch (err) {
      setError("Error al crear el usuario")
      console.error(err)
    }
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-purple-100 text-xs">Sistema Médico</p>
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
            <a href="/admin/reportes" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-amber-500 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Dashboard</div>
                <div className="text-xs text-gray-400">Panel principal</div>
              </div>
            </a>
            <a href="/consultas" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Consultas</div>
                <div className="text-xs text-gray-400">Citas médicas</div>
              </div>
            </a>
            <a href="/admin" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Médicos</div>
                <div className="text-xs text-gray-400">Personal médico</div>
              </div>
            </a>
            <a href="/usuarios" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Usuarios</div>
                <div className="text-xs text-purple-100">Gestión usuarios</div>
              </div>
            </a>
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{user?.email}</div>
                <div className="text-gray-400 text-xs">Administrador</div>
              </div>
            </div>
            <button
              onClick={logout}
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-purple-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
                  <p className="text-purple-100 mt-1">Administra los usuarios del sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">{user?.email}</p>
                  <p className="text-purple-100 text-sm">Administrador</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.rol === 'admin').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Médicos</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.rol === 'medico').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Asociados</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.id_medico).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Add Button */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar usuarios por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Usuarios List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Lista de Usuarios
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona los usuarios del sistema (excluyendo usuarios ya asociados a médicos)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Centro Médico
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {usuario.email}
                            </div>
                            <div className="text-sm text-gray-500">ID: {usuario.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          usuario.rol === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol === 'admin' ? 'Administrador' : 'Médico'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {usuario.centro_nombre || `Centro ${usuario.id_centro}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          usuario.medico_nombres && usuario.medico_apellidos
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.medico_nombres && usuario.medico_apellidos 
                            ? 'Asociado'
                            : 'Disponible'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsUserModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nuevo Usuario</h3>
                    <p className="text-purple-100 text-sm">Crear cuenta de usuario</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <form onSubmit={handleCreateUser} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="usuario@hospital.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={userForm.rol}
                  onChange={(e) => setUserForm({...userForm, rol: e.target.value as 'admin' | 'medico'})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                >
                  <option value="medico">Médico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  value={userForm.id_centro}
                  onChange={(e) => setUserForm({...userForm, id_centro: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                >
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {userForm.rol === 'medico' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Médico Asociado (Opcional)
                  </label>
                  <select
                    value={userForm.id_medico || ''}
                    onChange={(e) => setUserForm({...userForm, id_medico: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">
                      {medicosDisponibles.filter(medico => medico.id_centro === userForm.id_centro).length === 0 
                        ? 'No hay médicos disponibles en este centro' 
                        : 'Seleccionar médico'
                      }
                    </option>
                    {medicosDisponibles
                      .filter(medico => medico.id_centro === userForm.id_centro)
                      .map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nombres} {medico.apellidos} - {medico.especialidad_nombre || 'Sin especialidad'}
                        </option>
                      ))}
                  </select>
                  {medicosDisponibles.filter(medico => medico.id_centro === userForm.id_centro).length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 flex items-center">
                        <span className="mr-2">ℹ️</span>
                        Todos los médicos de este centro ya tienen usuarios asociados
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
