"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico } from '../types/consultas'
import { getStatusColor, getStatusText } from '../utils/statusUtils'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses } from '../utils/sidebarUtils'
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Plus,
  Menu,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Stethoscope,
  Clock,
  Building2,
  Eye,
  BarChart3
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { getRoleText } from '../utils/roleUtils'

export default function MedicalConsultationsPage() {
  const { user, logout } = useAuth()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Determinar el elemento activo del sidebar
  const activeItem = getActiveSidebarItem(window.location.pathname)

  // Estados para modales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null)

  // Estados para datos relacionados
  const [medicos, setMedicos] = useState<Medico[]>([])

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
    duracion_minutos: 0,
  })

  // Estado para la especialidad seleccionada
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("")
  // Estado para el centro seleccionado
  const [selectedCentro, setSelectedCentro] = useState<string>("")
  // Estado para la información del médico actual (si el usuario es médico)
  const [medicoActual, setMedicoActual] = useState<Medico | null>(null)
  // Estado para el modal de confirmación
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  // Estado para el modal de confirmación de edición
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false)
  // Estado para los datos que se van a actualizar
  const [pendingUpdateData, setPendingUpdateData] = useState<ConsultaUpdate | null>(null)
  
  // Variable para controlar si el formulario está en modo solo lectura
  const isReadOnly = Boolean(editingConsulta && (editingConsulta.estado === 'completada' || editingConsulta.estado === 'cancelada'))

  useEffect(() => {
    loadConsultas()
    loadRelatedData()
    loadMedicoActual()
  }, [])

  // Efecto para manejar cambios de estado y duración
  useEffect(() => {
    if (formData.estado === 'cancelada') {
      // Si se cancela, duración = 0
      setFormData(prev => ({ ...prev, duracion_minutos: 0 }))
    } else if (formData.estado === 'pendiente') {
      // Si es pendiente, duración = 0
      setFormData(prev => ({ ...prev, duracion_minutos: 0 }))
    }
    // Para 'programada' y 'completada' no cambiamos el valor automáticamente
  }, [formData.estado])

  const loadMedicoActual = async () => {
    if (user?.rol === 'medico' && user.id_medico && medicos.length > 0) {
      try {
        const medico = medicos.find(m => m.id === user.id_medico)
        if (medico) {
          console.log('Médico encontrado:', medico)
          setMedicoActual(medico)
          setSelectedEspecialidad(medico.especialidad_nombre || 'Sin especialidad')
          setSelectedCentro(medico.centro_nombre || 'Sin centro')
          console.log('Especialidad:', medico.especialidad_nombre)
          console.log('Centro:', medico.centro_nombre)
        }
      } catch (error) {
        console.error('Error cargando médico actual:', error)
      }
    }
  }

  // Cargar médico actual cuando se carguen los médicos
  useEffect(() => {
    if (medicos.length > 0) {
      loadMedicoActual()
    }
  }, [medicos, user])

  const loadConsultas = async () => {
    try {
      setLoading(true)
      const data = await ConsultasApi.getConsultas()
      
      // Si es médico, filtrar solo sus consultas
      if (user?.rol === 'medico' && user.id_medico) {
        const consultasMedico = data.filter(consulta => consulta.id_medico === user.id_medico)
        setConsultas(consultasMedico)
      } else {
      setConsultas(data)
      }
    } catch (err) {
      setError("Error al cargar las consultas")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    try {
      const medicosData = await ConsultasApi.getMedicos()
      setMedicos(medicosData)
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
          duracion_minutos: formData.duracion_minutos,
        }
        // Guardar datos pendientes y mostrar modal de confirmación
        setPendingUpdateData(updateData)
        setShowEditConfirmModal(true)
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
          duracion_minutos: formData.duracion_minutos,
        }
        await ConsultasApi.createConsulta(newData)
        setShowSuccessModal(true)
      await loadConsultas()
      resetForm()
      }
    } catch (err) {
      setError("Error al guardar la consulta")
      console.error(err)
    }
  }

  const handleMedicoChange = (medicoId: number) => {
    const medico = medicos.find(m => m.id === medicoId)
    if (medico) {
      setSelectedEspecialidad(medico.especialidad_nombre || 'Sin especialidad')
      setSelectedCentro(medico.centro_nombre || 'Sin centro')
      // Actualizar también el id_centro en el formulario
      setFormData((prev) => ({ ...prev, id_centro: medico.id_centro }))
    } else {
      setSelectedEspecialidad("")
      setSelectedCentro("")
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
      duracion_minutos: consulta.duracion_minutos || 0,
    })
    // Cargar especialidad y centro del médico seleccionado
    if (consulta.id_medico) {
      const medico = medicos.find(m => m.id === consulta.id_medico)
      if (medico) {
        setSelectedEspecialidad(medico.especialidad_nombre || 'Sin especialidad')
        setSelectedCentro(medico.centro_nombre || 'Sin centro')
      }
    }
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

  const handleEditConfirm = async () => {
    if (!editingConsulta || !pendingUpdateData) return
    
    try {
      await ConsultasApi.updateConsulta(editingConsulta.id, pendingUpdateData)
      await loadConsultas()
      setShowEditConfirmModal(false)
      setPendingUpdateData(null)
      resetForm()
    } catch (err) {
      setError("Error al actualizar la consulta")
      console.error(err)
    }
  }

  const handleEditCancel = () => {
    setShowEditConfirmModal(false)
    setPendingUpdateData(null)
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
      duracion_minutos: 0,
    })
    setSelectedEspecialidad("")
    setSelectedCentro("")
    setIsDialogOpen(false)
  }

  const handleNewConsulta = () => {
    resetForm()
    
    // Si el usuario es médico, pre-llenar con su información
    if (user?.rol === 'medico' && medicoActual) {
      setFormData(prev => ({
        ...prev,
        id_medico: medicoActual.id,
        id_centro: medicoActual.id_centro
      }))
      // Cargar especialidad y centro del médico actual
      setSelectedEspecialidad(medicoActual.especialidad_nombre || 'Sin especialidad')
      setSelectedCentro(medicoActual.centro_nombre || 'Sin centro')
    }
    
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
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-green-600" />
              </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-green-100 text-xs">Sistema Médico</p>
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
            {user?.rol === 'admin' && (
              <a href="/admin/reportes" className={getSidebarItemClasses('dashboard', activeItem)}>
                <div className={getIconContainerClasses('dashboard', activeItem)}>
                  <BarChart3 className={getIconClasses('dashboard', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('dashboard', activeItem).main}>Dashboard</div>
                  <div className={getTextClasses('dashboard', activeItem).sub}>Panel principal</div>
                </div>
              </a>
            )}
            
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
            
            {/* Solo mostrar Médicos para administradores */}
            {user?.rol === 'admin' && (
              <a href="/admin" className={getSidebarItemClasses('medicos', activeItem)}>
                <div className={getIconContainerClasses('medicos', activeItem)}>
                  <Stethoscope className={getIconClasses('medicos', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('medicos', activeItem).main}>Médicos</div>
                  <div className={getTextClasses('medicos', activeItem).sub}>Personal médico</div>
                </div>
              </a>
            )}
            
            {/* Solo mostrar Usuarios para administradores */}
            {user?.rol === 'admin' && (
              <a href="/usuarios" className={getSidebarItemClasses('usuarios', activeItem)}>
                <div className={getIconContainerClasses('usuarios', activeItem)}>
                  <Users className={getIconClasses('usuarios', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('usuarios', activeItem).main}>Usuarios</div>
                  <div className={getTextClasses('usuarios', activeItem).sub}>Gestión usuarios</div>
                </div>
              </a>
            )}

            {/* Perfil - solo para médicos */}
            {user?.rol === 'medico' && (
             <a href="/perfil" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
               <div className="w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <User className="h-5 w-5" />
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
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-base font-medium">{user?.email}</div>
                <div className="text-gray-400 text-sm font-medium">
                  {user?.rol === 'admin' ? 'Administrador' : 
                   medicoActual ? `Dr. ${medicoActual.nombres} ${medicoActual.apellidos}` : 'Médico'}
                </div>
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-green-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">Gestión de Consultas</h1>
                  <p className="text-green-100 mt-1">Administra las consultas médicas del hospital</p>
                </div>
                </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-green-600"
                  iconBackgroundColor="bg-green-700"
                  icon={FileText}
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
              <span className="text-base">{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-8 w-8 text-green-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-base font-medium text-gray-600">Total Consultas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-base font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completada}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-yellow-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-base font-medium text-gray-600">Programadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.programada}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Clock className="h-8 w-8 text-red-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-base font-medium text-gray-600">Canceladas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelada}</p>
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
                placeholder="Buscar consultas por paciente, médico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                  <option value="all">Todos los estados</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="programada">Programadas</option>
                      <option value="completada">Completadas</option>
                      <option value="cancelada">Canceladas</option>
                    </select>
                  </div>
              <button
                onClick={handleNewConsulta}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Consulta
              </button>
            </div>
          </div>

          {/* Consultas List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Lista de Consultas
              </h3>
              <p className="mt-1 text-base text-gray-600">
                Gestiona las consultas médicas del hospital
              </p>
            </div>
            <div>
            {filteredConsultas.map((consulta) => (
              <div key={consulta.id} className="p-6 hover:bg-gray-50 transition-colors border border-gray-200 rounded-xl mb-4 shadow-sm bg-white">
                {/* Header mejorado */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-green-700" />
                        </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl">
                            {consulta.paciente_nombre} {consulta.paciente_apellido}
                          </h3>
                      <p className="text-base text-gray-500 font-medium">ID: {consulta.id}</p>
                        </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-base font-semibold ${getStatusColor(consulta.estado)}`}>
                          {getStatusText(consulta.estado)}
                        </span>
                    <div className="flex gap-2">
                      {/* Solo mostrar botón de editar si no está completada o cancelada */}
                      {consulta.estado !== 'completada' && consulta.estado !== 'cancelada' && (
                        <button
                          onClick={() => handleEdit(consulta)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                          title="Editar consulta"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                      {/* Solo mostrar botón de eliminar si no está completada o cancelada */}
                      {consulta.estado !== 'completada' && consulta.estado !== 'cancelada' && (
                        <button
                          onClick={() => handleDeleteClick(consulta)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                          title="Eliminar consulta"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                      {/* Botón de solo ver para consultas completadas o canceladas */}
                      {(consulta.estado === 'completada' || consulta.estado === 'cancelada') && (
                        <button
                          onClick={() => handleEdit(consulta)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors shadow-sm"
                          title="Ver consulta"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                      </div>

                {/* Información principal mejorada */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <p className="text-base text-gray-600 font-semibold">Médico</p>
                    </div>
                    <p className="text-base text-gray-800 font-medium">
                            {consulta.medico_nombres && consulta.medico_apellidos
                              ? `Dr. ${consulta.medico_nombres} ${consulta.medico_apellidos}`
                              : `ID: ${consulta.id_medico}`
                            }
                    </p>
                        </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <p className="text-base text-gray-600 font-semibold">Especialidad</p>
                        </div>
                    <p className="text-base text-gray-800 font-medium">
                      {consulta.especialidad_nombre || 'No especificada'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <p className="text-base text-gray-600 font-semibold">Fecha</p>
                    </div>
                    <p className="text-base text-gray-800 font-medium">
                      {new Date(consulta.fecha).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <p className="text-base text-gray-600 font-semibold">Hora</p>
                    </div>
                    <p className="text-base text-gray-800 font-medium">
                            {new Date(consulta.fecha).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                    </p>
                        </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-orange-600" />
                      <p className="text-base text-gray-600 font-semibold">Centro</p>
                    </div>
                    <p className="text-base text-gray-800 font-medium">
                            {consulta.centro_nombre
                              ? `${consulta.centro_nombre}${consulta.centro_ciudad ? ` - ${consulta.centro_ciudad}` : ''}`
                              : `ID: ${consulta.id_centro}`
                            }
                    </p>
                      </div>

                      </div>

                {/* Motivo mejorado */}
                      {consulta.motivo && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <p className="text-base text-gray-600 font-semibold">Motivo de la Consulta</p>
                        </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="text-base text-gray-800 font-medium">{consulta.motivo}</p>
                        </div>
                        </div>
                      )}

                {/* Diagnóstico y Tratamiento mejorados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      <p className="text-base font-bold text-emerald-800">Diagnóstico</p>
                      </div>
                    <p className="text-base text-emerald-700 pl-4 font-medium">
                      {consulta.diagnostico || "Sin diagnóstico"}
                    </p>
                    </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      <p className="text-base font-bold text-amber-800">Tratamiento</p>
                    </div>
                    <p className="text-base text-amber-700 pl-4 font-medium">
                      {consulta.tratamiento || "Sin tratamiento"}
                    </p>
                  </div>
                </div>

                {/* Footer mejorado */}
                <div className="flex items-center justify-center pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-base text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Creado: {new Date(consulta.created_at).toLocaleString("es-ES")}</span>
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
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Consulta
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Modal de Consulta */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={resetForm}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full transform transition-all duration-300 scale-100 max-h-[85vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                  {editingConsulta ? "Editar Consulta" : "Nueva Consulta Médica"}
                </h3>
                    <p className="text-green-100 text-base">
                      {editingConsulta ? "Modifica los datos de la consulta" : "Registra una nueva consulta médica"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="paciente_nombre" className="block text-base font-semibold text-gray-700 mb-1">
                      Nombre del Paciente
                    </label>
                    <input
                      type="text"
                      id="paciente_nombre"
                      value={formData.paciente_nombre || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_nombre: e.target.value }))}
                      required
                      disabled={isReadOnly}
                      className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="paciente_apellido" className="block text-base font-semibold text-gray-700 mb-1">
                      Apellido del Paciente
                    </label>
                    <input
                      type="text"
                      id="paciente_apellido"
                      value={formData.paciente_apellido || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paciente_apellido: e.target.value }))}
                      required
                      disabled={isReadOnly}
                      className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="medico" className="block text-base font-semibold text-gray-700 mb-1">
                      Médico
                    </label>
                    {user?.rol === 'medico' ? (
                      <input
                        type="text"
                        value={medicoActual ? `DR. ${medicoActual.nombres.toUpperCase()} ${medicoActual.apellidos.toUpperCase()}` : ''}
                        readOnly
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    ) : (
                    <select
                      id="medico"
                      value={formData.id_medico || ''}
                        onChange={(e) => {
                          const medicoId = Number(e.target.value)
                          setFormData((prev) => ({ ...prev, id_medico: medicoId }))
                          handleMedicoChange(medicoId)
                        }}
                      required
                      disabled={editingConsulta?.estado === 'completada'}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    >
                      <option value="">Seleccionar médico</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                            Dr. {medico.nombres} {medico.apellidos}
                        </option>
                      ))}
                    </select>
                    )}
                    {user?.rol === 'medico' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Como médico, solo puedes crear consultas para ti mismo
                      </p>
                    )}
                    {editingConsulta?.estado === 'completada' && (
                      <p className="mt-1 text-base text-amber-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        No se puede cambiar el médico en consultas completadas por temas de auditoría
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="especialidad" className="block text-base font-semibold text-gray-700 mb-1">
                      Especialidad
                    </label>
                    <input
                      type="text"
                      id="especialidad"
                      value={selectedEspecialidad}
                      readOnly
                      placeholder="Selecciona un médico primero"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      La especialidad se carga automáticamente al seleccionar un médico
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="centro" className="block text-base font-semibold text-gray-700 mb-1">
                      Centro Médico
                    </label>
                    <input
                      type="text"
                      id="centro"
                      value={selectedCentro}
                      readOnly
                      placeholder="Selecciona un médico primero"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      El centro se carga automáticamente al seleccionar un médico
                    </p>
                  </div>
                  <div>
                    <label htmlFor="estado" className="block text-base font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      id="estado"
                      value={formData.estado || 'pendiente'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value as any }))}
                      disabled={isReadOnly}
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      {editingConsulta ? (
                        // Al editar, mostrar todos los estados
                        <>
                          <option value="pendiente">Pendiente</option>
                          <option value="programada">Programada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </>
                      ) : (
                        // Al crear, solo pendiente y programada
                        <>
                          <option value="pendiente">Pendiente</option>
                          <option value="programada">Programada</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duracion_minutos" className="block text-base font-medium text-gray-700 mb-1">
                      Duración (minutos) {
                        formData.estado === 'pendiente' ? '(Bloqueada)' :
                        formData.estado === 'cancelada' ? '(Bloqueada)' :
                        formData.estado === 'programada' ? '(Requerida)' :
                        formData.estado === 'completada' ? '(Requerida)' : '(Opcional)'
                      }
                    </label>
                    <input
                      type="number"
                      id="duracion_minutos"
                      value={formData.duracion_minutos || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, duracion_minutos: parseInt(e.target.value) || 0 }))}
                      min="0"
                      max="480"
                      step="15"
                      required={formData.estado === 'programada' || formData.estado === 'completada'}
                      disabled={isReadOnly || formData.estado === 'pendiente' || formData.estado === 'cancelada'}
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isReadOnly || formData.estado === 'pendiente' || formData.estado === 'cancelada' 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : ''
                      }`}
                      placeholder="Ej: 30, 45, 60"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Duración estimada o real de la consulta en minutos
                    </p>
                    {formData.estado === 'pendiente' && (
                      <p className="mt-1 text-xs text-amber-600">
                        Las consultas pendientes no requieren duración específica
                      </p>
                    )}
                    {formData.estado === 'programada' && (
                      <p className="mt-1 text-xs text-blue-600">
                        Para consultas programadas, ingresa la duración estimada
                      </p>
                    )}
                    {formData.estado === 'completada' && (
                      <p className="mt-1 text-xs text-emerald-600">
                        Para consultas completadas, ingresa la duración real
                      </p>
                    )}
                    {formData.estado === 'cancelada' && (
                      <p className="mt-1 text-xs text-red-600">
                        Las consultas canceladas no requieren duración (0 minutos)
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="fecha" className="block text-base font-medium text-gray-700 mb-1">
                      Fecha y Hora {formData.estado === 'pendiente' ? '(Opcional)' : '(Requerida)'}
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        id="fecha"
                        value={formData.fecha || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                        required={formData.estado === 'programada'}
                        disabled={isReadOnly}
                        className={`block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    {formData.estado === 'pendiente' && (
                      <p className="mt-1 text-xs text-amber-600">
                        Las consultas pendientes no requieren fecha específica
                      </p>
                    )}
                    {formData.estado === 'programada' && (
                      <p className="mt-1 text-xs text-blue-600">
                        Las consultas programadas requieren fecha y hora específica
                      </p>
                    )}
                  </div>
                  <div></div>
                </div>

                <div>
                  <label htmlFor="motivo" className="block text-base font-medium text-gray-700 mb-1">
                    Motivo de la Consulta
                  </label>
                  <textarea
                    id="motivo"
                    value={formData.motivo || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Describe el motivo de la consulta..."
                    rows={3}
                    disabled={isReadOnly}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="diagnostico" className="block text-base font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    id="diagnostico"
                    value={formData.diagnostico || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, diagnostico: e.target.value }))}
                    placeholder="Diagnóstico médico (opcional para consultas programadas)"
                    rows={3}
                    disabled={isReadOnly}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="tratamiento" className="block text-base font-medium text-gray-700 mb-1">
                    Tratamiento
                  </label>
                  <textarea
                    id="tratamiento"
                    value={formData.tratamiento || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tratamiento: e.target.value }))}
                    placeholder="Tratamiento prescrito (opcional para consultas programadas)"
                    rows={3}
                    disabled={isReadOnly}
                    className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                  >
                    {editingConsulta && (editingConsulta.estado === 'completada' || editingConsulta.estado === 'cancelada') ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {/* Solo mostrar botón de guardar si no es consulta completada o cancelada */}
                  {!(editingConsulta && (editingConsulta.estado === 'completada' || editingConsulta.estado === 'cancelada')) && (
                  <button
                    type="submit"
                      className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {editingConsulta ? "Actualizar" : "Crear"} Consulta
                  </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación - INCLUIDO DIRECTAMENTE */}
      {isDeleteModalOpen && consultaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={handleDeleteCancel}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
                    <p className="text-red-100 text-base">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
                  </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-6">

              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                      ¿Estás seguro de que quieres eliminar esta consulta?
                    </p>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {consultaToDelete.paciente_nombre} {consultaToDelete.paciente_apellido}
                  </h4>
                  <div className="text-base text-gray-600 space-y-1">
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

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Eliminar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setShowSuccessModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">¡Consulta Creada!</h3>
                  <p className="text-green-100 text-base">La consulta se ha registrado exitosamente</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 text-center">
              <p className="text-gray-600 mb-6">
                La consulta médica ha sido creada correctamente y ya está disponible en la lista.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    handleNewConsulta()
                  }}
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Otra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Edición */}
      {showEditConfirmModal && editingConsulta && pendingUpdateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={handleEditCancel}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Confirmar Actualización</h3>
                  <p className="text-blue-100 text-base">¿Estás seguro de finalizar esta consulta?</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 text-center">
              <p className="text-gray-600 mb-6">
                Se actualizará la consulta de <strong>{editingConsulta.paciente_nombre} {editingConsulta.paciente_apellido}</strong> con el estado <strong>{getStatusText(pendingUpdateData.estado!)}</strong>.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleEditCancel}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditConfirm}
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Confirmar Actualización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
