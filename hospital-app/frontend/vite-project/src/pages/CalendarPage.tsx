"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, Medico } from '../types/consultas'
import moment from 'moment'
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Menu,
  X,
  AlertCircle,
  User,
  Stethoscope,
  BarChart3,
  Building2,
  Heart,
  UserCheck,
  UserPlus
} from 'lucide-react'
import { CalendarView } from '../components/Calendar/CalendarView'
import { AdminBanner } from '../components/AdminBanner'
import { getRoleText } from '../utils/roleUtils'

export default function CalendarPage() {
  const { user, logout } = useAuth()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Estados para modales
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingConsulta, setViewingConsulta] = useState<Consulta | null>(null)


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [consultasData, medicosData] = await Promise.all([
        ConsultasApi.getConsultas(),
        ConsultasApi.getMedicos()
      ])
      
      // Filtrar consultas por el doctor en sesión
      let consultasFiltradas = consultasData
      if (user?.rol === 'medico' && user.id_medico) {
        consultasFiltradas = consultasData.filter(consulta => consulta.id_medico === user.id_medico)
      }
      
      setConsultas(consultasFiltradas)
      setMedicos(medicosData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }





  const handleViewChange = (view: string) => {
    // Manejar cambio de vista del calendario
    setCurrentView(view)
    console.log('Vista cambiada a:', view)
  }

  const handleNavigate = (date: Date) => {
    // Manejar navegación del calendario
    setCurrentDate(date)
    console.log('Navegación a:', date)
  }

  const handleViewConsulta = (consulta: Consulta) => {
    setViewingConsulta(consulta)
    setIsViewModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-indigo-600 text-xl font-semibold">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-cyan-600 to-cyan-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3">
              <Activity className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <span className="text-white text-xl font-bold">HospitalApp</span>
              <p className="text-gray-100 text-xs">Sistema Médico</p>
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
            {/* Solo mostrar Dashboard para administradores */}
            {user?.rol === 'admin' && (
              <a href="/reportes" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-amber-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Dashboard</div>
                  <div className="text-xs text-gray-400">Panel principal</div>
                </div>
              </a>
            )}
            
            {/* Consultas - visible para todos */}
            <a href="/consultas" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Consultas</div>
                <div className="text-xs text-gray-400">Citas médicas</div>
              </div>
            </a>

            {/* Pacientes - visible para todos */}
            <a href="/pacientes" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-red-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Pacientes</div>
                <div className="text-xs text-gray-400">Gestión pacientes</div>
              </div>
            </a>

            {/* Calendario - visible para todos - ACTIVO */}
            <a href="/calendario" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <div className="font-medium">Calendario</div>
                <div className="text-xs text-cyan-100">Vista mensual</div>
              </div>
            </a>
            
            {/* Solo mostrar Médicos para administradores */}
            {user?.rol === 'admin' && (
              <a href="/medicos" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Médicos</div>
                  <div className="text-xs text-gray-400">Personal médico</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Centros para administradores */}
            {user?.rol === 'admin' && (
              <a href="/centros" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Centros Médicos</div>
                  <div className="text-xs text-gray-400">Gestión centros</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Especialidades para administradores */}
            {user?.rol === 'admin' && (
              <a href="/especialidades" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Especialidades</div>
                  <div className="text-xs text-gray-400">Gestión especialidades</div>
                </div>
              </a>
            )}

            {/* Solo mostrar Empleados para administradores */}
            {user?.rol === 'admin' && (
              <a href="/empleados" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Empleados</div>
                  <div className="text-xs text-gray-400">Personal administrativo</div>
                </div>
              </a>
            )}
            
            {/* Solo mostrar Usuarios para administradores */}
            {user?.rol === 'admin' && (
              <a href="/usuarios" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Usuarios</div>
                  <div className="text-xs text-gray-400">Gestión usuarios</div>
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
               <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-base font-medium">{user?.email}</div>
                <div className="text-gray-400 text-sm font-medium">
                  {user?.rol === 'admin' ? 'Administrador' : 
                   user?.rol === 'medico' ? `Dr. ${user.medico?.nombres} ${user.medico?.apellidos}` : 'Médico'}
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
      <div className="lg:pl-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-indigo-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">
                    {currentView === 'month' && moment(currentDate).format('MMMM YYYY')}
                    {currentView === 'week' && `Semana del ${moment(currentDate).startOf('week').format('DD MMM')} al ${moment(currentDate).endOf('week').format('DD MMM YYYY')}`}
                    {currentView === 'day' && moment(currentDate).format('dddd, DD MMMM YYYY')}
                    {currentView === 'agenda' && 'Agenda de Consultas'}
                  </h1>
                  <p className="text-cyan-100 mt-1">
                    {currentView === 'month' && 'Vista mensual de citas médicas'}
                    {currentView === 'week' && 'Vista semanal de citas médicas'}
                    {currentView === 'day' && 'Vista diaria de citas médicas'}
                    {currentView === 'agenda' && 'Lista de consultas programadas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <AdminBanner 
                  backgroundColor="bg-cyan-600"
                  iconBackgroundColor="bg-cyan-700"
                  icon={Calendar}
                  roleText={getRoleText(user)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <CalendarView
            consultas={consultas}
            medicos={medicos}
            loading={loading}
            onViewConsulta={handleViewConsulta}
            onViewChange={handleViewChange}
            onNavigate={handleNavigate}
            user={user ? { rol: user.rol } : undefined}
          />
        </div>
      </div>



      {/* Modal de Solo Lectura */}
      {isViewModalOpen && viewingConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsViewModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full transform transition-all duration-300 scale-100 max-h-[85vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <Calendar className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Ver Consulta Médica
                    </h3>
                    <p className="text-cyan-100 text-base">
                      Información detallada de la consulta
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Nombre del Paciente
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.paciente_nombre}
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Apellido del Paciente
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.paciente_apellido}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Fecha de la Consulta
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.fecha ? moment(viewingConsulta.fecha).format('DD/MM/YYYY HH:mm') : 'No especificada'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        viewingConsulta.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                        viewingConsulta.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                        viewingConsulta.estado === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewingConsulta.estado?.charAt(0).toUpperCase() + viewingConsulta.estado?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-1">
                    Motivo de la Consulta
                  </label>
                  <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 min-h-[80px]">
                    {viewingConsulta.motivo || 'No especificado'}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 min-h-[80px]">
                    {viewingConsulta.diagnostico || 'No especificado'}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-1">
                    Tratamiento
                  </label>
                  <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 min-h-[80px]">
                    {viewingConsulta.tratamiento || 'No especificado'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Médico Asignado
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.medico_nombres ? `Dr. ${viewingConsulta.medico_nombres} ${viewingConsulta.medico_apellidos}` : 'No asignado'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Centro Médico
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.centro_nombre || 'No especificado'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-1">
                      Duración de la Consulta
                    </label>
                    <div className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {viewingConsulta.duracion_minutos && viewingConsulta.duracion_minutos > 0 ? 
                        `${viewingConsulta.duracion_minutos} minutos` + 
                        (viewingConsulta.duracion_minutos >= 60 ? 
                          ` (${Math.floor(viewingConsulta.duracion_minutos / 60)}h ${viewingConsulta.duracion_minutos % 60}m)` : 
                          '') : 
                        viewingConsulta.estado === 'pendiente' || viewingConsulta.estado === 'cancelada' ?
                          'No aplica' :
                          'No especificada'
                      }
                    </div>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}