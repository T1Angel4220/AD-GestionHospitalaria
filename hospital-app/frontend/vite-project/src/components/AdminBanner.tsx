import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminBannerProps {
  className?: string;
  backgroundColor?: string;
  iconBackgroundColor?: string;
  icon: LucideIcon;
  roleText: string;
}

export const AdminBanner: React.FC<AdminBannerProps> = ({ 
  className = '', 
  backgroundColor = 'bg-green-600',
  iconBackgroundColor = 'bg-green-700',
  icon: Icon,
  roleText = 'Administrador'
}) => {
  return (
    <div className={`${backgroundColor} px-4 py-2 rounded-lg flex items-center justify-between ${className}`}>
      <span className="text-white font-medium text-sm">{roleText}</span>
      <div className={`w-8 h-8 ${iconBackgroundColor} rounded-full flex items-center justify-center`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </div>
  );
};
