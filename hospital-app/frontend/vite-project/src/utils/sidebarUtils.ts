// utils/sidebarUtils.ts - Utilidades para el sidebar

export type SidebarItem = 'dashboard' | 'consultas' | 'calendario' | 'medicos' | 'usuarios' | 'perfil' | 'centros' | 'especialidades' | 'empleados';

export const getActiveSidebarItem = (pathname: string): SidebarItem => {
  if (pathname.includes('/reportes')) {
    return 'dashboard';
  }
  if (pathname.includes('/consultas')) {
    return 'consultas';
  }
  if (pathname.includes('/calendario')) {
    return 'calendario';
  }
  if (pathname.includes('/medicos')) {
    return 'medicos';
  }
  if (pathname.includes('/centros')) {
    return 'centros';
  }
  if (pathname.includes('/especialidades')) {
    return 'especialidades';
  }
  if (pathname.includes('/empleados')) {
    return 'empleados';
  }
  if (pathname.includes('/usuarios')) {
    return 'usuarios';
  }
  if (pathname.includes('/perfil')) {
    return 'perfil';
  }
  return 'dashboard'; // Por defecto
};

// Función para obtener los colores del header basados en la página activa
export const getHeaderColors = (activeItem: SidebarItem): {
  gradient: string;
  iconBg: string;
  iconColor: string;
} => {
  switch (activeItem) {
    case 'dashboard':
      return {
        gradient: 'bg-gradient-to-r from-amber-600 to-orange-600',
        iconBg: 'bg-amber-600',
        iconColor: 'text-amber-600'
      };
    case 'consultas':
      return {
        gradient: 'bg-gradient-to-r from-emerald-600 to-green-600',
        iconBg: 'bg-emerald-600',
        iconColor: 'text-emerald-600'
      };
    case 'calendario':
      return {
        gradient: 'bg-gradient-to-r from-cyan-600 to-blue-600',
        iconBg: 'bg-cyan-600',
        iconColor: 'text-cyan-600'
      };
    case 'medicos':
      return {
        gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        iconBg: 'bg-blue-600',
        iconColor: 'text-blue-600'
      };
    case 'usuarios':
      return {
        gradient: 'bg-gradient-to-r from-purple-600 to-violet-600',
        iconBg: 'bg-purple-600',
        iconColor: 'text-purple-600'
      };
    case 'centros':
      return {
        gradient: 'bg-gradient-to-r from-teal-600 to-emerald-600',
        iconBg: 'bg-teal-600',
        iconColor: 'text-teal-600'
      };
    case 'especialidades':
      return {
        gradient: 'bg-gradient-to-r from-pink-600 to-rose-600',
        iconBg: 'bg-pink-600',
        iconColor: 'text-pink-600'
      };
    case 'empleados':
      return {
        gradient: 'bg-gradient-to-r from-gray-600 to-slate-600',
        iconBg: 'bg-gray-600',
        iconColor: 'text-gray-600'
      };
    case 'perfil':
      return {
        gradient: 'bg-gradient-to-r from-gray-600 to-slate-600',
        iconBg: 'bg-gray-600',
        iconColor: 'text-gray-600'
      };
    default:
      return {
        gradient: 'bg-gradient-to-r from-amber-600 to-orange-600',
        iconBg: 'bg-amber-600',
        iconColor: 'text-amber-600'
      };
  }
};

export const getSidebarItemClasses = (
  item: SidebarItem,
  activeItem: SidebarItem
): string => {
  const isActive = item === activeItem;
  
  if (isActive) {
    // Opción activa según el tipo
    switch (item) {
      case 'dashboard':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg";
      case 'consultas':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-lg";
      case 'calendario':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg";
      case 'medicos':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg";
      case 'usuarios':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg";
      case 'perfil':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-gray-600 to-slate-600 rounded-xl shadow-lg";
      case 'centros':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-lg";
      case 'especialidades':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl shadow-lg";
        case 'empleados':
          return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-gray-600 to-slate-600 rounded-xl shadow-lg";
      default:
        return "w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group";
    }
  }
  
  // Opción inactiva
  return "w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200 group";
};

export const getIconContainerClasses = (
  item: SidebarItem,
  activeItem: SidebarItem
): string => {
  const isActive = item === activeItem;
  
  if (isActive) {
    return "w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3";
  }
  
  // Colores de hover específicos para cada opción
  switch (item) {
    case 'dashboard':
      return "w-10 h-10 bg-gray-700 group-hover:bg-amber-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'consultas':
      return "w-10 h-10 bg-gray-700 group-hover:bg-emerald-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'calendario':
      return "w-10 h-10 bg-gray-700 group-hover:bg-cyan-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'medicos':
      return "w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'usuarios':
      return "w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'perfil':
      return "w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'centros':
      return "w-10 h-10 bg-gray-700 group-hover:bg-teal-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'especialidades':
      return "w-10 h-10 bg-gray-700 group-hover:bg-pink-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
      case 'empleados':
        return "w-10 h-10 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    default:
      return "w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
  }
};

export const getIconClasses = (
  item: SidebarItem,
  activeItem: SidebarItem
): string => {
  const isActive = item === activeItem;
  
  if (isActive) {
    switch (item) {
      case 'dashboard':
        return "h-5 w-5 text-amber-600";
      case 'consultas':
        return "h-5 w-5 text-emerald-600";
      case 'calendario':
        return "h-5 w-5 text-cyan-600";
      case 'medicos':
        return "h-5 w-5 text-blue-600";
      case 'usuarios':
        return "h-5 w-5 text-purple-600";
      case 'perfil':
        return "h-5 w-5 text-gray-600";
      case 'centros':
        return "h-5 w-5 text-teal-600";
      case 'especialidades':
        return "h-5 w-5 text-pink-600";
      case 'empleados':
        return "h-5 w-5 text-gray-600";
      default:
        return "h-5 w-5";
    }
  }
  
  return "h-5 w-5";
};

export const getTextClasses = (
  item: SidebarItem,
  activeItem: SidebarItem
): { main: string; sub: string } => {
  const isActive = item === activeItem;
  
  if (isActive) {
    switch (item) {
      case 'dashboard':
        return {
          main: "font-medium",
          sub: "text-xs text-orange-100"
        };
      case 'consultas':
        return {
          main: "font-medium",
          sub: "text-xs text-green-100"
        };
      case 'calendario':
        return {
          main: "font-medium",
          sub: "text-xs text-indigo-100"
        };
      case 'medicos':
        return {
          main: "font-medium",
          sub: "text-xs text-blue-100"
        };
      case 'usuarios':
        return {
          main: "font-medium",
          sub: "text-xs text-purple-100"
        };
      case 'perfil':
        return {
          main: "font-medium",
          sub: "text-xs text-gray-100"
        };
      case 'centros':
        return {
          main: "font-medium",
          sub: "text-xs text-green-100"
        };
      case 'especialidades':
        return {
          main: "font-medium",
          sub: "text-xs text-purple-100"
        };
      case 'empleados':
        return {
          main: "font-medium",
          sub: "text-xs text-gray-100"
        };
      default:
        return {
          main: "font-medium",
          sub: "text-xs text-gray-400"
        };
    }
  }
  
  return {
    main: "font-medium",
    sub: "text-xs text-gray-400"
  };
};

// Función para obtener los colores de los botones basados en la página activa
export const getButtonColors = (activeItem: SidebarItem): {
  primary: string;
  primaryHover: string;
  primaryFocus: string;
  primaryIcon: string;
} => {
  switch (activeItem) {
    case 'dashboard':
      return {
        primary: 'bg-gradient-to-r from-amber-600 to-orange-600',
        primaryHover: 'hover:from-amber-700 hover:to-orange-700',
        primaryFocus: 'focus:ring-amber-500',
        primaryIcon: 'text-amber-600'
      };
    case 'consultas':
      return {
        primary: 'bg-gradient-to-r from-emerald-600 to-green-600',
        primaryHover: 'hover:from-emerald-700 hover:to-green-700',
        primaryFocus: 'focus:ring-emerald-500',
        primaryIcon: 'text-emerald-600'
      };
    case 'calendario':
      return {
        primary: 'bg-gradient-to-r from-cyan-600 to-blue-600',
        primaryHover: 'hover:from-cyan-700 hover:to-blue-700',
        primaryFocus: 'focus:ring-cyan-500',
        primaryIcon: 'text-cyan-600'
      };
    case 'medicos':
      return {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        primaryHover: 'hover:from-blue-700 hover:to-indigo-700',
        primaryFocus: 'focus:ring-blue-500',
        primaryIcon: 'text-blue-600'
      };
    case 'usuarios':
      return {
        primary: 'bg-gradient-to-r from-purple-600 to-violet-600',
        primaryHover: 'hover:from-purple-700 hover:to-violet-700',
        primaryFocus: 'focus:ring-purple-500',
        primaryIcon: 'text-purple-600'
      };
    case 'centros':
      return {
        primary: 'bg-gradient-to-r from-teal-600 to-emerald-600',
        primaryHover: 'hover:from-teal-700 hover:to-emerald-700',
        primaryFocus: 'focus:ring-teal-500',
        primaryIcon: 'text-teal-600'
      };
    case 'especialidades':
      return {
        primary: 'bg-gradient-to-r from-pink-600 to-rose-600',
        primaryHover: 'hover:from-pink-700 hover:to-rose-700',
        primaryFocus: 'focus:ring-pink-500',
        primaryIcon: 'text-pink-600'
      };
    case 'empleados':
      return {
        primary: 'bg-gradient-to-r from-gray-600 to-slate-600',
        primaryHover: 'hover:from-gray-700 hover:to-slate-700',
        primaryFocus: 'focus:ring-gray-500',
        primaryIcon: 'text-gray-600'
      };
    case 'perfil':
      return {
        primary: 'bg-gradient-to-r from-gray-600 to-slate-600',
        primaryHover: 'hover:from-gray-700 hover:to-slate-700',
        primaryFocus: 'focus:ring-gray-500',
        primaryIcon: 'text-gray-600'
      };
    default:
      return {
        primary: 'bg-gradient-to-r from-amber-600 to-orange-600',
        primaryHover: 'hover:from-amber-700 hover:to-orange-700',
        primaryFocus: 'focus:ring-amber-500',
        primaryIcon: 'text-amber-600'
      };
  }
};
