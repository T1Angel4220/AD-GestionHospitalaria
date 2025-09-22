// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

export function formatDateOnly(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function calculateStatistics(data: any[]): {
  totalConsultas: number;
  totalMedicos: number;
  promedioConsultasPorMedico: number;
  especialidadMasComun: string;
} {
  const totalConsultas = data.reduce((sum, item) => sum + item.total_consultas, 0);
  const totalMedicos = data.length;
  const promedioConsultasPorMedico = totalMedicos > 0 ? Math.round(totalConsultas / totalMedicos) : 0;
  
  // Encontrar especialidad más común
  const especialidades = data.reduce((acc, item) => {
    acc[item.especialidad] = (acc[item.especialidad] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const especialidadMasComun = Object.entries(especialidades)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

  return {
    totalConsultas,
    totalMedicos,
    promedioConsultasPorMedico,
    especialidadMasComun
  };
}
