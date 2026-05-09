interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  light?: boolean;
}

export const Loader = ({ size = 'md', className = '', light = false }: LoaderProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-slate-200 ${
        light ? 'border-t-white' : 'border-t-primary-500'
      } ${sizeClasses[size]} ${className}`}
    />
  );
};
