"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from '../contexts/AuthContext'
import { ConsultasApi } from '../api/consultasApi'
import type { Consulta, ConsultaUpdate, Medico } from '../types/consultas'
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Home,
  Menu,
  X,
  AlertCircle,
  User,
  Stethoscope
} from 'lucide-react'
import { CalendarView } from '../components/Calendar/CalendarView'
import ConsultaModal from '../components/ConsultaModal'

export default function CalendarPage() {
  const { user, logout } = useAuth()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estados para modales
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null)

  // Estado del formulario del modal
  const [formData, setFormData] = useState<Partial<Consulta>>({
    paciente_nombre: '',
    paciente_apellido: '',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    fecha: '',
    id_medico: 0,
    id_centro: 0
  })

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
      setConsultas(consultasData)
      setMedicos(medicosData)
      setError(null)
    } catch (err) {
      setError("Error al cargar los datos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewConsulta = () => {
    setEditingConsulta(null)
    setFormData({
      paciente_nombre: '',
      paciente_apellido: '',
      motivo: '',
      diagnostico: '',
      tratamiento: '',
      fecha: '',
      id_medico: 0,
      id_centro: 0
    })
    setIsDialogOpen(true)
  }

  const handleEditConsulta = (consulta: Consulta) => {
    setEditingConsulta(consulta)
    setFormData({
      paciente_nombre: consulta.paciente_nombre,
      paciente_apellido: consulta.paciente_apellido,
      motivo: consulta.motivo || '',
      diagnostico: consulta.diagnostico || '',
      tratamiento: consulta.tratamiento || '',
      fecha: consulta.fecha,
      id_medico: consulta.id_medico || 0,
      id_centro: consulta.id_centro || 0
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConsulta) {
        const updateData: ConsultaUpdate = {
          ...formData,
          estado: editingConsulta.estado
        }
        await ConsultasApi.updateConsulta(editingConsulta.id, updateData)
      } else {
        // Convertir Partial<Consulta> a ConsultaCreate
        const createData = {
          paciente_nombre: formData.paciente_nombre || '',
          paciente_apellido: formData.paciente_apellido || '',
          motivo: formData.motivo || '',
          diagnostico: formData.diagnostico || '',
          tratamiento: formData.tratamiento || '',
          fecha: formData.fecha || '',
          id_medico: formData.id_medico || 0,
          id_centro: formData.id_centro || 0
        }
        await ConsultasApi.createConsulta(createData)
      }
      await loadConsultas()
      setIsDialogOpen(false)
    } catch (err) {
      setError("Error al guardar la consulta")
      console.error(err)
    }
  }

  const handleDelete = async () => {
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

  const loadConsultas = async () => {
    try {
      const consultasData = await ConsultasApi.getConsultas()
      setConsultas(consultasData)
    } catch (err) {
      setError("Error al cargar las consultas")
      console.error(err)
    }
  }

  const handleViewChange = (view: string) => {
    // Manejar cambio de vista del calendario
    console.log('Vista cambiada a:', view)
  }

  const handleNavigate = (date: Date) => {
    // Manejar navegación del calendario
    console.log('Navegación a:', date)
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

            {/* Calendario - visible para todos - ACTIVO */}
            <a href="/calendario" className="w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-medium">Calendario</div>
                <div className="text-xs text-indigo-100">Vista mensual</div>
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
               <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-white" />
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
      <div className="lg:pl-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
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
                  <h1 className="text-3xl font-bold text-white">Calendario de Consultas</h1>
                  <p className="text-indigo-100 mt-1">Vista mensual de citas médicas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium"></p>
                  <p className="text-indigo-100 text-lg font-semibold">
                    {user?.rol === 'admin' ? 'Administrador' : 'Médico'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
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
            onCreateConsulta={handleNewConsulta}
            onEditConsulta={handleEditConsulta}
            onViewChange={handleViewChange}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Modales */}
      <ConsultaModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        medicos={medicos}
        centros={[]}
        editingConsulta={editingConsulta}
      />

      {/* Modal de Eliminación */}
      {isDeleteModalOpen && consultaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{backgroundColor: 'oklch(0.97 0 0 / 0.63)'}} onClick={() => setIsDeleteModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Eliminar Consulta</h3>
                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <p className="text-gray-700">
                ¿Estás seguro de que quieres eliminar la consulta de{' '}
                <span className="font-semibold">
                  {consultaToDelete.paciente_nombre} {consultaToDelete.paciente_apellido}
                </span>?
              </p>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}