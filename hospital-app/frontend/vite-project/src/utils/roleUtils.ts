import { User } from '../types/auth';

export const getRoleText = (user: User | null): string => {
  if (!user) return 'Usuario';
  
  switch (user.rol) {
    case 'admin':
      return 'Administrador';
    case 'medico':
      if (user.medico) {
        return `Dr. ${user.medico.nombres} ${user.medico.apellidos}`;
      }
      return 'Médico';
    default:
      return 'Usuario';
  }
};
