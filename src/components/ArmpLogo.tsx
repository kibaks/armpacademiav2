import React from 'react';

export interface ArmpLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isDarkMode?: boolean;
}

/**
 * Official ARMP Logo (Autorité de Régulation des Marchés Publics - RDC)
 * Uses the authentic image file (armp-logo.png) with native transparency,
 * seamlessly embedded ("incrusté") directly onto the background without
 * any enclosing white box or border.
 */
export const ArmpLogo: React.FC<ArmpLogoProps> = ({
  className = '',
  size = 'md',
  isDarkMode = false
}) => {
  const heightClasses = {
    xs: 'h-7 sm:h-8',
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-12 md:h-13',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    '2xl': 'h-28 sm:h-32 md:h-36'
  };

  const currentHeight = heightClasses[size] || 'h-11 sm:h-12';

  return (
    <div 
      className={`inline-flex items-center flex-shrink-0 select-none bg-transparent ${className}`}
      title="Autorité de Régulation des Marchés Publics (ARMP) - République Démocratique du Congo"
    >
      <img
        src="/armp-logo.png"
        alt="Autorité de Régulation des Marchés Publics - ARMP RDC"
        className={`${currentHeight} w-auto object-contain block transition-all duration-200 ${
          isDarkMode ? 'brightness-125 contrast-110 drop-shadow-[0_1px_6px_rgba(255,255,255,0.2)]' : 'drop-shadow-xs'
        }`}
        loading="eager"
        decoding="sync"
      />
    </div>
  );
};
