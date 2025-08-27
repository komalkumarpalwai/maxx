import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallback = null 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const classes = `${sizes[size]} rounded-full object-cover ${className}`;

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={classes}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={`${classes} bg-secondary-200 flex items-center justify-center text-secondary-600`}>
      {fallback || <User className="w-1/2 h-1/2" />}
    </div>
  );
};

export default Avatar;



