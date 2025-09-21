"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Medico, CentroMedico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  UserPlus,
  LogOut,
  Home,
  Plus,
  Menu,
  Search,
  Edit,
  Trash2,
  X,
  Stethoscope,
  User as UserIcon,
  Building2,
  AlertCircle
} from 'lucide-react'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [centros, setCentros] = useState<CentroMedico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'medicos' | 'usuarios'>('medicos')
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para modales
  const [isMedicoModalOpen, setIsMedicoModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  // Estados para formularios
  const [medicoForm, setMedicoForm] = useState({
    nombres: '',
    apellidos: '',
    id_especialidad: 1,
    id_centro: 1
  })

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
      const [medicosData, centrosData] = await Promise.all([
        ConsultasApi.getMedicos(),
        ConsultasApi.getCentros(),
      ])
      setMedicos(medicosData)
      setCentros(centrosData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMedico = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const newMedico = await ConsultasApi.createMedico(medicoForm)
      setMedicos(prev => [...prev, newMedico])
      setIsMedicoModalOpen(false)
      setMedicoForm({ nombres: '', apellidos: '', id_especialidad: 1, id_centro: 1 })
    } catch (err) {
      setError("Error al crear el médico")
      console.error(err)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Aquí implementarías la creación de usuario
      console.log('Crear usuario:', userForm)
      setIsUserModalOpen(false)
      setUserForm({ email: '', password: '', rol: 'medico', id_centro: 1, id_medico: undefined })
    } catch (err) {
      setError("Error al crear el usuario")
      console.error(err)
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
            <button className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </button>
            <button className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <Stethoscope className="h-5 w-5 mr-3" />
              Consultas
            </button>
            <button className="w-full flex items-center px-4 py-2 text-white bg-blue-800 rounded-lg">
              <Users className="h-5 w-5 mr-3" />
              Médicos
            </button>
            <button className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800 rounded-lg">
              <UserIcon className="h-5 w-5 mr-3" />
              Usuarios
            </button>
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

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('medicos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'medicos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Médicos
                </button>
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'usuarios'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Usuarios
                </button>
              </nav>
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
                placeholder="Buscar medicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setIsMedicoModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Médico
              </button>
            </div>
          </div>

          {/* Médicos List */}
          {activeTab === 'medicos' && (
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
                              Centro {medico.id_centro}
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
          )}

          {/* Usuarios List */}
          {activeTab === 'usuarios' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Lista de Usuarios
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Gestiona los usuarios del sistema
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-gray-500">Funcionalidad de usuarios en desarrollo...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear médico */}
      {isMedicoModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nuevo Médico</h3>
                <button
                  onClick={() => setIsMedicoModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleCreateMedico} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombres</label>
                  <input
                    type="text"
                    value={medicoForm.nombres}
                    onChange={(e) => setMedicoForm({...medicoForm, nombres: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                  <input
                    type="text"
                    value={medicoForm.apellidos}
                    onChange={(e) => setMedicoForm({...medicoForm, apellidos: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsMedicoModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}