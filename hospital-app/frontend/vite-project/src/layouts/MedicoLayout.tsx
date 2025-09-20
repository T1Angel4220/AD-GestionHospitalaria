// layouts/MedicoLayout.tsx - Estructura de páginas para Médico
import React from 'react';
import { Outlet } from 'react-router-dom';

interface MedicoLayoutProps {
  children?: React.ReactNode;
}

export const MedicoLayout: React.FC<MedicoLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Médico */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Panel Médico
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Dr. [Nombre]</span>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a href="/medico/dashboard" className="py-4 px-1 border-b-2 border-blue-500 text-sm font-medium text-blue-600">
              Dashboard
            </a>
            <a href="/medico/consultas" className="py-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
              Mis Consultas
            </a>
            <a href="/medico/agenda" className="py-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
              Agenda
            </a>
            <a href="/medico/pacientes" className="py-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
              Pacientes
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};




