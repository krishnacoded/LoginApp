import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-5xl md:text-6xl',
  };

  const starSizes = {
    sm: '-top-1.5 left-[1.5px] text-[7px]',
    md: '-top-2.5 left-[2.5px] text-[9px] md:text-[10px]',
    lg: '-top-4 left-[4px] text-xs md:text-sm',
    xl: '-top-5.5 left-[5.5px] text-base md:text-lg',
  };

  return (
    <div className={`relative font-bold tracking-tight select-none flex items-center filter drop-shadow-[0_2px_8px_rgba(0,17,51,0.85)] ${sizeClasses[size]} ${className}`}>
      {/* Gradient Text for "Peop" */}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#FFE264] to-[#F2A900]">
        Peop
      </span>
      {/* The letter 'l' with the 4-pointed star above it */}
      <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-white via-[#FFE264] to-[#F2A900]">
        <span className={`absolute ${starSizes[size]} text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse`}>
          ✦
        </span>
        l
      </span>
      {/* The remainder "eFlow" */}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F2A900] via-[#FFE264] to-white">
        eFlow
      </span>
    </div>
  );
}
