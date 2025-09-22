import React from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Home
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/', active: true },
    { icon: Activity, label: 'Consultas', href: '/consultas', active: false },
    { icon: Users, label: 'Pacientes', href: '/pacientes', active: false },
    { icon: Calendar, label: 'Citas', href: '/citas', active: false },
    { icon: FileText, label: 'Reportes', href: '/reportes', active: false },
    { icon: Settings, label: 'Configuración', href: '/configuracion', active: false },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header del Sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Activity className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">HospitalApp</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-6 py-8 space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-all duration-200
                    ${item.active 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-6 border-t border-gray-700">
            <button className="flex items-center gap-4 px-4 py-4 w-full text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all duration-200">
              <LogOut className="h-6 w-6" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
