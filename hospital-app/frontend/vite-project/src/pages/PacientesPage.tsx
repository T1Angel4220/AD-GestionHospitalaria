"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { PacientesApi } from '../api/pacientesApi'
import type { Paciente, PacienteCreate, PacienteUpdate, CentroMedico } from '../types/pacientes'
import { useValidation } from '../hooks/useValidation'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses, getHeaderColors, getButtonColors } from '../utils/sidebarUtils'
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
  Building2,
  BarChart3,
  Heart,
  UserCheck,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  UserPlus
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { getRoleText } from '../utils/roleUtils'

export default function PacientesPage() {
  const { user, logout } = useAuth()
  const { errors, clearAllErrors, sanitizeText } = useValidation()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Determinar el elemento activo del sidebar y obtener colores
  const activeItem = getActiveSidebarItem(window.location.pathname);
  const headerColors = getHeaderColors(activeItem);
  const buttonColors = getButtonColors(activeItem);

  // Estados para modales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pacienteToDelete, setPacienteToDelete] = useState<Paciente | null>(null)

  // Estados para datos relacionados
  const [centros, setCentros] = useState<CentroMedico[]>([])

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGenero, setFilterGenero] = useState("all")

  // Estado del formulario del modal
  const [formData, setFormData] = useState<Partial<Paciente>>({
    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    genero: undefined,
    direccion: "",
    id_centro: undefined,
  })

  // Estado para el centro seleccionado
  const [selectedCentro, setSelectedCentro] = useState<string>("")
  // Estado para el modal de confirmación
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  // Estado para el modal de confirmación de edición
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false)
  // Estado para los datos que se van a actualizar
  const [pendingUpdateData, setPendingUpdateData] = useState<PacienteUpdate | null>(null)
  
  useEffect(() => {
    loadPacientes()
    loadRelatedData()
  }, [])

  const loadPacientes = async () => {
    try {
      setLoading(true)
      const data = await PacientesApi.getPacientes()
      setPacientes(data)
    } catch (err) {
      setError("Error al cargar los pacientes")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    try {
      const centrosData = await PacientesApi.getCentros()
      setCentros(centrosData)
    } catch (err) {
      console.error("Error al cargar datos relacionados:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    clearAllErrors()

    // Sanitizar datos antes de validar
    const sanitizedFormData = {
      ...formData,
      nombres: sanitizeText(formData.nombres || ''),
      apellidos: sanitizeText(formData.apellidos || ''),
      cedula: sanitizeText(formData.cedula || ''),
      telefono: sanitizeText(formData.telefono || ''),
      email: sanitizeText(formData.email || ''),
      direccion: sanitizeText(formData.direccion || '')
    }

    // Validar formulario básico
    if (!sanitizedFormData.nombres?.trim() || !sanitizedFormData.apellidos?.trim()) {
      setError("Nombres y apellidos son obligatorios")
      return
    }

    try {
      if (editingPaciente) {
        const updateData: PacienteUpdate = {
          nombres: sanitizedFormData.nombres,
          apellidos: sanitizedFormData.apellidos,
          cedula: sanitizedFormData.cedula,
          telefono: sanitizedFormData.telefono,
          email: sanitizedFormData.email,
          fecha_nacimiento: sanitizedFormData.fecha_nacimiento,
          genero: sanitizedFormData.genero,
          direccion: sanitizedFormData.direccion,
          id_centro: sanitizedFormData.id_centro,
        }
        // Guardar datos pendientes y mostrar modal de confirmación
        setPendingUpdateData(updateData)
        setShowEditConfirmModal(true)
      } else {
        const newData: PacienteCreate = {
          nombres: sanitizedFormData.nombres!,
          apellidos: sanitizedFormData.apellidos!,
          cedula: sanitizedFormData.cedula,
          telefono: sanitizedFormData.telefono,
          email: sanitizedFormData.email,
          fecha_nacimiento: sanitizedFormData.fecha_nacimiento,
          genero: sanitizedFormData.genero,
          direccion: sanitizedFormData.direccion,
          id_centro: sanitizedFormData.id_centro!,
        }
        await PacientesApi.createPaciente(newData)
        setShowSuccessModal(true)
        await loadPacientes()
        resetForm()
      }
    } catch (err) {
      setError("Error al guardar el paciente")
      console.error(err)
    }
  }

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente)
    setFormData({
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      cedula: paciente.cedula,
      telefono: paciente.telefono,
      email: paciente.email,
      fecha_nacimiento: paciente.fecha_nacimiento,
      genero: paciente.genero,
      direccion: paciente.direccion,
      id_centro: paciente.id_centro,
    })
    // Cargar centro del paciente
    if (paciente.id_centro) {
      const centro = centros.find(c => c.id === paciente.id_centro)
      if (centro) {
        setSelectedCentro(`${centro.nombre} - ${centro.ciudad}`)
      }
    }
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (paciente: Paciente) => {
    setPacienteToDelete(paciente)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pacienteToDelete) return
    try {
      await PacientesApi.deletePaciente(pacienteToDelete.id)
      await loadPacientes()
      setIsDeleteModalOpen(false)
      setPacienteToDelete(null)
    } catch (err) {
      setError("Error al eliminar el paciente")
      console.error(err)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setPacienteToDelete(null)
  }

  const handleEditConfirm = async () => {
    if (!editingPaciente || !pendingUpdateData) return
    
    try {
      await PacientesApi.updatePaciente(editingPaciente.id, pendingUpdateData)
      await loadPacientes()
      setShowEditConfirmModal(false)
      setPendingUpdateData(null)
      resetForm()
    } catch (err) {
      setError("Error al actualizar el paciente")
      console.error(err)
    }
  }

  const handleEditCancel = () => {
    setShowEditConfirmModal(false)
    setPendingUpdateData(null)
  }

  const resetForm = () => {
    setEditingPaciente(null)
    setFormData({
      nombres: "",
      apellidos: "",
      cedula: "",
      telefono: "",
      email: "",
      fecha_nacimiento: "",
      genero: undefined,
      direccion: "",
      id_centro: undefined,
    })
    setSelectedCentro("")
    setIsDialogOpen(false)
  }

  const handleNewPaciente = () => {
    resetForm()
    
    // Si el usuario es médico, pre-llenar con su centro
    if (user?.rol === 'medico' && user.id_centro) {
      setFormData(prev => ({
        ...prev,
        id_centro: user.id_centro
      }))
      // Cargar centro del médico actual
      const centro = centros.find(c => c.id === user.id_centro)
      if (centro) {
        setSelectedCentro(`${centro.nombre} - ${centro.ciudad}`)
      }
    }
    
    setIsDialogOpen(true)
  }

  const filteredPacientes = pacientes.filter((paciente) => {
    const matchesSearch =
      paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.centro_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.centro_ciudad?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGenero =
      filterGenero === "all" || paciente.genero === filterGenero

    return matchesSearch && matchesGenero
  })

  const calculateStats = () => {
    const stats = {
      total: pacientes.length,
      masculino: 0,
      femenino: 0,
      otro: 0,
    }
    pacientes.forEach((p) => {
      if (p.genero === 'M') stats.masculino++
      else if (p.genero === 'F') stats.femenino++
      else if (p.genero === 'O') stats.otro++
    })
    return stats
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando pacientes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-red-600" />
              </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-red-100 text-xs">Sistema Médico</p>
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
              <a href="/reportes" className={getSidebarItemClasses('dashboard', activeItem)}>
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

            {/* Pacientes - visible para todos */}
            <a href="/pacientes" className={getSidebarItemClasses('pacientes', activeItem)}>
              <div className={getIconContainerClasses('pacientes', activeItem)}>
                <UserPlus className={getIconClasses('pacientes', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('pacientes', activeItem).main}>Pacientes</div>
                <div className={getTextClasses('pacientes', activeItem).sub}>Gestión pacientes</div>
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
              <a href="/medicos" className={getSidebarItemClasses('medicos', activeItem)}>
                <div className={getIconContainerClasses('medicos', activeItem)}>
                  <Stethoscope className={getIconClasses('medicos', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('medicos', activeItem).main}>Médicos</div>
                  <div className={getTextClasses('medicos', activeItem).sub}>Personal médico</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Centros para administradores */}
            {user?.rol === 'admin' && (
              <a href="/centros" className={getSidebarItemClasses('centros', activeItem)}>
                <div className={getIconContainerClasses('centros', activeItem)}>
                  <Building2 className={getIconClasses('centros', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('centros', activeItem).main}>Centros Médicos</div>
                  <div className={getTextClasses('centros', activeItem).sub}>Gestión centros</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Especialidades para administradores */}
            {user?.rol === 'admin' && (
              <a href="/especialidades" className={getSidebarItemClasses('especialidades', activeItem)}>
                <div className={getIconContainerClasses('especialidades', activeItem)}>
                  <Heart className={getIconClasses('especialidades', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('especialidades', activeItem).main}>Especialidades</div>
                  <div className={getTextClasses('especialidades', activeItem).sub}>Gestión especialidades</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Empleados para administradores */}
            {user?.rol === 'admin' && (
              <a href="/empleados" className={getSidebarItemClasses('empleados', activeItem)}>
                <div className={getIconContainerClasses('empleados', activeItem)}>
                  <UserCheck className={getIconClasses('empleados', activeItem)} />
                </div>
                <div>
                  <div className={getTextClasses('empleados', activeItem).main}>Empleados</div>
                  <div className={getTextClasses('empleados', activeItem).sub}>Personal administrativo</div>
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
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-base font-medium">{user?.email}</div>
                <div className="text-gray-400 text-sm font-medium">
                  {user?.rol === 'admin' ? 'Administrador' : 'Médico'}
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
        <div className={`${headerColors.gradient} shadow-lg`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-red-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <UserPlus className={`h-8 w-8 mr-3 ${headerColors.iconColor}`} />
                    Gestión de Pacientes
                  </h1>
                  <p className="text-red-100 mt-1">Administra los pacientes del hospital</p>
                </div>
                </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-red-600"
                  iconBackgroundColor="bg-red-700"
                  icon={UserPlus}
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
            <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${buttonColors.primaryIcon.replace('text-', 'border-')}`}>
                <div className="flex items-center">
                <div className={`p-3 ${buttonColors.primaryIcon.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg`}>
                  <UserPlus className={`h-8 w-8 ${buttonColors.primaryIcon}`} />
                    </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <User className="h-8 w-8 text-red-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Masculino</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.masculino}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <User className="h-8 w-8 text-red-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Femenino</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.femenino}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <User className="h-8 w-8 text-red-600" />
                    </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Otro</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.otro}</p>
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
                placeholder="Buscar pacientes por nombre, cédula, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterGenero}
                      onChange={(e) => setFilterGenero(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                  <option value="all">Todos los géneros</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
              <button
                onClick={handleNewPaciente}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Paciente
              </button>
            </div>
          </div>

          {/* Pacientes List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Directorio de Pacientes
              </h3>
              <p className="mt-1 text-base text-gray-600">
                Explora y gestiona el registro de pacientes
              </p>
            </div>
            {/* Grid de Pacientes Mejorado */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredPacientes.map((paciente) => (
                  <div key={paciente.id} className="group relative bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-red-100/50 transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                    {/* Header con gradiente mejorado */}
                    <div className="relative h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 overflow-hidden">
                      {/* Patrón de fondo */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                      </div>
                      
                      {/* Avatar mejorado */}
                      <div className="absolute bottom-0 left-6 transform translate-y-6">
                        <div className="relative">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                              <User className="h-6 w-6 text-red-600" />
                            </div>
                          </div>
                          {/* Indicador de género */}
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            paciente.genero === 'M' ? 'bg-blue-500 text-white' :
                            paciente.genero === 'F' ? 'bg-pink-500 text-white' :
                            'bg-purple-500 text-white'
                          }`}>
                            {paciente.genero === 'M' ? '♂' : 
                             paciente.genero === 'F' ? '♀' : '⚥'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Acciones en header */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(paciente)}
                          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                          title="Editar paciente"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                        {user?.rol === 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(paciente)}
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-red-500/50 transition-colors"
                            title="Eliminar paciente"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Contenido de la tarjeta */}
                    <div className="p-6 pt-12">
                      {/* Nombre y ID mejorados */}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                          {paciente.nombres} {paciente.apellidos}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            ID: #{paciente.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(paciente.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Información en formato mejorado */}
                      <div className="space-y-4 mb-6">
                        {paciente.cedula && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors group">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cédula</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{paciente.cedula}</p>
                            </div>
                          </div>
                        )}
                        
                        {paciente.telefono && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors group">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all">
                              <Phone className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</p>
                              <p className="text-sm font-bold text-gray-900">{paciente.telefono}</p>
                            </div>
                          </div>
                        )}
                        
                        {paciente.email && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors group">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all">
                              <Mail className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{paciente.email}</p>
                            </div>
                          </div>
                        )}
                        
                        {paciente.centro_nombre && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors group">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all">
                              <Building2 className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Centro</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{paciente.centro_nombre}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer con acciones mejoradas */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Registrado</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(paciente)}
                              className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                              Editar
                            </button>
                            {user?.rol === 'admin' && (
                              <button
                                onClick={() => handleDeleteClick(paciente)}
                                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200 transform hover:scale-105"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredPacientes.length === 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="py-10 text-center">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-1 text-gray-900">No se encontraron pacientes</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterGenero !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Comienza creando tu primer paciente"}
                  </p>
                  {!searchTerm && filterGenero === "all" && (
                    <button
                      onClick={handleNewPaciente}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primer Paciente
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Paciente */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={resetForm}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full transform transition-all duration-300 scale-100 max-h-[85vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <UserPlus className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                  {editingPaciente ? "Editar Paciente" : "Nuevo Paciente"}
                </h3>
                    <p className="text-red-100 text-base">
                      {editingPaciente ? "Modifica los datos del paciente" : "Registra un nuevo paciente"}
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
                    <label htmlFor="nombres" className="block text-base font-semibold text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      id="nombres"
                      value={formData.nombres || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nombres: e.target.value }))}
                      required
                      className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.nombres ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.nombres && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="apellidos" className="block text-base font-semibold text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="apellidos"
                      value={formData.apellidos || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, apellidos: e.target.value }))}
                      required
                      className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors.apellidos ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.apellidos && (
                      <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cedula" className="block text-base font-semibold text-gray-700 mb-1">
                      Cédula
                    </label>
                    <input
                      type="text"
                      id="cedula"
                      value={formData.cedula || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cedula: e.target.value }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-base font-semibold text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="fecha_nacimiento" className="block text-base font-semibold text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      id="fecha_nacimiento"
                      value={formData.fecha_nacimiento || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="genero" className="block text-base font-semibold text-gray-700 mb-1">
                      Género
                    </label>
                    <select
                      id="genero"
                      value={formData.genero || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, genero: e.target.value as 'M' | 'F' | 'O' }))}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    >
                      <option value="">Seleccionar género</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="id_centro" className="block text-base font-semibold text-gray-700 mb-1">
                      Centro Médico
                    </label>
                    {user?.rol === 'medico' ? (
                      <input
                        type="text"
                        value={selectedCentro}
                        readOnly
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        id="id_centro"
                        value={formData.id_centro || ''}
                        onChange={(e) => {
                          const centroId = Number(e.target.value)
                          setFormData((prev) => ({ ...prev, id_centro: centroId }))
                          const centro = centros.find(c => c.id === centroId)
                          if (centro) {
                            setSelectedCentro(`${centro.nombre} - ${centro.ciudad}`)
                          }
                        }}
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      >
                        <option value="">Seleccionar centro</option>
                        {centros.map((centro) => (
                          <option key={centro.id} value={centro.id}>
                            {centro.nombre} - {centro.ciudad}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-base font-semibold text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección completa del paciente..."
                    rows={3}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {editingPaciente ? "Actualizar" : "Crear"} Paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {isDeleteModalOpen && pacienteToDelete && (
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
                      ¿Estás seguro de que quieres eliminar este paciente?
                    </p>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {pacienteToDelete.nombres} {pacienteToDelete.apellidos}
                  </h4>
                  <div className="text-base text-gray-600 space-y-1">
                    <p><strong>Cédula:</strong> {pacienteToDelete.cedula || 'No especificada'}</p>
                    <p><strong>Email:</strong> {pacienteToDelete.email || 'No especificado'}</p>
                    <p><strong>Centro:</strong> {pacienteToDelete.centro_nombre || `ID: ${pacienteToDelete.id_centro}`}</p>
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
                  Eliminar Paciente
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
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
                  <CheckCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">¡Paciente Creado!</h3>
                  <p className="text-red-100 text-base">El paciente se ha registrado exitosamente</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 text-center">
              <p className="text-gray-600 mb-6">
                El paciente ha sido creado correctamente y ya está disponible en la lista.
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
                    handleNewPaciente()
                  }}
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Crear Otro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Edición */}
      {showEditConfirmModal && editingPaciente && pendingUpdateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={handleEditCancel}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Confirmar Actualización</h3>
                  <p className="text-red-100 text-base">¿Estás seguro de actualizar este paciente?</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 text-center">
              <p className="text-gray-600 mb-6">
                Se actualizará la información de <strong>{editingPaciente.nombres} {editingPaciente.apellidos}</strong>.
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
                  className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 transform hover:scale-105"
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
