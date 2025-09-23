"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Medico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText,
  LogOut,
  Home,
  Menu,
  X,
  User,
  Stethoscope,
  Building2,
  Mail,
  Shield
} from 'lucide-react'

export default function PerfilPage() {
  const { user, logout } = useAuth()
  const [medicoActual, setMedicoActual] = useState<Medico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadMedicoActual()
  }, [])

  const loadMedicoActual = async () => {
    if (user?.rol === 'medico' && user.id_medico) {
      try {
        setLoading(true)
        const medicos = await ConsultasApi.getMedicos()
        const medico = medicos.find(m => m.id === user.id_medico)
        if (medico) {
          setMedicoActual(medico)
        } else {
          setError("No se encontró información del médico")
        }
      } catch (err) {
        setError("Error al cargar los datos del médico")
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      setError("Acceso denegado: Solo los médicos pueden ver su perfil")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando perfil...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-red-600 text-xl font-semibold">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-gray-600 to-gray-700">
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
              <a href="/admin" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Home className="h-5 w-5" />
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

            {/* Calendario - visible para todos */}
            <a href="/calendario" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
              <div className="w-10 h-10 bg-gray-700 group-hover:bg-cyan-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Calendario</div>
                <div className="text-xs text-gray-400">Vista mensual</div>
              </div>
            </a>
            
            {/* Solo mostrar Médicos para administradores */}
            {user?.rol === 'admin' && (
              <a href="/admin" className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group">
                <div className="w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Médicos</div>
                  <div className="text-xs text-gray-400">Personal médico</div>
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
              <a href="/perfil" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium">Perfil</div>
                <div className="text-xs text-gray-100">Mi información</div>
              </div>
            </a>
            )}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center mb-3">
               <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-white" />
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
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-white hover:bg-gray-500 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
                  <p className="text-gray-100 mt-1">Información personal y profesional</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium"></p>
                  <p className="text-gray-100 text-lg font-semibold">
                    {user?.rol === 'admin' ? 'Administrador' : 
                     medicoActual ? `Dr. ${medicoActual.nombres} ${medicoActual.apellidos}` : 'Médico'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Información Personal - Solo para médicos */}
            {user?.rol === 'medico' && medicoActual && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-900">
                    Información Personal
                  </h3>
                  <p className="mt-1 text-base text-blue-700">
                    Datos personales del médico
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <p className="text-base text-blue-700 font-semibold">Nombre Completo</p>
                      </div>
                      <p className="text-lg text-gray-800 font-medium">
                        Dr. {medicoActual.nombres} {medicoActual.apellidos}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <p className="text-base text-blue-700 font-semibold">Email</p>
                      </div>
                      <p className="text-lg text-gray-800 font-medium">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información Profesional - Solo para médicos */}
            {user?.rol === 'medico' && medicoActual && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                  <h3 className="text-xl font-semibold text-green-900">
                    Información Profesional
                  </h3>
                  <p className="mt-1 text-base text-green-700">
                    Datos profesionales y especialización
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-5 w-5 text-green-600" />
                        <p className="text-base text-green-700 font-semibold">Especialidad</p>
                      </div>
                      <p className="text-lg text-gray-800 font-medium">
                        {medicoActual.especialidad_nombre || 'No especificada'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-green-600" />
                        <p className="text-base text-green-700 font-semibold">Centro Médico</p>
                      </div>
                      <p className="text-lg text-gray-800 font-medium">
                        {medicoActual.centro_nombre || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información del Sistema - Visible para todos */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <h3 className="text-xl font-semibold text-purple-900">
                  Información del Sistema
                </h3>
                <p className="mt-1 text-base text-purple-700">
                  Datos de acceso y permisos
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <p className="text-base text-purple-700 font-semibold">Rol</p>
                    </div>
                    <p className="text-lg text-gray-800 font-medium">
                      {user?.rol === 'admin' ? 'Administrador' : 'Médico'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-purple-600" />
                      <p className="text-base text-purple-700 font-semibold">ID de Usuario</p>
                    </div>
                    <p className="text-lg text-gray-800 font-medium">
                      {user?.id || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Información de Solo Lectura
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      Esta información es de solo lectura. Para actualizar tus datos personales, 
                      contacta con el administrador del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
