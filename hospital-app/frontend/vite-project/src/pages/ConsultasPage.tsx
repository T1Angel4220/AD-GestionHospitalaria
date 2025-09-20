"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaCreate, ConsultaUpdate } from '../types/consultas'
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
} from "lucide-react"

interface MedicalConsultation {
  id: string
  id_centro: number
  id_medico: number
  paciente_nombre: string
  paciente_apellido: string
  fecha: string
  motivo: string
  diagnostico: string
  tratamiento: string
  created_at: string
  // Additional fields for display
  medico_nombre: string
  especialidad: string
  centro_nombre: string
  status: "pendiente" | "programada" | "completada" | "cancelada"
}

export default function MedicalConsultationsPage() {
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<MedicalConsultation | null>(null)

  const [formData, setFormData] = useState({
    id_centro: 1,
    id_medico: 1,
    paciente_nombre: "",
    paciente_apellido: "",
    fecha: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
    medico_nombre: "",
    especialidad: "",
    centro_nombre: "",
    status: "pendiente" as "pendiente" | "programada" | "completada" | "cancelada",
  })

  const specialties = [
    "Cardiología",
    "Neurología",
    "Pediatría",
    "Medicina General",
    "Ginecología",
    "Traumatología",
    "Dermatología",
    "Psiquiatría",
    "Oftalmología",
    "Otorrinolaringología",
  ]

  useEffect(() => {
    loadConsultations()
  }, [])

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const data = await ConsultasApi.getConsultas()
      // Convertir datos del backend al formato esperado
      const formattedData: MedicalConsultation[] = data.map(consulta => ({
        id: consulta.id.toString(),
        id_centro: consulta.id_centro,
        id_medico: consulta.id_medico,
        paciente_nombre: consulta.paciente_nombre,
        paciente_apellido: consulta.paciente_apellido,
        fecha: consulta.fecha,
        motivo: consulta.motivo || "",
        diagnostico: consulta.diagnostico || "",
        tratamiento: consulta.tratamiento || "",
        created_at: consulta.created_at,
        medico_nombre: `Dr. Médico ${consulta.id_medico}`,
        especialidad: "Medicina General",
        centro_nombre: `Hospital ${consulta.id_centro}`,
        status: getConsultaStatus(consulta),
      }))
      setConsultations(formattedData)
      setError(null)
    } catch (err) {
      console.error('Error al cargar consultas:', err)
      setError('Error al cargar las consultas')
    } finally {
      setLoading(false)
    }
  }

  const getConsultaStatus = (consulta: Consulta): "pendiente" | "programada" | "completada" | "cancelada" => {
    // Usar el estado de la base de datos si existe
    if (consulta.estado) {
      return consulta.estado
    }
    
    // Lógica de fallback para determinar el estado
    if (consulta.diagnostico && consulta.tratamiento) {
      return "completada"
    } else if (new Date(consulta.fecha) > new Date()) {
      return "programada"
    } else {
      return "pendiente"
    }
  }

  const filteredConsultations = consultations.filter((consultation) => {
    const fullName = `${consultation.paciente_nombre} ${consultation.paciente_apellido}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.medico_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.centro_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || consultation.status === filterStatus
    const matchesSpecialty = filterSpecialty === "all" || consultation.especialidad === filterSpecialty
    return matchesSearch && matchesFilter && matchesSpecialty
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConsultation) {
        const updateData: ConsultaUpdate = {
          paciente_nombre: formData.paciente_nombre,
          paciente_apellido: formData.paciente_apellido,
          fecha: formData.fecha,
          motivo: formData.motivo,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          estado: formData.status,
        }
        await ConsultasApi.updateConsulta(parseInt(editingConsultation.id), updateData)
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
          estado: formData.status,
        }
        await ConsultasApi.createConsulta(createData)
        showNotification('Consulta creada correctamente', 'success')
      }
      await loadConsultations()
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
      medico_nombre: "",
      especialidad: "",
      centro_nombre: "",
      status: "programada",
    })
    setEditingConsultation(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (consultation: MedicalConsultation) => {
    setFormData({
      id_centro: consultation.id_centro,
      id_medico: consultation.id_medico,
      paciente_nombre: consultation.paciente_nombre,
      paciente_apellido: consultation.paciente_apellido,
      fecha: consultation.fecha,
      motivo: consultation.motivo,
      diagnostico: consultation.diagnostico,
      tratamiento: consultation.tratamiento,
      medico_nombre: consultation.medico_nombre,
      especialidad: consultation.especialidad,
      centro_nombre: consultation.centro_nombre,
      status: consultation.status as "programada" | "completada" | "cancelada",
    })
    setEditingConsultation(consultation)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta consulta?')) {
      try {
        await ConsultasApi.deleteConsulta(parseInt(id))
        await loadConsultations()
        showNotification('Consulta eliminada correctamente', 'success')
      } catch (err) {
        console.error('Error al eliminar consulta:', err)
        showNotification('Error al eliminar la consulta', 'error')
      }
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Implementar notificaciones toast
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "completada":
        return "Completada"
      case "programada":
        return "Programada"
      case "pendiente":
        return "Pendiente"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  const stats = {
    total: consultations.length,
    completada: consultations.filter((c) => c.status === "completada").length,
    programada: consultations.filter((c) => c.status === "programada").length,
    pendiente: consultations.filter((c) => c.status === "pendiente").length,
    cancelada: consultations.filter((c) => c.status === "cancelada").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consultas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API de Consultas Médicas</h1>
                <p className="text-sm text-gray-500">Gestión independiente por hospital</p>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Consulta
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Consultas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    <dd className="text-xs text-gray-500">Registros en el sistema</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                    <dd className="text-lg font-medium text-green-600">{stats.completada}</dd>
                    <dd className="text-xs text-gray-500">Consultas finalizadas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Programadas</dt>
                    <dd className="text-lg font-medium text-blue-600">{stats.programada}</dd>
                    <dd className="text-xs text-gray-500">Próximas citas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                    <dd className="text-lg font-medium text-yellow-600">{stats.pendiente}</dd>
                    <dd className="text-xs text-gray-500">En espera</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Canceladas</dt>
                    <dd className="text-lg font-medium text-red-600">{stats.cancelada}</dd>
                    <dd className="text-xs text-gray-500">Consultas canceladas</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Filtros y Búsqueda</h3>
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
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="programada">Programadas</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas las especialidades</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {filteredConsultations.map((consultation) => (
            <div key={consultation.id} className="bg-white shadow rounded-lg transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {consultation.paciente_nombre} {consultation.paciente_apellido}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {consultation.id}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Stethoscope className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Médico:</span>
                        <span className="text-gray-600">{consultation.medico_nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Fecha:</span>
                        <span className="text-gray-600">{new Date(consultation.fecha).toLocaleDateString("es-ES")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Hora:</span>
                        <span className="text-gray-600">
                          {new Date(consultation.fecha).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Especialidad:</span>
                        <span className="text-gray-600">{consultation.especialidad}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Centro:</span>
                      <span className="text-gray-600">{consultation.centro_nombre}</span>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium mb-1 text-gray-700">Motivo de la consulta:</p>
                      <p className="text-sm text-gray-600">{consultation.motivo}</p>
                    </div>

                    {consultation.diagnostico && (
                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-sm font-medium mb-1 text-green-800">Diagnóstico:</p>
                        <p className="text-sm text-green-700">{consultation.diagnostico}</p>
                      </div>
                    )}

                    {consultation.tratamiento && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-sm font-medium mb-1 text-blue-800">Tratamiento:</p>
                        <p className="text-sm text-blue-700">{consultation.tratamiento}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Creado: {new Date(consultation.created_at).toLocaleString("es-ES")}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(consultation)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(consultation.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredConsultations.length === 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No se encontraron consultas</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== "all" || filterSpecialty !== "all"
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza creando tu primera consulta médica"}
                </p>
                {!searchTerm && filterStatus === "all" && filterSpecialty === "all" && (
                  <button
                    onClick={() => setIsDialogOpen(true)}
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

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingConsultation ? "Editar Consulta" : "Nueva Consulta Médica"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                {editingConsultation
                  ? "Modifica los datos de la consulta médica."
                  : "Registra una nueva consulta médica en el sistema."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="paciente_nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Paciente
                    </label>
                    <input
                      type="text"
                      id="paciente_nombre"
                      value={formData.paciente_nombre}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_nombre: e.target.value }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="paciente_apellido" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido del Paciente
                    </label>
                    <input
                      type="text"
                      id="paciente_apellido"
                      value={formData.paciente_apellido}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_apellido: e.target.value }))}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="medico_nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Médico
                    </label>
                    <input
                      type="text"
                      id="medico_nombre"
                      value={formData.medico_nombre}
                      onChange={(e) => setFormData((prev) => ({ ...prev, medico_nombre: e.target.value }))}
                      placeholder="Dr. Juan Pérez"
                      required
                      disabled={editingConsultation?.status === "completada"}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    {editingConsultation?.status === "completada" && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠️ No se puede cambiar el médico en consultas completadas por temas de auditoría
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidad
                    </label>
                    <select
                      id="especialidad"
                      value={formData.especialidad}
                      onChange={(e) => setFormData((prev) => ({ ...prev, especialidad: e.target.value }))}
                      disabled={editingConsultation?.status === "completada"}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar especialidad</option>
                      {specialties.map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="centro_nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Centro Médico
                    </label>
                    <input
                      type="text"
                      id="centro_nombre"
                      value={formData.centro_nombre}
                      onChange={(e) => setFormData((prev) => ({ ...prev, centro_nombre: e.target.value }))}
                      placeholder="Hospital Central"
                      required
                      disabled={editingConsultation?.status === "completada"}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha y Hora
                    </label>
                    <input
                      type="datetime-local"
                      id="fecha"
                      value={formData.fecha}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                      required
                      disabled={editingConsultation?.status === "completada"}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="programada">Programada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de la Consulta
                  </label>
                  <textarea
                    id="motivo"
                    value={formData.motivo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Describe el motivo de la consulta..."
                    rows={3}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="diagnostico" className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    id="diagnostico"
                    value={formData.diagnostico}
                    onChange={(e) => setFormData((prev) => ({ ...prev, diagnostico: e.target.value }))}
                    placeholder="Diagnóstico médico (opcional para consultas programadas)"
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="tratamiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamiento
                  </label>
                  <textarea
                    id="tratamiento"
                    value={formData.tratamiento}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tratamiento: e.target.value }))}
                    placeholder="Tratamiento prescrito (opcional para consultas programadas)"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
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
                    {editingConsultation ? "Actualizar" : "Crear"} Consulta
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