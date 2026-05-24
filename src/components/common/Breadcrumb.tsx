import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  showHome = true,
  className = "" 
}) => {
  const allItems = showHome 
    ? [{ label: 'Trang chủ', path: '/' }, ...items]
    : items;

  return (
    <nav className={`flex items-center gap-1.5 text-sm ${className}`}>
      {allItems.map((item, idx) => {
        const isLast = idx === allItems.length - 1;
        const isFirst = idx === 0;
        
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight size={14} className="text-gray-300 mx-0.5 flex-shrink-0" />
            )}
            
            {isLast || !item.path ? (
              <span 
                className={`font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] ${
                  isLast ? 'text-gray-900' : 'text-gray-500'
                }`}
                title={item.label}
              >
                {isFirst && showHome && (
                  <Home size={14} className="inline -mt-0.5 mr-1" />
                )}
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.path} 
                className="text-gray-500 hover:text-amber-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                title={item.label}
              >
                {isFirst && showHome && (
                  <Home size={14} className="inline -mt-0.5 mr-1" />
                )}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
