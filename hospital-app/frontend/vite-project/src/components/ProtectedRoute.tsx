"use client"

import React, { ReactNode } from 'react'
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

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(fallbackPath)
        return
      }

      if (requiredRole && user?.rol !== requiredRole) {
        // Redirigir según el rol del usuario
        if (user?.rol === 'admin') {
          navigate('/admin')
        } else {
          navigate('/consultas')
        }
        return
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRole, navigate, fallbackPath])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-blue-600 text-xl font-semibold">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return null
  }

  return <>{children}</>
}
