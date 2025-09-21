"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Medico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  LogOut,
  Home,
  Menu,
  Search,
  Edit,
  Trash2,
  Stethoscope,
  AlertCircle,
  Calendar
} from 'lucide-react'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")


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
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-center h-16 bg-blue-800">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-white mr-2" />
            <span className="text-white text-xl font-bold">HospitalApp</span>
          </div>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <a href="/admin" className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </a>
            <a href="/consultas" className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <Calendar className="h-5 w-5 mr-3" />
              Consultas
            </a>
            <a href="/admin" className="w-full flex items-center px-4 py-2 text-white bg-blue-800 rounded-lg">
              <Stethoscope className="h-5 w-5 mr-3" />
              Médicos
            </a>
            <a href="/usuarios" className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <Users className="h-5 w-5 mr-3" />
              Usuarios
            </a>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-blue-800 rounded-lg p-4">
            <div className="text-white text-sm font-medium">{user?.email}</div>
            <div className="text-gray-300 text-xs">Admin</div>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center text-gray-300 hover:text-white text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Médicos</h1>
                  <p className="text-sm text-gray-600">Panel de administración</p>
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


          {/* Search and Add Button */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar medicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Crear Médico
              </button>
            </div>
          </div>

          {/* Médicos List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Médicos
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Gestiona los médicos del sistema
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Especialidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Centro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMedicos.map((medico) => (
                      <tr key={medico.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {medico.nombres} {medico.apellidos}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {medico.especialidad_nombre || 'Sin especialidad'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {medico.centro_nombre || `Centro ${medico.id_centro}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
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

    </div>
  )
}