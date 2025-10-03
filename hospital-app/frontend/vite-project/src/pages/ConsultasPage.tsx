"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaCreate, ConsultaUpdate, Medico, Paciente } from '../types/consultas'
import { useValidation } from '../hooks/useValidation'
import { OptimizedTextArea } from '../components/OptimizedTextArea'
import { OptimizedInput } from '../components/OptimizedInput'
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
  BarChart3,
  Heart,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { LogoutModal } from '../components/LogoutModal'
import { CentroIndicator } from '../components/CentroIndicator'
import { getRoleText } from '../utils/roleUtils'

export default function MedicalConsultationsPage() {
  const { user, logout } = useAuth()
  const { errors, validateConsulta, clearAllErrors, sanitizeText, sanitizeName } = useValidation()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Determinar el elemento activo del sidebar
  const activeItem = getActiveSidebarItem(window.location.pathname)

  // Estados para modales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null)

  // Estados para datos relacionados
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [medicosFiltrados, setMedicosFiltrados] = useState<Medico[]>([])
  // Estado para forzar re-render del select
  const [selectKey, setSelectKey] = useState(0)

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Estado del formulario del modal
  const [formData, setFormData] = useState<Partial<Consulta> & { id_frontend?: string }>({
    paciente_nombre: "",
    paciente_apellido: "",
    id_paciente: undefined,
    id_frontend: undefined,
    id_medico: undefined,
    id_centro: undefined,
    fecha: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
    estado: "pendiente",
    duracion_minutos: 0,
  })


  // Memoizar listas filtradas para evitar recálculos innecesarios
  const filteredConsultas = useMemo(() => {
    return consultas.filter(consulta => {
      const matchesSearch = !searchTerm || 
        consulta.paciente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.paciente_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || consulta.estado === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [consultas, searchTerm, filterStatus])

  const medicosParaMostrar = useMemo(() => {
    return user?.rol === 'admin' ? medicosFiltrados : medicos
  }, [user?.rol, medicosFiltrados, medicos])

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Efecto para inicializar médicos filtrados cuando se cargan los datos
  useEffect(() => {
    if (user?.rol === 'admin' && medicos.length > 0) {
      setMedicosFiltrados(medicos)
    } else if (user?.rol === 'medico' && medicos.length > 0) {
      // Para médicos, usar los médicos ya filtrados por su centro
      setMedicosFiltrados(medicos)
    }
  }, [medicos, user?.rol])

  // Efecto para manejar cambios en medicosFiltrados (optimizado)
  useEffect(() => {
    // Solo forzar re-render si realmente cambió la cantidad de médicos
    if (user?.rol === 'admin' && medicosFiltrados.length !== medicos.length) {
      setSelectKey(prev => prev + 1)
    }
  }, [medicosFiltrados.length, medicos.length, user?.rol])

  // Efecto para manejar cambios de estado y duración (optimizado)
  useEffect(() => {
    const currentDuracion = formData.duracion_minutos || 0;
    
    if (formData.estado === 'cancelada' && currentDuracion !== 0) {
      setFormData(prev => ({ ...prev, duracion_minutos: 0 }))
    } else if (formData.estado === 'pendiente' && currentDuracion !== 0) {
      setFormData(prev => ({ ...prev, duracion_minutos: 0 }))
    }
    // Para 'programada' y 'completada' no cambiamos el valor automáticamente
  }, [formData.estado, formData.duracion_minutos])

  const loadMedicoActual = async () => {
    if (user?.rol === 'medico') {
      try {
        // Si el usuario ya tiene información del médico, usarla directamente
        if (user.medico) {
          const medicoData: Medico = {
            id: user.medico.id,
            nombres: user.medico.nombres,
            apellidos: user.medico.apellidos,
            especialidad_nombre: user.medico.especialidad,
            centro_nombre: user.centro.nombre,
            id_centro: user.centro.id,
            id_especialidad: 0 // No disponible en el contexto actual
          }
          
          setMedicoActual(medicoData)
          setSelectedEspecialidad(user.medico.especialidad || 'Sin especialidad')
          setSelectedCentro(user.centro.nombre || 'Sin centro')
        } else if (user.id_medico) {
          // Fallback: buscar médico por ID si no está en el contexto
          const medicos = await ConsultasApi.getMedicos()
          const medico = medicos.find(m => m.id === user.id_medico)
          if (medico) {
            setMedicoActual(medico)
            setSelectedEspecialidad(medico.especialidad_nombre || 'Sin especialidad')
            setSelectedCentro(medico.centro_nombre || 'Sin centro')
          }
        }
      } catch (error) {
        console.error('Error cargando médico actual:', error)
      }
    }
  }

  // Funciones optimizadas para cambios de formulario
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleTextChange = useCallback((field: string, value: string) => {
    // Sanitizar texto solo cuando sea necesario
    const sanitizedValue = sanitizeText(value)
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }))
  }, [sanitizeText])

  // Funciones memoizadas para campos específicos
  const handleMotivoChange = useCallback((value: string) => {
    handleTextChange('motivo', value)
  }, [handleTextChange])

  const handleDiagnosticoChange = useCallback((value: string) => {
    handleTextChange('diagnostico', value)
  }, [handleTextChange])

  const handleTratamientoChange = useCallback((value: string) => {
    handleTextChange('tratamiento', value)
  }, [handleTextChange])

  const handleDuracionChange = useCallback((value: number) => {
    handleFormChange('duracion_minutos', value)
  }, [handleFormChange])

  const handleEstadoChange = useCallback((value: string) => {
    handleFormChange('estado', value)
  }, [handleFormChange])

  const handleFechaChange = useCallback((value: string) => {
    handleFormChange('fecha', value)
  }, [handleFormChange])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  // Cargar médico actual cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      loadMedicoActual()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch (error) {
      setError("Error al cargar las consultas")
      console.error('❌ Error cargando consultas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    try {
      const [medicosData, pacientesData] = await Promise.all([
        ConsultasApi.getMedicos(),
        ConsultasApi.getPacientes()
      ])
      setMedicos(medicosData)
      setPacientes(pacientesData)
    } catch (err) {
      console.error("Error al cargar datos relacionados:", err)
    }
  }

  // Función para filtrar médicos por centro del paciente
  const filtrarMedicosPorCentro = async (pacienteId: number) => {
    if (user?.rol !== 'admin') {
      // Si no es admin, usar los médicos ya cargados (filtrados por su centro)
      return
    }

    try {
      const paciente = pacientes.find(p => p.id === pacienteId)
      if (!paciente) {
        console.error('❌ Paciente no encontrado con ID:', pacienteId)
        return
      }

      if (paciente.id_centro) {
        // Obtener médicos del centro específico del paciente usando su origen de BD
        const medicosDelCentro = await ConsultasApi.getMedicosPorCentroEspecifico(paciente.id_centro, paciente.origen_bd || 'central')
        setMedicosFiltrados(medicosDelCentro)
      } else {
        // Si el paciente no tiene centro asignado, mostrar todos los médicos
        setMedicosFiltrados(medicos)
      }
    } catch (error) {
      console.error('Error filtrando médicos por centro:', error)
      // En caso de error, mostrar todos los médicos
      setMedicosFiltrados(medicos)
    }
  }

  const resetForm = () => {
    setEditingConsulta(null)
    setFormData({
      paciente_nombre: "",
      paciente_apellido: "",
      id_paciente: undefined,
      id_frontend: undefined,
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
    
    // Resetear filtrado de médicos (mostrar todos si es admin)
    if (user?.rol === 'admin' && medicos.length > 0) {
      setMedicosFiltrados(medicos)
    }
    
    setIsDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    clearAllErrors()

    // Sanitizar datos antes de validar
    const sanitizedFormData = {
      ...formData,
      paciente_nombre: sanitizeName(formData.paciente_nombre || ''), // Usar sanitizeName para nombres
      paciente_apellido: sanitizeName(formData.paciente_apellido || ''), // Usar sanitizeName para apellidos
      motivo: sanitizeText(formData.motivo || ''), // Usar sanitizeText para texto libre
      diagnostico: sanitizeText(formData.diagnostico || ''), // Usar sanitizeText para texto libre
      tratamiento: sanitizeText(formData.tratamiento || '') // Usar sanitizeText para texto libre
    }

    // Validar formulario
    if (!validateConsulta(sanitizedFormData)) {
      setError("Por favor corrige los errores en el formulario")
      return
    }

    try {
      if (editingConsulta) {
        const updateData: ConsultaUpdate = {
          paciente_nombre: sanitizedFormData.paciente_nombre,
          paciente_apellido: sanitizedFormData.paciente_apellido,
          id_paciente: sanitizedFormData.id_paciente,
          id_medico: sanitizedFormData.id_medico,
          fecha: sanitizedFormData.fecha,
          motivo: sanitizedFormData.motivo,
          diagnostico: sanitizedFormData.diagnostico,
          tratamiento: sanitizedFormData.tratamiento,
          estado: sanitizedFormData.estado!,
          duracion_minutos: sanitizedFormData.duracion_minutos,
        }
        // Guardar datos pendientes y mostrar modal de confirmación
        setPendingUpdateData(updateData)
        setShowEditConfirmModal(true)
      } else {
        // Verificar que id_medico sea válido
        if (!sanitizedFormData.id_medico) {
          console.error('❌ Error: id_medico es undefined o null:', {
            formDataIdMedico: formData.id_medico,
            sanitizedIdMedico: sanitizedFormData.id_medico,
            medicoActual,
            userRol: user?.rol
          })
          setError("Error: No se pudo determinar el médico. Por favor, recarga la página e intenta nuevamente.")
          return
        }

        const newData: ConsultaCreate = {
          paciente_nombre: sanitizedFormData.paciente_nombre!,
          paciente_apellido: sanitizedFormData.paciente_apellido!,
          id_paciente: sanitizedFormData.id_paciente,
          id_medico: sanitizedFormData.id_medico!,
          fecha: sanitizedFormData.fecha!,
          motivo: sanitizedFormData.motivo,
          diagnostico: sanitizedFormData.diagnostico,
          tratamiento: sanitizedFormData.tratamiento,
          estado: sanitizedFormData.estado!,
          duracion_minutos: sanitizedFormData.duracion_minutos,
        }

        console.log('📋 Datos de consulta a crear:', {
          id_medico: newData.id_medico,
          tipo_id_medico: typeof newData.id_medico,
          esValido: Number.isInteger(newData.id_medico) && newData.id_medico > 0
        })
        // Obtener el centro del médico seleccionado para enviarlo en el header
        const medicoSeleccionado = user?.rol === 'admin' 
          ? medicosFiltrados.find(m => m.id === newData.id_medico)
          : medicos.find(m => m.id === newData.id_medico)
        
        const centroIdDelMedico = medicoSeleccionado?.id_centro
        
        const response = await ConsultasApi.createConsulta(newData, centroIdDelMedico)
        
        // Usar el ID real que devuelve el servidor
        const nuevaConsulta: Consulta = {
          ...newData,
          id: response.id, // ID real del servidor
          id_centro: centroIdDelMedico || 1,
          estado: newData.estado || 'pendiente',
          created_at: new Date().toISOString(),
          medico_nombres: medicoSeleccionado?.nombres,
          medico_apellidos: medicoSeleccionado?.apellidos,
          especialidad_nombre: medicoSeleccionado?.especialidad_nombre,
          centro_nombre: medicoSeleccionado?.centro_nombre,
          centro_ciudad: medicoSeleccionado?.origen_bd === 'central' ? 'Quito' : 
                        medicoSeleccionado?.origen_bd === 'guayaquil' ? 'Guayaquil' : 'Cuenca'
        }
        setConsultas(prev => [nuevaConsulta, ...prev])
        
        setShowSuccessModal(true)
      resetForm()
      }
    } catch (err) {
      setError("Error al guardar la consulta")
      console.error(err)
    }
  }

  const handleMedicoChange = (medicoId: number) => {
    // Buscar el médico en la lista correcta según el rol del usuario
    const listaMedicos = user?.rol === 'admin' ? medicosFiltrados : medicos
    const medico = listaMedicos.find(m => m.id === medicoId)
    
    if (medico) {
      setSelectedEspecialidad(medico.especialidad_nombre || 'Sin especialidad')
      setSelectedCentro(medico.centro_nombre || 'Sin centro')
      // Actualizar también el id_centro en el formulario
      setFormData((prev) => ({ ...prev, id_centro: medico.id_centro }))
    } else {
      setSelectedEspecialidad("")
      setSelectedCentro("")
      console.log('❌ Médico no encontrado en la lista')
    }
  }

  const handlePacienteChange = async (pacienteIdFrontend: string) => {
    const paciente = pacientes.find(p => p.id_frontend === pacienteIdFrontend)
    if (paciente) {
      setFormData((prev) => ({ 
        ...prev, 
        id_paciente: paciente.id,
        id_frontend: paciente.id_frontend,
        paciente_nombre: paciente.nombres,
        paciente_apellido: paciente.apellidos,
        // Solo limpiar médico seleccionado si es admin (los médicos mantienen su ID)
        ...(user?.rol === 'admin' ? { id_medico: undefined } : {})
      }))
      
      // Filtrar médicos por centro del paciente (solo para admin)
      if (user?.rol === 'admin') {
        await filtrarMedicosPorCentro(paciente.id)
      }
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        id_paciente: undefined,
        id_frontend: undefined,
        paciente_nombre: "",
        paciente_apellido: "",
        // Solo limpiar médico seleccionado si es admin
        ...(user?.rol === 'admin' ? { id_medico: undefined } : {})
      }))
      
      // Si no hay paciente seleccionado, mostrar todos los médicos (solo para admin)
      if (user?.rol === 'admin' && medicos.length > 0) {
        setMedicosFiltrados(medicos)
      }
    }
  }

  const handleEdit = async (consulta: Consulta) => {
    setEditingConsulta(consulta)
    setFormData({
      paciente_nombre: consulta.paciente_nombre,
      paciente_apellido: consulta.paciente_apellido,
      id_paciente: consulta.id_paciente,
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
    
    // Si es admin y hay un paciente seleccionado, filtrar médicos por su centro
    if (user?.rol === 'admin' && consulta.id_paciente) {
      await filtrarMedicosPorCentro(consulta.id_paciente)
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
      // Obtener el centro de la consulta para enviarlo en el header
      const centroIdDeLaConsulta = consultaToDelete.id_centro
      
      console.log('🗑️ Eliminando consulta:', {
        consultaId: consultaToDelete.id,
        centroIdDeLaConsulta,
        consulta: {
          id: consultaToDelete.id,
          paciente: `${consultaToDelete.paciente_nombre} ${consultaToDelete.paciente_apellido}`,
          medico: `${consultaToDelete.medico_nombres} ${consultaToDelete.medico_apellidos}`,
          centro: consultaToDelete.centro_nombre
        }
      })
      
      await ConsultasApi.deleteConsulta(consultaToDelete.id, centroIdDeLaConsulta)
      
      // Actualizar el estado local inmediatamente sin recargar desde el servidor
      setConsultas(prev => prev.filter(c => c.id !== consultaToDelete.id))
      
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
      // Obtener el centro del médico seleccionado para enviarlo en el header
      const medicoSeleccionado = user?.rol === 'admin' 
        ? medicosFiltrados.find(m => m.id === pendingUpdateData.id_medico)
        : medicos.find(m => m.id === pendingUpdateData.id_medico)
      
      const centroIdDelMedico = medicoSeleccionado?.id_centro
      
      console.log('💾 Actualizando consulta:', {
        consultaId: editingConsulta.id,
        centroIdDelMedico,
        medicoSeleccionado: medicoSeleccionado ? {
          id: medicoSeleccionado.id,
          nombre: `${medicoSeleccionado.nombres} ${medicoSeleccionado.apellidos}`,
          centro: medicoSeleccionado.id_centro,
          centro_nombre: medicoSeleccionado.centro_nombre,
          origen_bd: medicoSeleccionado.origen_bd
        } : null
      })
      
      await ConsultasApi.updateConsulta(editingConsulta.id, pendingUpdateData, centroIdDelMedico)
      
      // Actualizar el estado local inmediatamente sin recargar desde el servidor
      setConsultas(prev => prev.map(c => 
        c.id === editingConsulta.id 
          ? { 
              ...c, 
              ...pendingUpdateData,
              medico_nombres: medicoSeleccionado?.nombres,
              medico_apellidos: medicoSeleccionado?.apellidos,
              especialidad_nombre: medicoSeleccionado?.especialidad_nombre,
              centro_nombre: medicoSeleccionado?.centro_nombre,
              centro_ciudad: medicoSeleccionado?.origen_bd === 'central' ? 'Quito' : 
                            medicoSeleccionado?.origen_bd === 'guayaquil' ? 'Guayaquil' : 'Cuenca'
            }
          : c
      ))
      
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

  const handleNewConsulta = () => {
    console.log('🆕 Creando nueva consulta:', { 
      userRol: user?.rol, 
      medicoActual, 
      hasMedicoData: !!medicoActual 
    })
    
    resetForm()
    
    // Si el usuario es médico, pre-llenar con su información
    if (user?.rol === 'medico') {
      if (medicoActual) {
        console.log('👨‍⚕️ Pre-llenando formulario para médico:', medicoActual)
        setFormData(prev => ({
          ...prev,
          id_medico: medicoActual.id,
          id_centro: medicoActual.id_centro
        }))
        // Cargar especialidad y centro del médico actual
        setSelectedEspecialidad(medicoActual.especialidad_nombre || 'Sin especialidad')
        setSelectedCentro(medicoActual.centro_nombre || 'Sin centro')
      } else if (user.id_medico) {
        console.log('⚠️ Usuario es médico pero no hay datos de médico actual, usando ID del token:', user.id_medico)
        // Usar el ID del médico del token como fallback
        setFormData(prev => ({
          ...prev,
          id_medico: user.id_medico,
          id_centro: user.id_centro
        }))
        setSelectedEspecialidad('Sin especialidad')
        setSelectedCentro('Sin centro')
        // Intentar cargar el médico actual nuevamente
        loadMedicoActual()
      } else {
        console.error('❌ Usuario médico sin ID de médico en token')
        setError("Error: No se pudo determinar el médico. Por favor, contacta al administrador.")
        return
      }
    }
    
    setIsDialogOpen(true)
  }


  const stats = useMemo(() => {
    const statsData = {
      total: filteredConsultas.length,
      pendiente: 0,
      programada: 0,
      completada: 0,
      cancelada: 0,
    }
    filteredConsultas.forEach((c) => {
      statsData[c.estado]++
    })
    return statsData
  }, [filteredConsultas])

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
                  {user?.rol === 'admin' ? 'Administrador' : 
                   medicoActual ? `Dr. ${medicoActual.nombres} ${medicoActual.apellidos}` : 'Médico'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
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
                <CentroIndicator className="text-white" />
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
            {filteredConsultas.map((consulta, index) => (
              <div key={`${consulta.id_centro}-${consulta.id}-${index}`} className="p-6 hover:bg-gray-50 transition-colors border border-gray-200 rounded-xl mb-4 shadow-sm bg-white">
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
                    <label htmlFor="paciente" className="block text-base font-semibold text-gray-700 mb-1">
                      Seleccionar Paciente
                    </label>
                    <select
                      id="paciente"
                      value={formData.id_frontend || ''}
                      onChange={(e) => {
                        const pacienteIdFrontend = e.target.value
                        handlePacienteChange(pacienteIdFrontend)
                      }}
                      required
                      disabled={isReadOnly}
                      className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.paciente_nombre ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Seleccionar paciente</option>
                      {pacientes.map((paciente) => (
                        <option key={paciente.id_frontend} value={paciente.id_frontend}>
                          {paciente.nombres} {paciente.apellidos} {paciente.cedula ? `- Cédula: ${paciente.cedula}` : ''} {paciente.id_centro ? `(Centro: ${paciente.id_centro})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.paciente_nombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.paciente_nombre}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Selecciona un paciente de la lista. Si no aparece, primero créalo en la página de Pacientes.
                    </p>
                    
                    {/* Label de consultas activas */}
                    {(() => {
                      const pacienteSeleccionado = pacientes.find(p => p.id === formData.id_paciente);
                      if (pacienteSeleccionado?.consultas_activas && pacienteSeleccionado.consultas_activas > 0) {
                        return (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-bold text-sm">
                                  {pacienteSeleccionado.consultas_activas}
                                </span>
                  </div>
                  <div>
                                <p className="text-sm font-medium text-blue-800">
                                  {pacienteSeleccionado.consultas_activas} consulta{pacienteSeleccionado.consultas_activas > 1 ? 's' : ''} activa{pacienteSeleccionado.consultas_activas > 1 ? 's' : ''}
                                </p>
                                {pacienteSeleccionado.medicos_activos && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Con médico(s): {pacienteSeleccionado.medicos_activos}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <label htmlFor="paciente_info" className="block text-base font-semibold text-gray-700 mb-1">
                      Información del Paciente
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700">
                      {formData.paciente_nombre && formData.paciente_apellido ? (
                        <div>
                          <p className="font-medium">{formData.paciente_nombre} {formData.paciente_apellido}</p>
                          {formData.id_paciente && (
                            <p className="text-sm text-gray-500">ID: {formData.id_paciente}</p>
                          )}
                          {(() => {
                            const pacienteSeleccionado = pacientes.find(p => p.id === formData.id_paciente);
                            if (pacienteSeleccionado?.cedula) {
                              return (
                                <p className="text-sm text-gray-500 mt-1">Cédula: {pacienteSeleccionado.cedula}</p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500">Selecciona un paciente primero</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="medico" className="block text-base font-semibold text-gray-700 mb-1">
                      Médico
                    </label>
                    {user?.rol === 'medico' ? (
                      <div>
                        <input
                          type="text"
                          value={medicoActual ? `DR. ${medicoActual.nombres.toUpperCase()} ${medicoActual.apellidos.toUpperCase()}` : 'Cargando información del médico...'}
                          readOnly
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                        {!medicoActual && (
                          <p className="mt-1 text-xs text-amber-600">
                            ⚠️ No se pudo cargar la información del médico. Verifica tu sesión.
                          </p>
                        )}
                      </div>
                    ) : (
                    <select
                      key={`medico-select-${selectKey}`}
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
                      {medicosParaMostrar.map((medico) => (
                          <option key={medico.id_frontend || `${medico.id}-${medico.centro_nombre}`} value={medico.id}>
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
                    {user?.rol === 'admin' && formData.id_paciente && (
                      <p className="mt-1 text-xs text-blue-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Solo se muestran médicos del centro del paciente seleccionado
                      </p>
                    )}
                    {user?.rol === 'admin' && !formData.id_paciente && (
                      <p className="mt-1 text-xs text-gray-500">
                        Selecciona un paciente para ver solo los médicos de su centro
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
                      onChange={(e) => handleEstadoChange(e.target.value)}
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
                    <OptimizedInput
                      id="duracion_minutos"
                      type="number"
                      value={formData.duracion_minutos || ''}
                      onChange={handleDuracionChange}
                      min="0"
                      max="480"
                      step="15"
                      required={formData.estado === 'programada' || formData.estado === 'completada'}
                      disabled={isReadOnly || formData.estado === 'pendiente' || formData.estado === 'cancelada'}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isReadOnly || formData.estado === 'pendiente' || formData.estado === 'cancelada' 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : ''
                      } ${errors.duracion_minutos ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Ej: 30, 45, 60"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Duración estimada o real de la consulta en minutos
                    </p>
                    {errors.duracion_minutos && (
                      <p className="mt-1 text-sm text-red-600">{errors.duracion_minutos}</p>
                    )}
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
                      <OptimizedInput
                        id="fecha"
                        type="datetime-local"
                        value={formData.fecha || ''}
                        onChange={handleFechaChange}
                        required={formData.estado === 'programada'}
                        disabled={isReadOnly}
                        className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.fecha ? 'border-red-500' : 'border-gray-300'}`}
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
                    {errors.fecha && (
                      <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>
                    )}
                  </div>
                  <div></div>
                </div>

                <div>
                  <label htmlFor="motivo" className="block text-base font-medium text-gray-700 mb-1">
                    Motivo de la Consulta
                  </label>
                  <OptimizedTextArea
                    id="motivo"
                    value={formData.motivo || ''}
                    onChange={handleMotivoChange}
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
                  <OptimizedTextArea
                    id="diagnostico"
                    value={formData.diagnostico || ''}
                    onChange={handleDiagnosticoChange}
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
                  <OptimizedTextArea
                    id="tratamiento"
                    value={formData.tratamiento || ''}
                    onChange={handleTratamientoChange}
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
      {/* Modal de confirmación de logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  )
}
