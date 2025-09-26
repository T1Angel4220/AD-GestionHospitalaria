"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface CentroMedico {
  id: number
  nombre: string
  ciudad: string
  direccion: string
  telefono: string
  email: string
}

interface CentroContextType {
  centroActual: CentroMedico | null
  centroId: number
  isLoading: boolean
  setCentroActual: (centro: CentroMedico | null) => void
  getCentroHeaders: () => HeadersInit
}

const CentroContext = createContext<CentroContextType | undefined>(undefined)

export const useCentro = () => {
  const context = useContext(CentroContext)
  if (context === undefined) {
    throw new Error('useCentro must be used within a CentroProvider')
  }
  return context
}

interface CentroProviderProps {
  children: ReactNode
}

export const CentroProvider: React.FC<CentroProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [centroActual, setCentroActual] = useState<CentroMedico | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Obtener el centro ID del usuario actual
  const centroId = user?.id_centro || 1

  useEffect(() => {
    // Simular carga de información del centro
    // En una implementación real, aquí harías una llamada a la API
    if (user?.id_centro) {
      // Mapear los centros conocidos
      const centros: Record<number, CentroMedico> = {
        1: {
          id: 1,
          nombre: 'Hospital Central Quito',
          ciudad: 'Quito',
          direccion: 'Av. 6 de Diciembre',
          telefono: '02-1234567',
          email: 'quito@hospital.com'
        },
        2: {
          id: 2,
          nombre: 'Hospital Guayaquil',
          ciudad: 'Guayaquil',
          direccion: 'Av. 9 de Octubre',
          telefono: '04-1234567',
          email: 'guayaquil@hospital.com'
        },
        3: {
          id: 3,
          nombre: 'Hospital Cuenca',
          ciudad: 'Cuenca',
          direccion: 'Av. Solano',
          telefono: '07-1234567',
          email: 'cuenca@hospital.com'
        }
      }

      const centro = centros[user.id_centro]
      if (centro) {
        setCentroActual(centro)
      }
    }
    setIsLoading(false)
  }, [user])

  // Función para obtener headers con X-Centro-Id
  const getCentroHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'X-Centro-Id': centroId.toString(),
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  const value: CentroContextType = {
    centroActual,
    centroId,
    isLoading,
    setCentroActual,
    getCentroHeaders
  }

  return (
    <CentroContext.Provider value={value}>
      {children}
    </CentroContext.Provider>
  )
}
