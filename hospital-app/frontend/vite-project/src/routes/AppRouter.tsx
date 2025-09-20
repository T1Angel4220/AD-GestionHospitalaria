// routes/AppRouter.tsx - React Router config
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { AdminLayout } from '../layouts/AdminLayout';
import { MedicoLayout } from '../layouts/MedicoLayout';
import { ReportesPage } from '../pages/admin/ReportesPage';

// Componente de protección de rutas
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: ('admin' | 'medico')[] 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Página de login temporal
const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  
  const handleLogin = (rol: 'admin' | 'medico') => {
    login({
      id: 1,
      email: `${rol}@hospital.com`,
      rol,
      id_centro: 1,
      id_medico: rol === 'medico' ? 1 : undefined,
      nombres: rol === 'admin' ? 'Admin' : 'Dr. Juan',
      apellidos: rol === 'admin' ? 'Sistema' : 'Pérez'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión Hospitalaria
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Selecciona tu rol para continuar
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleLogin('admin')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Acceder como Administrador
          </button>
          <button
            onClick={() => handleLogin('medico')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Acceder como Médico
          </button>
        </div>
      </div>
    </div>
  );
};

// Página de no autorizado
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-gray-600 mb-8">No tienes permisos para acceder a esta página</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Rutas de Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="reportes" element={<ReportesPage />} />
          <Route index element={<Navigate to="/admin/reportes" replace />} />
        </Route>
        
        {/* Rutas de Médico */}
        <Route path="/medico" element={
          <ProtectedRoute allowedRoles={['medico']}>
            <MedicoLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<div>Dashboard Médico</div>} />
          <Route path="consultas" element={<div>Mis Consultas</div>} />
          <Route path="agenda" element={<div>Agenda</div>} />
          <Route path="pacientes" element={<div>Pacientes</div>} />
          <Route index element={<Navigate to="/medico/dashboard" replace />} />
        </Route>
        
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Ruta 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Página no encontrada</p>
              <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Ir al inicio
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};




