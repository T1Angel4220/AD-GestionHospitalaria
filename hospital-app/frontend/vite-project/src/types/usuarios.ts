import type { User } from './auth'

// Tipo extendido para usuarios en la página de administración
export interface UsuarioAdmin extends User {
  origen_bd?: string;
  id_frontend?: string;
  centro_nombre?: string;
  medico_nombres?: string;
  medico_apellidos?: string;
}


