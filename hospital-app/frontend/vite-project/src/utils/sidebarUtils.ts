// utils/sidebarUtils.ts - Utilidades para el sidebar

export type SidebarItem = 'dashboard' | 'consultas' | 'calendario' | 'medicos' | 'usuarios' | 'perfil';

export const getActiveSidebarItem = (pathname: string): SidebarItem => {
  if (pathname.includes('/admin/reportes')) {
    return 'dashboard';
  }
  if (pathname.includes('/consultas')) {
    return 'consultas';
  }
  if (pathname.includes('/calendario')) {
    return 'calendario';
  }
  if (pathname.includes('/admin') && !pathname.includes('/reportes')) {
    return 'medicos';
  }
  if (pathname.includes('/usuarios')) {
    return 'usuarios';
  }
  if (pathname.includes('/perfil')) {
    return 'perfil';
  }
  return 'dashboard'; // Por defecto
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
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg";
      case 'consultas':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg";
      case 'calendario':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg";
      case 'medicos':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg";
      case 'usuarios':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg";
      case 'perfil':
        return "w-full flex items-center px-4 py-3 text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg";
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
      return "w-10 h-10 bg-gray-700 group-hover:bg-orange-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'consultas':
      return "w-10 h-10 bg-gray-700 group-hover:bg-green-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'calendario':
      return "w-10 h-10 bg-gray-700 group-hover:bg-cyan-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'medicos':
      return "w-10 h-10 bg-gray-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'usuarios':
      return "w-10 h-10 bg-gray-700 group-hover:bg-purple-600 rounded-lg flex items-center justify-center mr-3 transition-colors";
    case 'perfil':
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
        return "h-5 w-5 text-orange-600";
      case 'consultas':
        return "h-5 w-5 text-green-600";
      case 'calendario':
        return "h-5 w-5 text-cyan-600";
      case 'medicos':
        return "h-5 w-5 text-blue-600";
      case 'usuarios':
        return "h-5 w-5 text-purple-600";
      case 'perfil':
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
