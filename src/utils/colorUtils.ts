import type { ChartTheme } from '../types/dashboard.types';

/**
 * Default theme with vibrant colors
 */
export const defaultTheme: ChartTheme = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  axisColor: 'rgba(255, 255, 255, 0.7)',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  textColor: '#ffffff',
  colors: [
    '#FF6B6B',  // Coral Red
    '#4ECDC4',  // Turquoise
    '#FFE66D',  // Sunny Yellow
    '#95E1D3',  // Mint Green
    '#A8E6CF',  // Soft Green
    '#FFAAA5',  // Salmon Pink
  ]
};

/**
 * Generate a color with specified opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * Generate gradient colors for chart backgrounds
 */
export function createGradient(
  ctx: CanvasRenderingContext2D,
  startColor: string,
  endColor: string,
  startOpacity = 1,
  endOpacity = 0
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, withOpacity(startColor, startOpacity));
  gradient.addColorStop(1, withOpacity(endColor, endOpacity));
  return gradient;
}

/**
 * Generate contrasting text color based on background
 */
export function getContrastColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Interpolate between two colors
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  // Convert hex to RGB
  const c1 = {
    r: parseInt(color1.slice(1, 3), 16),
    g: parseInt(color1.slice(3, 5), 16),
    b: parseInt(color1.slice(5, 7), 16)
  };
  
  const c2 = {
    r: parseInt(color2.slice(1, 3), 16),
    g: parseInt(color2.slice(3, 5), 16),
    b: parseInt(color2.slice(5, 7), 16)
  };
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}