"use client"

import React from 'react'
import { useCentro } from '../contexts/CentroContext'
import { Building2, MapPin } from 'lucide-react'

interface CentroIndicatorProps {
  className?: string
  showIcon?: boolean
  showCity?: boolean
}

export const CentroIndicator: React.FC<CentroIndicatorProps> = ({ 
  className = '', 
  showIcon = true, 
  showCity = true 
}) => {
  const { centroActual, centroId } = useCentro()

  if (!centroActual) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        {showIcon && <Building2 className="h-4 w-4" />}
        <span className="text-sm">Centro: {centroId}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-gray-600 ${className}`}>
      {showIcon && <Building2 className="h-4 w-4 text-blue-600" />}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{centroActual.nombre}</span>
        {showCity && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{centroActual.ciudad}</span>
          </div>
        )}
      </div>
    </div>
  )
}
