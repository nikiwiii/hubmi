import React from 'react';
import { ShapeType, ColorTheme } from '../../lib/types';

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
  size = 110
}) => {
  // Sophisticated, subtle matte palette
  const getFillColors = () => {
    switch (theme) {
      case 'yellow':
        return { primary: '#B8A663', secondary: '#968545', accent: '#FAF3D7' };
      case 'slate':
        return { primary: '#86887F', secondary: '#6B6C64', accent: '#EDECE6' };
      case 'lavender':
        return { primary: '#7C89B8', secondary: '#5E6B99', accent: '#ECF0FA' };
      case 'sage':
        return { primary: '#76927E', secondary: '#58735F', accent: '#EBF2ED' };
      case 'lilac':
        return { primary: '#8E77A3', secondary: '#705A85', accent: '#F3ECF7' };
      case 'pink':
        return { primary: '#A6737E', secondary: '#8A5661', accent: '#F8ECEF' };
      case 'cyan':
        return { primary: '#698B99', secondary: '#4D6F7C', accent: '#EAF3F6' };
      default:
        return { primary: '#797A7C', secondary: '#5A5B5C', accent: '#EBECEE' };
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <circle cx="50" cy="50" r="40" fill={primary} fillOpacity="0.75" />
          <circle cx="50" cy="50" r="19" fill={accent} fillOpacity="0.95" />
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <path
            d="M22 28 L46 78 L72 78 L90 38 L76 38 L60 68 L50 42 L40 28 Z"
            fill={primary}
            fillOpacity="0.75"
          />
          <rect x="20" y="46" width="20" height="32" rx="3" fill={secondary} fillOpacity="0.65" />
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <path
            d="M24 64 C24 53 33 46 42 46 C46 38 55 33 66 35 C75 37 83 44 83 53 C88 57 91 63 89 68 C87 73 82 76 76 76 L28 76 C20 76 17 71 18 65 C20 63 22 63 24 64 Z"
            fill={primary}
            fillOpacity="0.7"
          />
          <path
            d="M32 74 C32 65 39 61 48 61 C54 54 62 54 68 58 C73 63 73 70 71 74 Z"
            fill={accent}
            fillOpacity="0.7"
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <path
            d="M48 20 C33 20 22 33 22 50 C22 67 33 80 48 80 L48 20 Z"
            fill={primary}
            fillOpacity="0.75"
          />
          <path
            d="M56 24 C67 30 76 41 74 55 C72 68 62 78 54 80 L54 24 Z"
            fill={accent}
            fillOpacity="0.85"
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <ellipse cx="50" cy="50" rx="36" ry="30" fill={primary} fillOpacity="0.7" />
          <ellipse cx="50" cy="61" rx="28" ry="17" fill={accent} fillOpacity="0.7" />
          <ellipse cx="50" cy="69" rx="17" ry="8" fill={secondary} fillOpacity="0.5" />
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
          className={`transition-transform duration-300 hover:scale-103 ${className}`}
        >
          <rect
            x="50"
            y="16"
            width="46"
            height="46"
            rx="10"
            transform="rotate(45 50 16)"
            fill={primary}
            fillOpacity="0.75"
          />
          <circle cx="50" cy="50" r="12" fill={accent} fillOpacity="0.8" />
        </svg>
      );
  }
};
