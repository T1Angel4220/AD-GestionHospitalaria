"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import { AuthApi } from '../api/authApi'
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
  User as UserIcon
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
      await ConsultasApi.createMedico(medicoForm)
      await loadData()
      resetMedicoForm()
    } catch (err) {
      setError("Error al crear el médico")
      console.error(err)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await AuthApi.register(userForm)
      alert('Usuario creado exitosamente')
      resetUserForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
      console.error(err)
    }
  }

  const resetMedicoForm = () => {
    setMedicoForm({
      nombres: '',
      apellidos: '',
      id_especialidad: 1,
      id_centro: 1
    })
    setIsMedicoModalOpen(false)
  }

  const resetUserForm = () => {
    setUserForm({
      email: '',
      password: '',
      rol: 'medico',
      id_centro: 1,
      id_medico: undefined
    })
    setIsUserModalOpen(false)
  }

  const filteredMedicos = medicos.filter(medico =>
    medico.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medico.especialidad_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header del Sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Activity className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">HospitalApp</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-6 py-8 space-y-4">
            <a href="#" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium bg-blue-600 text-white shadow-lg">
              <Home className="h-6 w-6" />
              Dashboard
            </a>
            <a href="/consultas" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
              <Activity className="h-6 w-6" />
              Consultas
            </a>
            <button
              onClick={() => setActiveTab('medicos')}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium w-full text-left transition-all duration-200 ${
                activeTab === 'medicos' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Stethoscope className="h-6 w-6" />
              Médicos
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium w-full text-left transition-all duration-200 ${
                activeTab === 'usuarios' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Users className="h-6 w-6" />
              Usuarios
            </button>
          </nav>

          {/* User Info */}
          <div className="p-6 border-t border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-4 px-4 py-4 w-full text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200"
            >
              <LogOut className="h-6 w-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900 mr-2">
                  <Menu className="h-6 w-6" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'medicos' ? 'Gestión de Médicos' : 'Gestión de Usuarios'}
                  </h1>
                  <p className="text-sm text-gray-600">Panel de administración</p>
                </div>
              </div>
              <button
                onClick={() => activeTab === 'medicos' ? setIsMedicoModalOpen(true) : setIsUserModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === 'medicos' ? 'Nuevo Médico' : 'Nuevo Usuario'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Buscar ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'medicos' ? (
            <div className="space-y-4">
              {filteredMedicos.map((medico) => (
                <div key={medico.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {medico.nombres} {medico.apellidos}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {medico.especialidad_nombre || 'Sin especialidad'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Centro: {centros.find(c => c.id === medico.id_centro)?.nombre || `ID: ${medico.id_centro}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1 text-gray-900">Gestión de Usuarios</h3>
                <p className="text-gray-500 mb-4">
                  Aquí podrás ver y gestionar todos los usuarios del sistema
                </p>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Usuario
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Médico */}
      {isMedicoModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white shadow-xl rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nuevo Médico
                </h3>
                <button
                  onClick={resetMedicoForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateMedico} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres
                    </label>
                    <input
                      type="text"
                      value={medicoForm.nombres}
                      onChange={(e) => setMedicoForm(prev => ({ ...prev, nombres: e.target.value }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={medicoForm.apellidos}
                      onChange={(e) => setMedicoForm(prev => ({ ...prev, apellidos: e.target.value }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Centro Médico
                    </label>
                    <select
                      value={medicoForm.id_centro}
                      onChange={(e) => setMedicoForm(prev => ({ ...prev, id_centro: Number(e.target.value) }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {centros.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                          {centro.nombre} - {centro.ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad
                    </label>
                    <select
                      value={medicoForm.id_especialidad}
                      onChange={(e) => setMedicoForm(prev => ({ ...prev, id_especialidad: Number(e.target.value) }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Medicina General</option>
                      <option value={2}>Cardiología</option>
                      <option value={3}>Neurología</option>
                      <option value={4}>Pediatría</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetMedicoForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Crear Médico
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white shadow-xl rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nuevo Usuario
                </h3>
                <button
                  onClick={resetUserForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <select
                      value={userForm.rol}
                      onChange={(e) => setUserForm(prev => ({ ...prev, rol: e.target.value as 'admin' | 'medico' }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={userForm.id_centro}
                      onChange={(e) => setUserForm(prev => ({ ...prev, id_centro: Number(e.target.value) }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {centros.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                          {centro.nombre} - {centro.ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {userForm.rol === 'medico' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Médico Asociado
                    </label>
                    <select
                      value={userForm.id_medico || ''}
                      onChange={(e) => setUserForm(prev => ({ ...prev, id_medico: Number(e.target.value) }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar médico</option>
                      {medicos
                        .filter(medico => medico.id_centro === userForm.id_centro)
                        .map((medico) => (
                          <option key={medico.id} value={medico.id}>
                            Dr. {medico.nombres} {medico.apellidos}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Crear Usuario
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
