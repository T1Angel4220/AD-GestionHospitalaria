import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  permissions?: string[];
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  fallback = null,
  requireAll = false,
  permissions = []
}) => {
  const { hasRole, hasAnyRole } = usePermissions();

  // Verificar permisos específicos
  const checkPermission = (perm: string): boolean => {
    switch (perm) {
      case 'admin':
        return hasRole('admin');
      case 'medico':
        return hasRole('medico');
      case 'admin_or_medico':
        return hasAnyRole(['admin', 'medico']);
      case 'view_reports':
        return hasRole('admin');
      case 'manage_users':
        return hasRole('admin');
      case 'manage_centros':
        return hasRole('admin');
      case 'manage_especialidades':
        return hasRole('admin');
      case 'manage_empleados':
        return hasRole('admin');
      case 'create_consultas':
        return hasRole('medico');
      default:
        return false;
    }
  };

  // Verificar si tiene el permiso requerido
  const hasPermission = checkPermission(permission);

  // Verificar permisos adicionales si se especificaron
  const hasAdditionalPermissions = permissions.length === 0 || 
    (requireAll 
      ? permissions.every(perm => checkPermission(perm))
      : permissions.some(perm => checkPermission(perm))
    );

  // Si no tiene permisos, mostrar fallback o nada
  if (!hasPermission || !hasAdditionalPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componente para mostrar contenido solo a administradores
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <ProtectedComponent permission="admin" fallback={fallback}>
    {children}
  </ProtectedComponent>
);

// Componente para mostrar contenido solo a médicos
export const MedicoOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <ProtectedComponent permission="medico" fallback={fallback}>
    {children}
  </ProtectedComponent>
);

// Componente para mostrar contenido a administradores o médicos
export const AdminOrMedico: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <ProtectedComponent permission="admin_or_medico" fallback={fallback}>
    {children}
  </ProtectedComponent>
);
