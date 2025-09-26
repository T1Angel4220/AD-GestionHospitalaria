import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.rol === role;
  };

  // Verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roles: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.includes(user.rol);
  };

  // Verificar si es administrador
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // Verificar si es médico
  const isMedico = (): boolean => {
    return hasRole('medico');
  };

  // Verificar si puede acceder a un centro específico
  const canAccessCentro = (centroId: number): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Los admins pueden acceder a cualquier centro
    if (user.rol === 'admin') return true;
    
    // Los médicos solo pueden acceder a su centro
    return user.id_centro === centroId;
  };

  // Verificar si puede ver datos de un médico específico
  const canViewMedico = (medicoId: number): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Los admins pueden ver cualquier médico
    if (user.rol === 'admin') return true;
    
    // Los médicos solo pueden verse a sí mismos
    return user.id_medico === medicoId;
  };

  // Verificar si puede editar datos de un médico específico
  const canEditMedico = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden editar médicos
    return user.rol === 'admin';
  };

  // Verificar si puede crear consultas
  const canCreateConsulta = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los médicos pueden crear consultas
    return user.rol === 'medico';
  };

  // Verificar si puede ver reportes
  const canViewReports = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden ver reportes
    return user.rol === 'admin';
  };

  // Verificar si puede gestionar usuarios
  const canManageUsers = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden gestionar usuarios
    return user.rol === 'admin';
  };

  // Verificar si puede gestionar centros
  const canManageCentros = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden gestionar centros
    return user.rol === 'admin';
  };

  // Verificar si puede gestionar especialidades
  const canManageEspecialidades = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden gestionar especialidades
    return user.rol === 'admin';
  };

  // Verificar si puede gestionar empleados
  const canManageEmpleados = (): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Solo los admins pueden gestionar empleados
    return user.rol === 'admin';
  };

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isMedico,
    canAccessCentro,
    canViewMedico,
    canEditMedico,
    canCreateConsulta,
    canViewReports,
    canManageUsers,
    canManageCentros,
    canManageEspecialidades,
    canManageEmpleados,
  };
};
