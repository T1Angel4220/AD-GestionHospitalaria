export const getStatusColor = (estado: string): string => {
  switch (estado) {
    case 'completada':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'programada':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusText = (estado: string): string => {
  switch (estado) {
    case 'completada':
      return 'Completada';
    case 'programada':
      return 'Programada';
    case 'pendiente':
      return 'Pendiente';
    case 'cancelada':
      return 'Cancelada';
    default:
      return estado;
  }
};
