'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AgileTrackerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function AgileTrackerLogo({ 
  className, 
  size = 'md',
  onClick
}: AgileTrackerLogoProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-28 h-28'
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity duration-200",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative flex-shrink-0",
        sizeClasses[size]
      )}>
        <Image
          src="/agile-tracker-logo.ico"
          alt="Agile Tracker Logo"
          width={size === 'sm' ? 80 : size === 'md' ? 96 : 112}
          height={size === 'sm' ? 80 : size === 'md' ? 96 : 112}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    </div>
  );
}