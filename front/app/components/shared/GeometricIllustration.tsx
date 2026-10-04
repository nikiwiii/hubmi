import React from 'react';
import { ShapeType, ColorTheme } from '../../lib/types';

interface GeometricIllustrationProps {
  shape: ShapeType;
  theme: ColorTheme;
  className?: string;
  size?: number;
  alt?: string;
  ariaHidden?: boolean;
}

export const GeometricIllustration: React.FC<GeometricIllustrationProps> = ({
  shape,
  theme,
  className = '',
  size = 110,
  alt,
  ariaHidden = true,
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
  const ariaProps = alt
    ? { role: "img", "aria-label": alt }
    : { "aria-hidden": true };

  return (
    <svg
      {...ariaProps}
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
};
