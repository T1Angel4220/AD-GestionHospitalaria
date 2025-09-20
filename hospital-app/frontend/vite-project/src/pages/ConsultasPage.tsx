"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, CentroMedico } from '../types/consultas'
import {
  Calendar,
  Clock,
  User,
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Activity,
  Users,
  CalendarIcon,
  TrendingUp,
  Building2,
  Stethoscope,
  X,
  AlertCircle,
} from "lucide-react"

export default function MedicalConsultationsPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null)
  
  // Estados para datos relacionados
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [centros, setCentros] = useState<CentroMedico[]>([])

  const [formData, setFormData] = useState({
    id_centro: 1,
    id_medico: 1,
    paciente_nombre: "",
    paciente_apellido: "",
    fecha: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
    estado: "pendiente" as "pendiente" | "programada" | "completada" | "cancelada",
  })

  useEffect(() => {
    loadConsultas()
    loadRelatedData()
  }, [])

  const loadRelatedData = async () => {
    try {
      const [medicosData, centrosData] = await Promise.all([
        ConsultasApi.getMedicos(),
        ConsultasApi.getCentros()
      ])
      setMedicos(medicosData)
      setCentros(centrosData)
    } catch (err) {
      console.error('Error al cargar datos relacionados:', err)
    }
  }

  const loadConsultas = async () => {
    try {
      setLoading(true)
      const data = await ConsultasApi.getConsultas()
      setConsultas(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar consultas:', err)
      setError('Error al cargar las consultas')
    } finally {
      setLoading(false)
    }
  }

  const filteredConsultas = consultas.filter((consulta) => {
    const fullName = `${consulta.paciente_nombre} ${consulta.paciente_apellido}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || consulta.estado === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConsulta) {
        const updateData: ConsultaUpdate = {
          paciente_nombre: formData.paciente_nombre,
          paciente_apellido: formData.paciente_apellido,
          fecha: formData.fecha,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          estado: formData.estado,
        }
        await ConsultasApi.updateConsulta(editingConsulta.id, updateData)
        showNotification('Consulta actualizada correctamente', 'success')
      } else {
        const createData: ConsultaCreate = {
          id_centro: formData.id_centro,
          id_medico: formData.id_medico,
          paciente_nombre: formData.paciente_nombre,
          paciente_apellido: formData.paciente_apellido,
          fecha: formData.fecha,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          estado: formData.estado,
        }
        await ConsultasApi.createConsulta(createData)
        showNotification('Consulta creada correctamente', 'success')
      }
      await loadConsultas()
      resetForm()
    } catch (err) {
      console.error('Error al guardar consulta:', err)
      showNotification('Error al guardar la consulta', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      id_centro: 1,
      id_medico: 1,
      paciente_nombre: "",
      paciente_apellido: "",
      fecha: "",
      motivo: "",
      diagnostico: "",
      tratamiento: "",
      estado: "pendiente" as "pendiente" | "programada" | "completada" | "cancelada",
    })
    setEditingConsulta(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (consulta: Consulta) => {
    // Convertir fecha ISO a formato datetime-local
    const fechaFormatted = consulta.fecha ? 
      new Date(consulta.fecha).toISOString().slice(0, 16) : ""
    
    setFormData({
      id_centro: consulta.id_centro,
      id_medico: consulta.id_medico,
      paciente_nombre: consulta.paciente_nombre,
      paciente_apellido: consulta.paciente_apellido,
      fecha: fechaFormatted,
      motivo: consulta.motivo || "",
      diagnostico: consulta.diagnostico || "",
      tratamiento: consulta.tratamiento || "",
      estado: consulta.estado,
    })
    setEditingConsulta(consulta)
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
      showNotification('Consulta eliminada correctamente', 'success')
      setIsDeleteModalOpen(false)
      setConsultaToDelete(null)
    } catch (err) {
      console.error('Error al eliminar consulta:', err)
      showNotification('Error al eliminar la consulta', 'error')
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setConsultaToDelete(null)
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Implementar notificaciones toast
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800 border-green-200"
      case "programada":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (estado: string) => {
    switch (estado) {
      case "completada":
        return "Completada"
      case "programada":
        return "Programada"
      case "pendiente":
        return "Pendiente"
      case "cancelada":
        return "Cancelada"
      default:
        return estado
    }
  }

  const stats = {
    total: consultas.length,
    completada: consultas.filter((c) => c.estado === "completada").length,
    programada: consultas.filter((c) => c.estado === "programada").length,
    pendiente: consultas.filter((c) => c.estado === "pendiente").length,
    cancelada: consultas.filter((c) => c.estado === "cancelada").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando consultas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">API de Consultas Médicas</h1>
                <p className="text-gray-600 mt-1">Gestión independiente por hospital</p>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nueva Consulta
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Consultas</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.total}</dd>
                    <dd className="text-xs text-gray-500">Registros en el sistema</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                    <dd className="text-2xl font-bold text-green-600">{stats.completada}</dd>
                    <dd className="text-xs text-gray-500">Consultas finalizadas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Programadas</dt>
                    <dd className="text-2xl font-bold text-blue-600">{stats.programada}</dd>
                    <dd className="text-xs text-gray-500">Próximas citas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-2xl font-bold text-yellow-600">{stats.pendiente}</dd>
                    <dd className="text-xs text-gray-500">En espera</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Canceladas</dt>
                    <dd className="text-2xl font-bold text-red-600">{stats.cancelada}</dd>
                    <dd className="text-xs text-gray-500">Consultas canceladas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8">
          <div className="px-6 py-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Filtros y Búsqueda</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, motivo o diagnóstico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-48 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="programada">Programadas</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Consultas List */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {filteredConsultas.map((consulta) => (
            <div key={consulta.id} className="bg-white shadow-xl rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900">
                          {consulta.paciente_nombre} {consulta.paciente_apellido}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {consulta.id}</p>
                      </div>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(consulta.estado)}`}>
                        {getStatusText(consulta.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Stethoscope className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">Médico:</span>
                        <span className="text-gray-600">
                          {consulta.medico_nombres && consulta.medico_apellidos 
                            ? `Dr. ${consulta.medico_nombres} ${consulta.medico_apellidos}`
                            : `ID: ${consulta.id_medico}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">Fecha:</span>
                        <span className="text-gray-600">{new Date(consulta.fecha).toLocaleDateString("es-ES")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">Hora:</span>
                        <span className="text-gray-600">
                          {new Date(consulta.fecha).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">Centro:</span>
                        <span className="text-gray-600">
                          {consulta.centro_nombre 
                            ? `${consulta.centro_nombre}${consulta.centro_ciudad ? ` - ${consulta.centro_ciudad}` : ''}`
                            : `ID: ${consulta.id_centro}`
                          }
                        </span>
                      </div>
                    </div>

                    {consulta.motivo && (
                      <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                        <p className="text-sm font-semibold mb-2 text-gray-700">Motivo de la consulta:</p>
                        <p className="text-sm text-gray-600">{consulta.motivo}</p>
                      </div>
                    )}

                    {consulta.diagnostico && (
                      <div className="rounded-xl bg-green-50 p-4 border border-green-100">
                        <p className="text-sm font-semibold mb-2 text-green-800">Diagnóstico:</p>
                        <p className="text-sm text-green-700">{consulta.diagnostico}</p>
                      </div>
                    )}

                    {consulta.tratamiento && (
                      <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                        <p className="text-sm font-semibold mb-2 text-blue-800">Tratamiento:</p>
                        <p className="text-sm text-blue-700">{consulta.tratamiento}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Creado: {new Date(consulta.created_at).toLocaleString("es-ES")}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <button
                      onClick={() => handleEdit(consulta)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(consulta)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredConsultas.length === 0 && (
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
              <div className="py-16 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No se encontraron consultas</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterStatus !== "all"
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza creando tu primera consulta médica"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Crear Primera Consulta
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingConsulta ? "Editar Consulta" : "Nueva Consulta Médica"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
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
                      value={formData.paciente_nombre}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_nombre: e.target.value }))}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="paciente_apellido" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido del Paciente
                    </label>
                    <input
                      type="text"
                      id="paciente_apellido"
                      value={formData.paciente_apellido}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_apellido: e.target.value }))}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                      value={formData.id_medico}
                      onChange={(e) => setFormData((prev) => ({ ...prev, id_medico: Number(e.target.value) }))}
                      required
                      disabled={editingConsulta?.estado === 'completada'}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <label htmlFor="centro" className="block text-sm font-medium text-gray-700 mb-2">
                      Centro Médico
                    </label>
                    <select
                      id="centro"
                      value={formData.id_centro}
                      onChange={(e) => setFormData((prev) => ({ ...prev, id_centro: Number(e.target.value) }))}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Seleccionar centro</option>
                      {centros.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                          {centro.nombre} - {centro.ciudad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora
                    </label>
                    <input
                      type="datetime-local"
                      id="fecha"
                      value={formData.fecha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                      required
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value as any }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="programada">Programada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Consulta
                  </label>
                  <textarea
                    id="motivo"
                    value={formData.motivo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Describe el motivo de la consulta..."
                    rows={3}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="diagnostico" className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico
                  </label>
                  <textarea
                    id="diagnostico"
                    value={formData.diagnostico}
                    onChange={(e) => setFormData((prev) => ({ ...prev, diagnostico: e.target.value }))}
                    placeholder="Diagnóstico médico (opcional)"
                    rows={2}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="tratamiento" className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamiento
                  </label>
                  <textarea
                    id="tratamiento"
                    value={formData.tratamiento}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tratamiento: e.target.value }))}
                    placeholder="Tratamiento prescrito (opcional)"
                    rows={3}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                  >
                    {editingConsulta ? "Actualizar" : "Crear"} Consulta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && consultaToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Confirmar Eliminación</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {consultaToDelete.paciente_nombre} {consultaToDelete.paciente_apellido}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Médico:</strong> {consultaToDelete.medico_nombres && consultaToDelete.medico_apellidos 
                      ? `Dr. ${consultaToDelete.medico_nombres} ${consultaToDelete.medico_apellidos}`
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
                  className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
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