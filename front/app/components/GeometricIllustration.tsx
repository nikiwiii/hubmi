import React from 'react';
import { ShapeType, ColorTheme } from '../lib/types';

interface GeometricIllustrationProps {
  shape: ShapeType;
  theme: ColorTheme;
  className?: string;
  size?: number;
}

export const GeometricIllustration: React.FC<GeometricIllustrationProps> = ({
  shape,
  theme,
  className = '',
  size = 120
}) => {
  // Accent colors for shapes based on theme
  const getFillColors = () => {
    switch (theme) {
      case 'yellow':
        return { primary: '#B8A61E', secondary: '#968612', accent: '#E0CC34' };
      case 'slate':
        return { primary: '#7C7F75', secondary: '#6B6E64', accent: '#B8BBB2' };
      case 'lavender':
        return { primary: '#7A8DF0', secondary: '#6074E4', accent: '#CCD5FC' };
      case 'sage':
        return { primary: '#6FA488', secondary: '#5A8E73', accent: '#C0E2D1' };
      case 'lilac':
        return { primary: '#A65BF0', secondary: '#8934E0', accent: '#EAD1FD' };
      case 'pink':
        return { primary: '#E46788', secondary: '#CF4C6F', accent: '#FDD5E0' };
      case 'cyan':
        return { primary: '#0284C7', secondary: '#0369A1', accent: '#BAE6FD' };
      default:
        return { primary: '#71717A', secondary: '#52525B', accent: '#E4E4E7' };
    }
  };

  const { primary, secondary, accent } = getFillColors();

  switch (shape) {
    case 'donut':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <circle cx="50" cy="50" r="42" fill={primary} fillOpacity="0.85" />
          <circle cx="50" cy="50" r="20" fill="currentColor" className="text-current opacity-90" />
        </svg>
      );

    case 'v-shape':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <path
            d="M20 25 L45 80 L75 80 L92 35 L76 35 L60 70 L48 40 L38 25 Z"
            fill={primary}
            fillOpacity="0.85"
          />
          <rect x="18" y="45" width="22" height="35" rx="4" fill={secondary} fillOpacity="0.75" />
        </svg>
      );

    case 'cloud':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <path
            d="M22 65 C22 52 32 45 42 45 C46 36 56 30 68 32 C78 34 86 42 86 52 C91 56 94 62 92 68 C90 74 84 78 78 78 L26 78 C18 78 14 72 16 66 C18 64 20 64 22 65 Z"
            fill={primary}
            fillOpacity="0.8"
          />
          <path
            d="M30 75 C30 65 38 60 48 60 C55 52 64 52 70 57 C76 62 76 70 74 75 Z"
            fill={accent}
            fillOpacity="0.6"
          />
        </svg>
      );

    case 'crescent':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <path
            d="M48 18 C32 18 20 32 20 50 C20 68 32 82 48 82 L48 18 Z"
            fill={primary}
            fillOpacity="0.85"
          />
          <path
            d="M56 22 C68 28 78 40 76 56 C74 70 63 80 54 82 L54 22 Z"
            fill={accent}
            fillOpacity="0.9"
          />
        </svg>
      );

    case 'wave':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <ellipse cx="50" cy="50" rx="38" ry="32" fill={primary} fillOpacity="0.8" />
          <ellipse cx="50" cy="62" rx="30" ry="18" fill={accent} fillOpacity="0.8" />
          <ellipse cx="50" cy="70" rx="18" ry="9" fill={secondary} fillOpacity="0.6" />
        </svg>
      );

    case 'diamond':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 hover:scale-105 ${className}`}
        >
          <rect
            x="50"
            y="14"
            width="50"
            height="50"
            rx="12"
            transform="rotate(45 50 14)"
            fill={primary}
            fillOpacity="0.85"
          />
          <circle cx="50" cy="50" r="14" fill={accent} fillOpacity="0.75" />
        </svg>
      );
  }
};
