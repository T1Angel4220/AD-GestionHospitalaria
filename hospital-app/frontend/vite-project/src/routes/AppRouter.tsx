// routes/AppRouter.tsx - React Router config
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { MedicoLayout } from '../layouts/MedicoLayout';
import { ReportesPage } from '../pages/ReportesPage';
import AdminPage from '../pages/AdminPage';
import UsuariosPage from '../pages/UsuariosPage';
import CentrosPage from '../pages/CentrosPage';
import EspecialidadesPage from '../pages/EspecialidadesPage';
import EmpleadosPage from '../pages/EmpleadosPage';
import LoginPage from '../pages/LoginPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useRouteSecurity } from '../hooks/useRouteSecurity';

// Componente de protección de rutas
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: ('admin' | 'medico')[];
  requireAuth?: boolean;
}> = ({ children, allowedRoles, requireAuth = true }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  // Si requiere autenticación y no está autenticado
  if (requireAuth && (!isAuthenticated || !user)) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no requiere autenticación pero está autenticado, redirigir según rol
  if (!requireAuth && isAuthenticated && user) {
    if (user.rol === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.rol === 'medico') {
      return <Navigate to="/medico" replace />;
    }
  }
  
  // Verificar roles si se especificaron
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.rol))) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
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

// Componente wrapper para aplicar seguridad de rutas
const AppWithSecurity: React.FC = () => {
  useRouteSecurity();
  
  return (
    <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={
            <ProtectedRoute allowedRoles={[]} requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Rutas de Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="medicos" element={<AdminPage />} />
            <Route path="centros" element={<CentrosPage />} />
            <Route path="especialidades" element={<EspecialidadesPage />} />
            <Route path="empleados" element={<EmpleadosPage />} />
            <Route index element={<Navigate to="/reportes" replace />} />
          </Route>
          
          {/* Rutas adicionales de Admin */}
          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsuariosPage />
            </ProtectedRoute>
          } />
          
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
  );
};

export const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppWithSecurity />
      </BrowserRouter>
    </AuthProvider>
  );
};




