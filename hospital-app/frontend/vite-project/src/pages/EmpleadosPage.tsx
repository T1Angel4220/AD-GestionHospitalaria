"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { AdminApi, type AdminEmpleado, type AdminEmpleadoCreate, type AdminCentro } from '../api/adminApi'
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
  UserCheck,
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  Building2
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { getRoleText } from '../utils/roleUtils'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses, getHeaderColors } from '../utils/sidebarUtils'

export default function EmpleadosPage() {
  const { user, logout } = useAuth()
  const [empleados, setEmpleados] = useState<AdminEmpleado[]>([])
  const [centros, setCentros] = useState<AdminCentro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState<AdminEmpleado | null>(null)

  // Estados para formularios
  const [empleadoForm, setEmpleadoForm] = useState<AdminEmpleadoCreate>({
    nombres: '',
    apellidos: '',
    cargo: '',
    id_centro: 1
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
      const [empleadosData, centrosData] = await Promise.all([
        AdminApi.getEmpleados(),
        AdminApi.getCentros()
      ])
      setEmpleados(empleadosData)
      setCentros(centrosData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los empleados")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await AdminApi.createEmpleado(empleadoForm)
      setIsCreateModalOpen(false)
      setEmpleadoForm({ nombres: '', apellidos: '', cargo: '', id_centro: 1 })
      loadData()
    } catch (err) {
      setError("Error al crear el empleado")
      console.error(err)
    }
  }

  const handleEditEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpleado) return
    setError(null)

    try {
      await AdminApi.updateEmpleado(selectedEmpleado.id, empleadoForm)
      setIsEditModalOpen(false)
      setEmpleadoForm({ nombres: '', apellidos: '', cargo: '', id_centro: 1 })
      setSelectedEmpleado(null)
      loadData()
    } catch (err) {
      setError("Error al actualizar el empleado")
      console.error(err)
    }
  }

  const handleDeleteEmpleado = async () => {
    if (!selectedEmpleado) return
    setError(null)

    try {
      await AdminApi.deleteEmpleado(selectedEmpleado.id)
      setIsDeleteModalOpen(false)
      setSelectedEmpleado(null)
      loadData()
    } catch (err) {
      setError("Error al eliminar el empleado")
      console.error(err)
    }
  }

  const openEditModal = (empleado: AdminEmpleado) => {
    setSelectedEmpleado(empleado)
    setEmpleadoForm({
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      cargo: empleado.cargo,
      id_centro: empleado.id_centro
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (empleado: AdminEmpleado) => {
    setSelectedEmpleado(empleado)
    setIsDeleteModalOpen(true)
  }

  const filteredEmpleados = empleados.filter(empleado =>
    `${empleado.nombres} ${empleado.apellidos} ${empleado.cargo}`.toLowerCase().includes(searchTerm.toLowerCase())
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
              <p className="text-indigo-100 text-xs">Sistema Médico</p>
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
                <Users className={getIconClasses('medicos', activeItem)} />
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
                <Activity className={getIconClasses('especialidades', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('especialidades', activeItem).main}>Especialidades</div>
                <div className={getTextClasses('especialidades', activeItem).sub}>Especialidades médicas</div>
              </div>
            </a>
            
            {/* Empleados */}
            <a href="/empleados" className={getSidebarItemClasses('empleados', activeItem)}>
              <div className={getIconContainerClasses('empleados', activeItem)}>
                <UserCheck className={getIconClasses('empleados', activeItem)} />
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
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
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
                  className="lg:hidden p-2 rounded-md text-white hover:bg-indigo-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <UserCheck className={`h-8 w-8 mr-3 ${headerColors.iconColor}`} />
                    Gestión de Empleados
                  </h1>
                  <p className="text-indigo-100 mt-1">Administra el personal administrativo</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-indigo-600"
                  iconBackgroundColor="bg-indigo-700"
                  icon={UserCheck}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <UserCheck className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                  <p className="text-2xl font-bold text-gray-900">{empleados.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Enfermeras</p>
                  <p className="text-2xl font-bold text-gray-900">{empleados.filter(e => e.cargo.toLowerCase().includes('enfermer')).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{empleados.filter(e => e.cargo.toLowerCase().includes('admin')).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Centros</p>
                  <p className="text-2xl font-bold text-gray-900">{new Set(empleados.map(e => e.id_centro)).size}</p>
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
                placeholder="Buscar empleados por nombre o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Empleado
              </button>
            </div>
          </div>

          {/* Empleados List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Lista de Empleados
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona el personal administrativo del hospital
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Centro Médico
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmpleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                            <UserCheck className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {empleado.nombres} {empleado.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">ID: {empleado.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {empleado.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {empleado.centro_nombre || `Centro ${empleado.id_centro}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(empleado)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(empleado)}
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

      {/* Modal para crear empleado */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsCreateModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <UserCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nuevo Empleado</h3>
                    <p className="text-indigo-100 text-sm">Crear empleado</p>
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
            <form onSubmit={handleCreateEmpleado} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={empleadoForm.nombres}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, nombres: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="María"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={empleadoForm.apellidos}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, apellidos: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="González"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={empleadoForm.cargo}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, cargo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enfermera"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  value={empleadoForm.id_centro}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, id_centro: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar empleado */}
      {isEditModalOpen && selectedEmpleado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsEditModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Editar Empleado</h3>
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
            <form onSubmit={handleEditEmpleado} className="px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={empleadoForm.nombres}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, nombres: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="María"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={empleadoForm.apellidos}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, apellidos: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="González"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={empleadoForm.cargo}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, cargo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enfermera"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Centro Médico
                </label>
                <select
                  value={empleadoForm.id_centro}
                  onChange={(e) => setEmpleadoForm({...empleadoForm, id_centro: Number(e.target.value)})}
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Actualizar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para eliminar empleado */}
      {isDeleteModalOpen && selectedEmpleado && (
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
                    <h3 className="text-xl font-bold text-white">Eliminar Empleado</h3>
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
                  ¿Estás seguro de que deseas eliminar al empleado <strong>{selectedEmpleado.nombres} {selectedEmpleado.apellidos}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Esta acción eliminará permanentemente el empleado y todos los datos asociados.
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
                  onClick={handleDeleteEmpleado}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Eliminar Empleado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
