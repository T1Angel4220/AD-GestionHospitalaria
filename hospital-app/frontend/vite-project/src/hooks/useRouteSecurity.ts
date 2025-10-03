import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthApi } from '../api/authApi';

export const useRouteSecurity = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // No hacer nada si está cargando
    if (isLoading) return;

    // Verificar si el token es válido
    if (!AuthApi.isTokenValid()) {
      AuthApi.logout();
      navigate('/login', { replace: true });
      return;
    }

    // Verificar rutas protegidas
    const protectedRoutes = ['/admin', '/medico', '/usuarios', '/pacientes', '/consultas', '/calendario'];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isProtectedRoute && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true });
      return;
    }

    // Verificar rutas de admin
    const adminRoutes = ['/admin', '/usuarios'];
    const isAdminRoute = adminRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isAdminRoute && user?.rol !== 'admin') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Verificar rutas de médico
    const medicoRoutes = ['/medico'];
    const isMedicoRoute = medicoRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isMedicoRoute && user?.rol !== 'medico') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Verificar rutas compartidas (admin y médico)
    const sharedRoutes = ['/pacientes', '/consultas', '/calendario'];
    const isSharedRoute = sharedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isSharedRoute && user?.rol !== 'admin' && user?.rol !== 'medico') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Si está en login y ya está autenticado, redirigir según rol
    if (location.pathname === '/login' && isAuthenticated && user) {
      if (user.rol === 'admin') {
        navigate('/reportes', { replace: true });
      } else if (user.rol === 'medico') {
        navigate('/consultas', { replace: true });
      }
    }

  }, [isAuthenticated, user, isLoading, location.pathname, navigate]);

  return {
    isAuthenticated,
    user,
    isLoading
  };
};
