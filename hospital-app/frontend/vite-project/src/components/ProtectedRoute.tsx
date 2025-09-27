"use client"

import React, { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'medico'
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Solo ejecutar si no está cargando
    if (!isLoading) {
      // Si no está autenticado, redirigir al login
      if (!isAuthenticated) {
        navigate(fallbackPath)
        return
      }

      // Si requiere un rol específico y el usuario no lo tiene
      if (requiredRole && user?.rol !== requiredRole) {
        // Redirigir según el rol del usuario
        if (user?.rol === 'admin') {
          navigate('/reportes')
        } else {
          navigate('/consultas')
        }
        return
      }
    }
  }, [isLoading, isAuthenticated, user?.rol, requiredRole, navigate, fallbackPath])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando...</div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (ya se redirigió)
  if (!isAuthenticated) {
    return null
  }

  // Si requiere un rol específico y no lo tiene, no mostrar nada (ya se redirigió)
  if (requiredRole && user?.rol !== requiredRole) {
    return null
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>
}