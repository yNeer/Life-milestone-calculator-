import React from 'react';

interface Props {
  className?: string;
}

const Logo: React.FC<Props> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="text-skin-border opacity-30" />
      <path d="M50 15 V50 L75 75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-skin-primary" />
      <circle cx="50" cy="50" r="8" fill="currentColor" className="text-skin-primary" />
      <circle cx="85" cy="50" r="5" fill="currentColor" className="text-amber-500 animate-pulse" />
    </svg>
  );
};

export default Logo;