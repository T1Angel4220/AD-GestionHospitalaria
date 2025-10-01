"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { AuthApi } from '../api/authApi'
import { AdminApi, type AdminCentro, type AdminMedico } from '../api/adminApi'
import { UsersApi, type User as UserApi, type UserCreate } from '../api/usersApi'
import type { User } from '../types/auth'
import { 
  Activity, 
  Users, 
  LogOut,
  Plus,
  Menu,
  Search,
  Edit,
  Trash2,
  X,
  Stethoscope,
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  Building2,
  Heart,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { AdminBanner } from '../components/AdminBanner'
import { UsuarioModals } from '../components/UsuarioModals'
import { LogoutModal } from '../components/LogoutModal'
import { getRoleText } from '../utils/roleUtils'
import { getActiveSidebarItem, getSidebarItemClasses, getIconContainerClasses, getIconClasses, getTextClasses, getHeaderColors } from '../utils/sidebarUtils'

export default function UsuariosPage() {
  const { user, logout } = useAuth()
  const [usuarios, setUsuarios] = useState<UserApi[]>([])
  const [centros, setCentros] = useState<AdminCentro[]>([])
  const [medicosDisponibles, setMedicosDisponibles] = useState<AdminMedico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const openCreateModal = () => {
    console.log('🆕 [CREATE] Abriendo modal de crear usuario');
    console.log('🆕 [CREATE] Usuarios actuales:', usuarios);
    console.log('🆕 [CREATE] Médicos disponibles actuales:', medicosDisponibles);
    setIsCreateModalOpen(true);
  }
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<UserApi | null>(null)
  
  // Determinar el elemento activo del sidebar y obtener colores
  const activeItem = getActiveSidebarItem(window.location.pathname);
  const headerColors = getHeaderColors(activeItem);


  // Estados para formularios
  const [userForm, setUserForm] = useState<UserCreate>({
    email: '',
    password: '',
    rol: 'medico',
    id_centro: 1,
    id_medico: undefined
  })

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usuariosData, centrosData] = await Promise.all([
        UsersApi.getUsuarios(),
        AdminApi.getCentros(),
      ])
      setUsuarios(usuariosData)
      setCentros(centrosData)
      
      // Cargar médicos del centro por defecto (Quito)
      await filtrarMedicosPorCentro(1)
      
      setError(null)
    } catch (error) {
      setError("Error al cargar los datos")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarMedicosPorCentro = async (centroId: number) => {
    try {
      console.log('🔍 [FILTER] Filtrando médicos por centro:', centroId);
      
      // Obtener médicos del centro específico
      const medicosDelCentro = await AdminApi.getMedicosByCentro(centroId);
      console.log('📋 [FILTER] Médicos del centro obtenidos:', medicosDelCentro);
      
      // Determinar el origen de la base de datos basado en el centroId
      let origenBd = 'central';
      if (centroId === 2) origenBd = 'guayaquil';
      if (centroId === 3) origenBd = 'cuenca';
      
      console.log('🗄️ [FILTER] Origen de BD para centro', centroId, ':', origenBd);
      
      // Filtrar médicos que ya tienen cuenta asociada SOLO en la misma base de datos
      const medicosConCuenta = usuarios
        .filter(u => u.rol === 'medico' && u.id_medico && u.origen_bd === origenBd)
        .map(u => u.id_medico);
      
      console.log('👥 [FILTER] Médicos con cuenta en', origenBd, ':', medicosConCuenta);
      
      const medicosDisponiblesFiltrados = medicosDelCentro.filter(medico => 
        !medicosConCuenta.includes(medico.id)
      );
      
      console.log('✅ [FILTER] Médicos disponibles después del filtro:', medicosDisponiblesFiltrados);
      
      setMedicosDisponibles(medicosDisponiblesFiltrados);
      
      console.log('✅ [FILTER] Resumen:', {
        centroId,
        origenBd,
        totalMedicos: medicosDelCentro.length,
        disponibles: medicosDisponiblesFiltrados.length,
        conCuenta: medicosConCuenta.length,
        medicosConCuenta: medicosConCuenta,
        medicosDisponibles: medicosDisponiblesFiltrados.map(m => `${m.nombres} ${m.apellidos} (ID: ${m.id})`)
      });
    } catch (error) {
      console.error('❌ [FILTER] Error filtrando médicos:', error);
      setError("Error al cargar médicos del centro");
    }
  }

  const cargarMedicosParaEdicion = async (centroId: number, medicoActualId?: number) => {
    try {
      console.log('📝 [EDIT-FILTER] Cargando médicos para edición, centro:', centroId, 'médico actual:', medicoActualId);
      
      // Obtener médicos del centro específico
      const medicosDelCentro = await AdminApi.getMedicosByCentro(centroId);
      console.log('📋 [EDIT-FILTER] Médicos del centro obtenidos:', medicosDelCentro);
      
      // Determinar el origen de la base de datos basado en el centroId
      let origenBd = 'central';
      if (centroId === 2) origenBd = 'guayaquil';
      if (centroId === 3) origenBd = 'cuenca';
      
      console.log('🗄️ [EDIT-FILTER] Origen de BD para centro', centroId, ':', origenBd);
      
      // Filtrar médicos que ya tienen cuenta asociada SOLO en la misma base de datos
      const medicosConCuenta = usuarios
        .filter(u => u.rol === 'medico' && u.id_medico && u.origen_bd === origenBd)
        .map(u => u.id_medico);
      
      console.log('👥 [EDIT-FILTER] Médicos con cuenta en', origenBd, ':', medicosConCuenta);
      
      // Incluir el médico actual si existe (para mostrarlo en el dropdown)
      const medicosParaMostrar = medicosDelCentro.filter(medico => 
        !medicosConCuenta.includes(medico.id) || medico.id === medicoActualId
      );
      
      console.log('✅ [EDIT-FILTER] Médicos para mostrar (incluyendo actual):', medicosParaMostrar);
      
      setMedicosDisponibles(medicosParaMostrar);
      
      console.log('✅ [EDIT-FILTER] Resumen:', {
        centroId,
        origenBd,
        totalMedicos: medicosDelCentro.length,
        paraMostrar: medicosParaMostrar.length,
        conCuenta: medicosConCuenta.length,
        medicoActual: medicoActualId,
        medicosParaMostrar: medicosParaMostrar.map(m => `${m.nombres} ${m.apellidos} (ID: ${m.id})`)
      });
    } catch (error) {
      console.error('❌ [EDIT-FILTER] Error cargando médicos para edición:', error);
      setError("Error al cargar médicos del centro");
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar que no se cree múltiples cuentas para el mismo médico
    if (userForm.rol === 'medico' && userForm.id_medico) {
      const medicoYaAsociado = usuarios.find(u => 
        u.rol === 'medico' && u.id_medico === userForm.id_medico
      )
      
      if (medicoYaAsociado) {
        const medicoInfo = medicosDisponibles.find(m => m.id === userForm.id_medico)
        const nombreMedico = medicoInfo ? `${medicoInfo.nombres} ${medicoInfo.apellidos}` : 'este médico'
        setError(`El médico ${nombreMedico} ya tiene una cuenta asociada. Un médico solo puede tener una cuenta.`)
        return
      }
    }

    try {
      await UsersApi.createUsuario(userForm)
      setIsCreateModalOpen(false)
      setUserForm({ email: '', password: '', rol: 'medico', id_centro: 1, id_medico: undefined })
      // Recargar datos después de crear usuario
      await loadData()
    } catch (error) {
      setError("Error al crear el usuario")
      console.error(error)
    }
  }

  const handleEditUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔄 [EDIT] Iniciando actualización de usuario...');
    setError(null)

    // Validar que no se asocie un médico ya asociado a otro usuario
    if (userForm.rol === 'medico' && userForm.id_medico && selectedUsuario) {
      const medicoYaAsociado = usuarios.find(u => 
        u.rol === 'medico' && 
        u.id_medico === userForm.id_medico && 
        u.id !== selectedUsuario.id // Excluir el usuario actual
      )
      
      if (medicoYaAsociado) {
        const medicoInfo = medicosDisponibles.find(m => m.id === userForm.id_medico)
        const nombreMedico = medicoInfo ? `${medicoInfo.nombres} ${medicoInfo.apellidos}` : 'este médico'
        setError(`El médico ${nombreMedico} ya está asociado a otro usuario. Un médico solo puede tener una cuenta.`)
        return
      }
    }

    try {
      if (selectedUsuario) {
        console.log('🔄 [UPDATE] Actualizando usuario:', {
          selectedUsuario,
          userForm,
          idReal: selectedUsuario.id,
          idFrontend: selectedUsuario.id_frontend
        });
        
        // Determinar el centro correcto para la petición
        let centroIdParaPeticion = selectedUsuario.id_centro;
        if (selectedUsuario.origen_bd === 'guayaquil') {
          centroIdParaPeticion = 2;
        } else if (selectedUsuario.origen_bd === 'cuenca') {
          centroIdParaPeticion = 3;
        } else if (selectedUsuario.origen_bd === 'central') {
          centroIdParaPeticion = 1;
        }
        
        console.log('🔄 [UPDATE] Centro para petición:', centroIdParaPeticion);
        
        console.log('🔄 [UPDATE] Enviando petición al backend...');
        const resultado = await UsersApi.updateUsuario(selectedUsuario.id, userForm)
        console.log('✅ [UPDATE] Respuesta del backend:', resultado);
        console.log('✅ [UPDATE] Usuario actualizado exitosamente');
        
        // Actualizar solo la lista de usuarios, no recargar todo
        const usuariosActualizados = await UsersApi.getUsuarios()
        setUsuarios(usuariosActualizados)
        console.log('✅ [UPDATE] Lista de usuarios actualizada');
        
        setIsEditModalOpen(false)
        setUserForm({ email: '', password: '', rol: 'medico', id_centro: 1, id_medico: undefined })
        setSelectedUsuario(null)
      }
    } catch (error) {
      console.error('❌ [UPDATE] Error actualizando usuario:', error);
      setError("Error al actualizar el usuario")
    }
  }

  const handleDeleteUsuario = async () => {
    if (selectedUsuario) {
      try {
        await UsersApi.deleteUsuario(selectedUsuario.id)
        setIsDeleteModalOpen(false)
        setSelectedUsuario(null)
        await loadData()
      } catch (error) {
        setError("Error al eliminar el usuario")
        console.error(error)
      }
    }
  }

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

  const openEditModal = (usuario: AdminUsuario) => {
    console.log('📝 [EDIT] Abriendo modal de edición para usuario:', usuario);
    setSelectedUsuario(usuario)
    
    // Determinar el centro correcto basado en origen_bd
    let centroId = usuario.id_centro;
    if (usuario.origen_bd === 'guayaquil') {
      centroId = 2;
    } else if (usuario.origen_bd === 'cuenca') {
      centroId = 3;
    } else if (usuario.origen_bd === 'central') {
      centroId = 1;
    }
    
    console.log('📝 [EDIT] Centro determinado:', { origen_bd: usuario.origen_bd, centroId });
    
    setUserForm({
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      id_centro: centroId,
      id_medico: usuario.id_medico
    })
    
    // Cargar médicos del centro del usuario (incluyendo el médico actual para mostrarlo)
    if (usuario.rol === 'medico') {
      cargarMedicosParaEdicion(centroId, usuario.id_medico);
    }
    
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (usuario: AdminUsuario) => {
    setSelectedUsuario(usuario)
    setIsDeleteModalOpen(true)
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className={`flex items-center justify-between h-20 px-6 ${headerColors.gradient}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className={`h-8 w-8 ${headerColors.iconColor}`} />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-purple-100 text-xs">Sistema Médico</p>
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
            <a href="/reportes" className={getSidebarItemClasses('dashboard', activeItem)}>
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
            
            {/* Médicos - solo para administradores */}
            <a href="/medicos" className={getSidebarItemClasses('medicos', activeItem)}>
              <div className={getIconContainerClasses('medicos', activeItem)}>
                <Stethoscope className={getIconClasses('medicos', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('medicos', activeItem).main}>Médicos</div>
                <div className={getTextClasses('medicos', activeItem).sub}>Personal médico</div>
              </div>
            </a>

            {/* Centros Médicos - solo para administradores */}
            <a href="/centros" className={getSidebarItemClasses('centros', activeItem)}>
              <div className={getIconContainerClasses('centros', activeItem)}>
                <Building2 className={getIconClasses('centros', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('centros', activeItem).main}>Centros Médicos</div>
                <div className={getTextClasses('centros', activeItem).sub}>Gestión centros</div>
              </div>
            </a>

            {/* Especialidades - solo para administradores */}
            <a href="/especialidades" className={getSidebarItemClasses('especialidades', activeItem)}>
              <div className={getIconContainerClasses('especialidades', activeItem)}>
                <Heart className={getIconClasses('especialidades', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('especialidades', activeItem).main}>Especialidades</div>
                <div className={getTextClasses('especialidades', activeItem).sub}>Gestión especialidades</div>
              </div>
            </a>

            {/* Empleados - solo para administradores */}
            <a href="/empleados" className={getSidebarItemClasses('empleados', activeItem)}>
              <div className={getIconContainerClasses('empleados', activeItem)}>
                <UserCheck className={getIconClasses('empleados', activeItem)} />
              </div>
              <div>
                <div className={getTextClasses('empleados', activeItem).main}>Empleados</div>
                <div className={getTextClasses('empleados', activeItem).sub}>Personal administrativo</div>
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
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{user?.email}</div>
                <div className="text-gray-400 text-xs">Administrador</div>
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
        <div className={`${headerColors.gradient} shadow-lg`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-purple-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <Users className={`h-8 w-8 mr-3 ${headerColors.iconColor}`} />
                    Gestión de Usuarios
                  </h1>
                  <p className="text-purple-100 mt-1">Administra los usuarios del sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-purple-600"
                  iconBackgroundColor="bg-purple-700"
                  icon={Users}
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
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.rol === 'admin').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Médicos</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.rol === 'medico').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Asociados</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.filter(u => u.id_medico).length}</p>
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
                placeholder="Buscar usuarios por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Usuarios List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Lista de Usuarios
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona los usuarios del sistema (excluyendo usuarios ya asociados a médicos)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Centro Médico
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id_frontend || usuario.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {usuario.email}
                            </div>
                            <div className="text-sm text-gray-500">ID: {usuario.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          usuario.rol === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol === 'admin' ? 'Administrador' : 'Médico'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {usuario.origen_bd === 'central' ? 'Quito' : 
                           usuario.origen_bd === 'guayaquil' ? 'Guayaquil' : 
                           usuario.origen_bd === 'cuenca' ? 'Cuenca' : 
                           usuario.centro_nombre || `Centro ${usuario.id_centro}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          usuario.medico_nombres && usuario.medico_apellidos
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.medico_nombres && usuario.medico_apellidos 
                            ? 'Asociado'
                            : 'Disponible'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(usuario)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(usuario)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
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


      <UsuarioModals
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        selectedUsuario={selectedUsuario}
        usuarioForm={userForm}
        setUsuarioForm={setUserForm}
        centros={centros}
        medicos={medicosDisponibles}
        handleCreateUsuario={handleCreateUser}
        handleEditUsuario={handleEditUsuario}
        handleDeleteUsuario={handleDeleteUsuario}
        onCentroChange={filtrarMedicosPorCentro}
        isEditMode={isEditModalOpen}
        buttonColors={{
          primary: 'bg-gradient-to-r from-purple-600 to-violet-600',
          primaryHover: 'hover:from-purple-700 hover:to-violet-700',
          primaryFocus: 'focus:ring-purple-500',
          primaryIcon: 'text-purple-600'
        }}
      />

      {/* Modal de confirmación de logout */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  )
}
