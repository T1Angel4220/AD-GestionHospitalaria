"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthApi } from '../api/authApi'
import { ConsultasApi } from '../api/consultasApi'
import type { RegisterRequest } from '../types/auth'
import type { Medico, CentroMedico } from '../types/consultas'
import { 
  Activity, 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle,
  Building2,
  User,
  Lock,
  Mail,
  Stethoscope,
  ArrowLeft
} from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    rol: 'medico',
    id_centro: 1,
    id_medico: undefined
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [centros, setCentros] = useState<CentroMedico[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (AuthApi.isAuthenticated()) {
      navigate('/consultas')
    }
    
    // Cargar datos relacionados
    loadRelatedData()
  }, [navigate])

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

    // Validaciones
    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.rol === 'medico' && !formData.id_medico) {
      setError('Debe seleccionar un médico para usuarios médicos')
      return
    }

    setLoading(true)

    try {
      const response = await AuthApi.register(formData)
      
      // Mostrar mensaje de éxito y redirigir
      alert('Usuario creado exitosamente')
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'id_centro' || name === 'id_medico' ? Number(value) : value
    }))
  }

  const handleMedicoChange = (medicoId: number) => {
    const medico = medicos.find(m => m.id === medicoId)
    setFormData(prev => ({
      ...prev,
      id_medico: medicoId,
      id_centro: medico?.id_centro || prev.id_centro
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            HospitalApp
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión Hospitalaria
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Registrar Usuario
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Crear una nueva cuenta de usuario médico
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al Login
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="usuario@hospital.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
                Rol del Usuario
              </label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Centro Médico */}
            <div>
              <label htmlFor="id_centro" className="block text-sm font-medium text-gray-700 mb-2">
                Centro Médico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="id_centro"
                  name="id_centro"
                  value={formData.id_centro}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Seleccionar centro médico</option>
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre} - {centro.ciudad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Médico (solo si es rol médico) */}
            {formData.rol === 'medico' && (
              <div>
                <label htmlFor="id_medico" className="block text-sm font-medium text-gray-700 mb-2">
                  Médico Asociado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Stethoscope className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="id_medico"
                    name="id_medico"
                    value={formData.id_medico || ''}
                    onChange={(e) => handleMedicoChange(Number(e.target.value))}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleccionar médico</option>
                    {medicos
                      .filter(medico => medico.id_centro === formData.id_centro)
                      .map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          Dr. {medico.nombres} {medico.apellidos} - {medico.especialidad_nombre || 'Sin especialidad'}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Solo se muestran médicos del centro seleccionado
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creando usuario...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear Usuario
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Información importante:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Solo los administradores pueden crear usuarios</div>
              <div>• Los médicos deben estar registrados previamente en el sistema</div>
              <div>• El usuario médico se vinculará con el médico seleccionado</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
