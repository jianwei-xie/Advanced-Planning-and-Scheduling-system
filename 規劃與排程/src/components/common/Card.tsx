import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ title, children, padding = 'md', className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${paddingStyles[padding]} ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
}
