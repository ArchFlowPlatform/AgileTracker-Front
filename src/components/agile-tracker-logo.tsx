'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AgileTrackerLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function AgileTrackerLogo({ 
  className, 
  showText = true, 
  size = 'md',
  onClick
}: AgileTrackerLogoProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-28 h-28'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center cursor-pointer hover:opacity-80 transition-all duration-200 p-2 rounded-lg hover:bg-accent/50", 
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
        />
      </div>
      {showText && (
        <span className={cn(
          "text-muted-foreground leading-tight mt-2 text-center",
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          Proof of Concept
        </span>
      )}
    </div>
  );
}