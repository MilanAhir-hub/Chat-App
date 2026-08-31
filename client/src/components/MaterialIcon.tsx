import React from 'react';

interface MaterialIconProps {
  icon: string;
  size?: number | string;
  className?: string;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ icon, size, className = '' }) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {icon}
    </span>
  );
};
