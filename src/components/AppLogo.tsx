import React from 'react';
import { GENERATED_ASSETS } from '../data/masterSpecScript';
import { ResilientImage } from './ResilientImage';

export interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  imageClassName = '',
  textClassName = '',
  onClick
}) => {
  const sizeConfig = {
    xs: {
      img: 'h-5 w-auto max-w-[65px] rounded-xs',
      text: 'text-xs tracking-wider',
      gap: 'gap-1.5'
    },
    sm: {
      img: 'h-7 w-auto max-w-[90px] rounded-sm',
      text: 'text-sm font-bold tracking-wider',
      gap: 'gap-2'
    },
    md: {
      img: 'h-8 sm:h-9 w-auto max-w-[120px] rounded',
      text: 'text-base sm:text-lg font-extrabold tracking-wider',
      gap: 'gap-2.5'
    },
    lg: {
      img: 'h-11 sm:h-12 w-auto max-w-[160px] rounded-md',
      text: 'text-xl sm:text-2xl font-extrabold tracking-widest',
      gap: 'gap-3'
    }
  };

  const current = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${current.gap} shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${className}`}
    >
      <div className="relative overflow-hidden rounded shadow-sm border border-[#8A8A8A]/30 bg-[#181818]/80 flex items-center justify-center">
        <ResilientImage
          src={GENERATED_ASSETS.logo}
          fallbackSrc={GENERATED_ASSETS.logoFallback}
          alt="2paraglide logo"
          fallbackLabel="2P"
          className={`${current.img} object-contain ${imageClassName}`}
        />
      </div>

      {showText && (
        <span
          className={`font-display text-[#FFFFFF] uppercase whitespace-nowrap ${current.text} ${textClassName}`}
        >
          2PARAGLIDE
        </span>
      )}
    </div>
  );
};
