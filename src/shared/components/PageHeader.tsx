import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backText?: string;
  children?: ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  backLink,
  backText = 'Back',
  children 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backLink && (
        <Link 
          to={backLink}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg 
            className="w-4 h-4 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          {backText}
        </Link>
      )}
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {children && (
          <div className="ml-4">{children}</div>
        )}
      </div>
    </div>
  );
} 