"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { AdminApi, type AdminEspecialidad, type AdminEspecialidadCreate } from '../api/adminApi'
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
  FileText,
  BarChart3,
  Building2,
  Heart
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { getRoleText } from '../utils/roleUtils'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses, getHeaderColors } from '../utils/sidebarUtils'

export default function EspecialidadesPage() {
  const { user, logout } = useAuth()
  const [especialidades, setEspecialidades] = useState<AdminEspecialidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<AdminEspecialidad | null>(null)

  // Estados para formularios
  const [especialidadForm, setEspecialidadForm] = useState<AdminEspecialidadCreate>({
    nombre: ''
  })

  // Determinar el elemento activo del sidebar y obtener colores
  const activeItem = getActiveSidebarItem(window.location.pathname);
  const headerColors = getHeaderColors(activeItem);

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const especialidadesData = await AdminApi.getEspecialidades()
      setEspecialidades(especialidadesData)
      setError(null)
    } catch (err) {
      setError("Error al cargar las especialidades")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await AdminApi.createEspecialidad(especialidadForm)
      setIsCreateModalOpen(false)
      setEspecialidadForm({ nombre: '' })
      loadData()
    } catch (err) {
      setError("Error al crear la especialidad")
      console.error(err)
    }
  }

  const handleEditEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEspecialidad) return
    setError(null)

    try {
      await AdminApi.updateEspecialidad(selectedEspecialidad.id, especialidadForm)
      setIsEditModalOpen(false)
      setEspecialidadForm({ nombre: '' })
      setSelectedEspecialidad(null)
      loadData()
    } catch (err) {
      setError("Error al actualizar la especialidad")
      console.error(err)
    }
  }

  const handleDeleteEspecialidad = async () => {
    if (!selectedEspecialidad) return
    setError(null)

    try {
      await AdminApi.deleteEspecialidad(selectedEspecialidad.id)
      setIsDeleteModalOpen(false)
      setSelectedEspecialidad(null)
      loadData()
    } catch (err) {
      setError("Error al eliminar la especialidad")
      console.error(err)
    }
  }

  const openEditModal = (especialidad: AdminEspecialidad) => {
    setSelectedEspecialidad(especialidad)
    setEspecialidadForm({
      nombre: especialidad.nombre
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (especialidad: AdminEspecialidad) => {
    setSelectedEspecialidad(especialidad)
    setIsDeleteModalOpen(true)
  }

  const filteredEspecialidades = especialidades.filter(especialidad =>
    especialidad.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className={`flex items-center justify-between h-20 px-6 ${headerColors.gradient}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className={`h-8 w-8 ${headerColors.iconColor}`} />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-orange-100 text-xs">Sistema Médico</p>
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
            {/* Dashboard */}
            <a href="/reportes" className={getSidebarItemClasses('dashboard', activeItem)}>
              <div className={getIconContainerClasses('dashboard', activeItem)}>
                <BarChart3 className={getIconClasses('dashboard', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('dashboard', activeItem).main}>Dashboard</div>
                <div className={getTextClasses('dashboard', activeItem).sub}>Panel principal</div>
              </div>
            </a>
            
            {/* Consultas */}
            <a href="/consultas" className={getSidebarItemClasses('consultas', activeItem)}>
              <div className={getIconContainerClasses('consultas', activeItem)}>
                <FileText className={getIconClasses('consultas', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('consultas', activeItem).main}>Consultas</div>
                <div className={getTextClasses('consultas', activeItem).sub}>Citas médicas</div>
              </div>
            </a>

            {/* Calendario */}
            <a href="/calendario" className={getSidebarItemClasses('calendario', activeItem)}>
              <div className={getIconContainerClasses('calendario', activeItem)}>
                <Calendar className={getIconClasses('calendario', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('calendario', activeItem).main}>Calendario</div>
                <div className={getTextClasses('calendario', activeItem).sub}>Vista mensual</div>
              </div>
            </a>
            
            {/* Médicos */}
            <a href="/medicos" className={getSidebarItemClasses('medicos', activeItem)}>
              <div className={getIconContainerClasses('medicos', activeItem)}>
                <Stethoscope className={getIconClasses('medicos', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('medicos', activeItem).main}>Médicos</div>
                <div className={getTextClasses('medicos', activeItem).sub}>Personal médico</div>
              </div>
            </a>
            
            {/* Centros Médicos */}
            <a href="/centros" className={getSidebarItemClasses('centros', activeItem)}>
              <div className={getIconContainerClasses('centros', activeItem)}>
                <Building2 className={getIconClasses('centros', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('centros', activeItem).main}>Centros</div>
                <div className={getTextClasses('centros', activeItem).sub}>Centros médicos</div>
              </div>
            </a>
            
            {/* Especialidades */}
            <a href="/especialidades" className={getSidebarItemClasses('especialidades', activeItem)}>
              <div className={getIconContainerClasses('especialidades', activeItem)}>
                <Stethoscope className={getIconClasses('especialidades', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('especialidades', activeItem).main}>Especialidades</div>
                <div className={getTextClasses('especialidades', activeItem).sub}>Áreas médicas</div>
              </div>
            </a>
            
            {/* Empleados */}
            <a href="/empleados" className={getSidebarItemClasses('empleados', activeItem)}>
              <div className={getIconContainerClasses('empleados', activeItem)}>
                <Users className={getIconClasses('empleados', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('empleados', activeItem).main}>Empleados</div>
                <div className={getTextClasses('empleados', activeItem).sub}>Personal administrativo</div>
              </div>
            </a>
            
            {/* Usuarios */}
            <a href="/usuarios" className={getSidebarItemClasses('usuarios', activeItem)}>
              <div className={getIconContainerClasses('usuarios', activeItem)}>
                <Users className={getIconClasses('usuarios', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('usuarios', activeItem).main}>Usuarios</div>
                <div className={getTextClasses('usuarios', activeItem).sub}>Gestión usuarios</div>
              </div>
            </a>
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-3">
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
        <div className={`${headerColors.gradient} shadow-lg`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-orange-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <Heart className={`h-8 w-8 mr-3 ${headerColors.iconColor}`} />
                    Gestión de Especialidades
                  </h1>
                  <p className="text-orange-100 mt-1">Administra las especialidades médicas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-orange-600"
                  iconBackgroundColor="bg-orange-700"
                  icon={Stethoscope}
                  roleText={getRoleText(user)}
                />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Stethoscope className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Especialidades</p>
                  <p className="text-2xl font-bold text-gray-900">{especialidades.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Más Común</p>
                  <p className="text-2xl font-bold text-gray-900">Medicina General</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{especialidades.length}</p>
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
                placeholder="Buscar especialidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Especialidad
              </button>
            </div>
          </div>

          {/* Especialidades List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Lista de Especialidades
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona las especialidades médicas del sistema
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEspecialidades.map((especialidad) => (
                    <tr key={especialidad.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                            <Stethoscope className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {especialidad.nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          #{especialidad.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(especialidad)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(especialidad)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
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

      {/* Modal para crear especialidad */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsCreateModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Stethoscope className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nueva Especialidad</h3>
                    <p className="text-orange-100 text-sm">Crear especialidad médica</p>
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
            <form onSubmit={handleCreateEspecialidad} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Especialidad
                </label>
                <input
                  type="text"
                  value={especialidadForm.nombre}
                  onChange={(e) => setEspecialidadForm({...especialidadForm, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Cardiología"
                  required
                />
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
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Especialidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar especialidad */}
      {isEditModalOpen && selectedEspecialidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Editar Especialidad</h3>
                    <p className="text-blue-100 text-sm">Actualizar información</p>
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
            <form onSubmit={handleEditEspecialidad} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Especialidad
                </label>
                <input
                  type="text"
                  value={especialidadForm.nombre}
                  onChange={(e) => setEspecialidadForm({...especialidadForm, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Cardiología"
                  required
                />
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
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Actualizar Especialidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para eliminar especialidad */}
      {isDeleteModalOpen && selectedEspecialidad && (
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
                    <h3 className="text-xl font-bold text-white">Eliminar Especialidad</h3>
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
                  ¿Estás seguro de que deseas eliminar la especialidad <strong>{selectedEspecialidad.nombre}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Esta acción eliminará permanentemente la especialidad y todos los datos asociados.
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
                  onClick={handleDeleteEspecialidad}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Eliminar Especialidad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
