import React from 'react';
import { Activity, Plus, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onNewConsulta: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNewConsulta }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API de Consultas Médicas</h1>
                <p className="text-sm text-gray-600">Gestión independiente por hospital</p>
              </div>
            </div>
          </div>
          <button
            onClick={onNewConsulta}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Consulta
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
