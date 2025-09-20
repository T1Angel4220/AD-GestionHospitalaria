"use client"

import React, { useState, useEffect } from "react"
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, CentroMedico } from '../types/consultas'
import { getStatusColor, getStatusText } from '../utils/statusUtils'
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Home,
  Plus,
  Menu,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  AlertCircle,
  User,
  Stethoscope,
  Clock,
  Building2
} from 'lucide-react'

export default function MedicalConsultationsPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estados para modales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null)

  // Estados para datos relacionados
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [centros, setCentros] = useState<CentroMedico[]>([])

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Estado del formulario del modal
  const [formData, setFormData] = useState<Partial<Consulta>>({
    paciente_nombre: "",
    paciente_apellido: "",
    id_medico: undefined,
    id_centro: undefined,
    fecha: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
    estado: "pendiente",
  })

  useEffect(() => {
    loadConsultas()
    loadRelatedData()
  }, [])

  const loadConsultas = async () => {
    try {
      setLoading(true)
      const data = await ConsultasApi.getConsultas()
      setConsultas(data)
    } catch (err) {
      setError("Error al cargar las consultas")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    try {
      const [medicosData, centrosData] = await Promise.all([
        ConsultasApi.getMedicos(),
        ConsultasApi.getCentros(),
      ])
      setMedicos(medicosData)
      setCentros(centrosData)
    } catch (err) {
      console.error("Error al cargar datos relacionados:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingConsulta) {
        const updateData: ConsultaUpdate = {
          paciente_nombre: formData.paciente_nombre,
          paciente_apellido: formData.paciente_apellido,
          id_medico: formData.id_medico,
          id_centro: formData.id_centro,
          fecha: formData.fecha,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          estado: formData.estado!,
        }
        await ConsultasApi.updateConsulta(editingConsulta.id, updateData)
      } else {
        const newData: ConsultaCreate = {
          paciente_nombre: formData.paciente_nombre!,
          paciente_apellido: formData.paciente_apellido!,
          id_medico: formData.id_medico!,
          id_centro: formData.id_centro!,
          fecha: formData.fecha!,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          estado: formData.estado!,
        }
        await ConsultasApi.createConsulta(newData)
      }
      await loadConsultas()
      resetForm()
    } catch (err) {
      setError("Error al guardar la consulta")
      console.error(err)
    }
  }

  const handleEdit = (consulta: Consulta) => {
    setEditingConsulta(consulta)
    setFormData({
      paciente_nombre: consulta.paciente_nombre,
      paciente_apellido: consulta.paciente_apellido,
      id_medico: consulta.id_medico,
      id_centro: consulta.id_centro,
      fecha: new Date(consulta.fecha).toISOString().slice(0, 16),
      motivo: consulta.motivo,
      diagnostico: consulta.diagnostico,
      tratamiento: consulta.tratamiento,
      estado: consulta.estado,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (consulta: Consulta) => {
    setConsultaToDelete(consulta)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!consultaToDelete) return
    try {
      await ConsultasApi.deleteConsulta(consultaToDelete.id)
      await loadConsultas()
      setIsDeleteModalOpen(false)
      setConsultaToDelete(null)
    } catch (err) {
      setError("Error al eliminar la consulta")
      console.error(err)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setConsultaToDelete(null)
  }

  const resetForm = () => {
    setEditingConsulta(null)
    setFormData({
      paciente_nombre: "",
      paciente_apellido: "",
      id_medico: undefined,
      id_centro: undefined,
      fecha: "",
      motivo: "",
      diagnostico: "",
      tratamiento: "",
      estado: "pendiente",
    })
    setIsDialogOpen(false)
  }

  const handleNewConsulta = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const filteredConsultas = consultas.filter((consulta) => {
    const matchesSearch =
      consulta.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.paciente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.medico_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.medico_apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.especialidad_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.centro_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.centro_ciudad?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "all" || consulta.estado === filterStatus

    return matchesSearch && matchesStatus
  })

  const calculateStats = () => {
    const stats = {
      total: consultas.length,
      pendiente: 0,
      programada: 0,
      completada: 0,
      cancelada: 0,
    }
    consultas.forEach((c) => {
      stats[c.estado]++
    })
    return stats
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando consultas...</div>
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
            <a href="#" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
              <Activity className="h-6 w-6" />
              Consultas
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
              <Users className="h-6 w-6" />
              Pacientes
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
              <Calendar className="h-6 w-6" />
              Citas
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
              <FileText className="h-6 w-6" />
              Reportes
            </a>
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-6 border-t border-gray-700">
            <button className="flex items-center gap-4 px-4 py-4 w-full text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200">
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
                  <h1 className="text-2xl font-bold text-gray-900">API de Consultas Médicas</h1>
                  <p className="text-sm text-gray-600">Gestión independiente por hospital</p>
                </div>
              </div>
              <button
                onClick={handleNewConsulta}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Consulta
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

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Consultas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completada}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Programadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.programada}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Canceladas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.cancelada}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros y Búsqueda</h3>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por paciente, médico, especialidad o hospital..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="all">Todos los estado</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="programada">Programadas</option>
                      <option value="completada">Completadas</option>
                      <option value="cancelada">Canceladas</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white">
                      <option value="all">Todas las especialidad</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consultas List */}
          <div className="space-y-4">
            {filteredConsultas.map((consulta) => (
              <div key={consulta.id} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {consulta.paciente_nombre} {consulta.paciente_apellido}
                          </h3>
                          <p className="text-sm text-gray-500">ID: {consulta.id}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consulta.estado)}`}>
                          {getStatusText(consulta.estado)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Stethoscope className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Médico:</span>
                          <span className="text-gray-600">
                            {consulta.medico_nombres && consulta.medico_apellidos
                              ? `Dr. ${consulta.medico_nombres} ${consulta.medico_apellidos}`
                              : `ID: ${consulta.id_medico}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Fecha:</span>
                          <span className="text-gray-600">{new Date(consulta.fecha).toLocaleDateString("es-ES")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Hora:</span>
                          <span className="text-gray-600">
                            {new Date(consulta.fecha).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Centro:</span>
                          <span className="text-gray-600">
                            {consulta.centro_nombre
                              ? `${consulta.centro_nombre}${consulta.centro_ciudad ? ` - ${consulta.centro_ciudad}` : ''}`
                              : `ID: ${consulta.id_centro}`
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm mb-4">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Especialidad:</span>
                        <span className="text-gray-600">
                          {consulta.especialidad_nombre || 'No especificada'}
                        </span>
                      </div>

                      {consulta.motivo && (
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Motivo de la consulta:</p>
                          <p className="text-sm text-gray-600">{consulta.motivo}</p>
                        </div>
                      )}

                      {consulta.diagnostico && (
                        <div className="bg-green-50 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                          <p className="text-sm text-gray-600">{consulta.diagnostico}</p>
                        </div>
                      )}

                      {consulta.tratamiento && (
                        <div className="bg-blue-50 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Tratamiento:</p>
                          <p className="text-sm text-gray-600">{consulta.tratamiento}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        Creado: {new Date(consulta.created_at).toLocaleString("es-ES")}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(consulta)}
                        className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(consulta)}
                        className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredConsultas.length === 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="py-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-1 text-gray-900">No se encontraron consultas</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Comienza creando tu primera consulta médica"}
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <button
                      onClick={handleNewConsulta}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Consulta
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Consulta - INCLUIDO DIRECTAMENTE */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingConsulta ? "Editar Consulta" : "Nueva Consulta Médica"}
                </h3>
                <button
                  onClick={resetForm}
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

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
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
      )}

      {/* Modal de Eliminación - INCLUIDO DIRECTAMENTE */}
      {isDeleteModalOpen && consultaToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mr-4">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">
                      ¿Estás seguro de que quieres eliminar esta consulta?
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {consultaToDelete.paciente_nombre} {consultaToDelete.paciente_apellido}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Médico:</strong> {consultaToDelete.medico_nombres && consultaToDelete.medico_apellidos
                      ? `Dr. ${consultaToDelete.medico_nombres} ${consultaToDelete.medico_apellidos}${consultaToDelete.especialidad_nombre ? ` (${consultaToDelete.especialidad_nombre})` : ''}`
                      : `ID: ${consultaToDelete.id_medico}`
                    }</p>
                    <p><strong>Fecha:</strong> {new Date(consultaToDelete.fecha).toLocaleDateString("es-ES")} {new Date(consultaToDelete.fecha).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</p>
                    <p><strong>Estado:</strong> {getStatusText(consultaToDelete.estado)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Eliminar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
