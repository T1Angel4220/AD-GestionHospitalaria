"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Medico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  LogOut,
  Menu,
  Search,
  Edit,
  Trash2,
  Stethoscope,
  AlertCircle,
  Calendar,
  FileText,
  X,
  BarChart3
} from 'lucide-react'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses } from '../utils/sidebarUtils'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Determinar el elemento activo del sidebar
  const activeItem = getActiveSidebarItem(window.location.pathname)


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const medicosData = await ConsultasApi.getMedicos()
      setMedicos(medicosData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMedicos = medicos.filter(medico =>
    `${medico.nombres} ${medico.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-blue-100 text-xs">Sistema Médico</p>
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
            {/* Dashboard - solo para administradores */}
            <a href="/admin/reportes" className={getSidebarItemClasses('dashboard', activeItem)}>
              <div className={getIconContainerClasses('dashboard', activeItem)}>
                <BarChart3 className={getIconClasses('dashboard', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('dashboard', activeItem).main}>Dashboard</div>
                <div className={getTextClasses('dashboard', activeItem).sub}>Panel principal</div>
              </div>
            </a>
            
            {/* Consultas - visible para todos */}
            <a href="/consultas" className={getSidebarItemClasses('consultas', activeItem)}>
              <div className={getIconContainerClasses('consultas', activeItem)}>
                <FileText className={getIconClasses('consultas', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('consultas', activeItem).main}>Consultas</div>
                <div className={getTextClasses('consultas', activeItem).sub}>Citas médicas</div>
              </div>
            </a>

            {/* Calendario - visible para todos */}
            <a href="/calendario" className={getSidebarItemClasses('calendario', activeItem)}>
              <div className={getIconContainerClasses('calendario', activeItem)}>
                <Calendar className={getIconClasses('calendario', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('calendario', activeItem).main}>Calendario</div>
                <div className={getTextClasses('calendario', activeItem).sub}>Vista mensual</div>
              </div>
            </a>
            
            {/* Médicos - solo para administradores */}
            <a href="/admin" className={getSidebarItemClasses('medicos', activeItem)}>
              <div className={getIconContainerClasses('medicos', activeItem)}>
                <Stethoscope className={getIconClasses('medicos', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('medicos', activeItem).main}>Médicos</div>
                <div className={getTextClasses('medicos', activeItem).sub}>Personal médico</div>
              </div>
            </a>
            
            {/* Usuarios - solo para administradores */}
            <a href="/usuarios" className={getSidebarItemClasses('usuarios', activeItem)}>
              <div className={getIconContainerClasses('usuarios', activeItem)}>
                <Users className={getIconClasses('usuarios', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('usuarios', activeItem).main}>Usuarios</div>
                <div className={getTextClasses('usuarios', activeItem).sub}>Gestión usuarios</div>
              </div>
            </a>

            {/* Perfil - solo para médicos */}
            {user?.rol === 'medico' && (
             <a href="/perfil" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
               <div className="w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                 <Users className="h-5 w-5" />
               </div>
               <div>
                 <div className="font-medium">Perfil</div>
                 <div className="text-xs text-gray-400">Mi información</div>
               </div>
             </a>
            )}
          </div>
          </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <Stethoscope className="h-5 w-5 text-white" />
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-blue-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">Gestión de Médicos</h1>
                  <p className="text-blue-100 mt-1">Administra el personal médico del hospital</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">{user?.email}</p>
                  <p className="text-blue-100 text-sm">Administrador</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                      </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Médicos</p>
                  <p className="text-2xl font-bold text-gray-900">{medicos.length}</p>
            </div>
          </div>
                      </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="h-8 w-8 text-green-600" />
                      </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Especialidades</p>
                  <p className="text-2xl font-bold text-gray-900">{new Set(medicos.map(m => m.especialidad_nombre)).size}</p>
                    </div>
                  </div>
                </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600" />
            </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Centros</p>
                  <p className="text-2xl font-bold text-gray-900">{new Set(medicos.map(m => m.centro_nombre)).size}</p>
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
                placeholder="Buscar médicos por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
                  <button
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                    Crear Médico
                  </button>
          </div>
        </div>

          {/* Médicos List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                Lista de Médicos
                </h3>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona el personal médico del hospital
              </p>
              </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Médico
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Especialidad
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
                  {filteredMedicos.map((medico) => (
                    <tr key={medico.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {medico.nombres} {medico.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">ID: {medico.id}</div>
                  </div>
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {medico.especialidad_nombre || 'Sin especialidad'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {medico.centro_nombre || `Centro ${medico.id_centro}`}
                  </div>
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

    </div>
  )
}
