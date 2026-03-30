// SPCUF Design System - Monochromatic Dark Theme with Accent Colors

export const Colors = {
  // Base Monochrome Palette
  black: {
    deep: '#060606',
    primary: '#101010',
    surface: '#181818',
    card: '#202020',
    elevated: '#282828',
  },
  silver: {
    border: '#2E2E2E',
    dim: '#3C3C3C',
    mid: '#686868',
    light: '#989898',
    bright: '#C2C2C2',
  },
  white: {
    soft: '#E8E8E8',
    pure: '#F8F8F8',
  },
  
  // Accent Color System
  accent: {
    amber: '#C8922A',
    amberGlow: 'rgba(200, 146, 42, 0.12)',
    amberBorder: 'rgba(200, 146, 42, 0.30)',
    
    teal: '#2A8C8C',
    tealGlow: 'rgba(42, 140, 140, 0.10)',
    tealBorder: 'rgba(42, 140, 140, 0.28)',
    
    copper: '#A0622A',
    copperGlow: 'rgba(160, 98, 42, 0.10)',
    copperBorder: 'rgba(160, 98, 42, 0.28)',
    
    crimson: '#9C2A2A',
    crimsonGlow: 'rgba(156, 42, 42, 0.10)',
    crimsonBorder: 'rgba(156, 42, 42, 0.28)',
    
    sage: '#3A7A54',
    sageGlow: 'rgba(58, 122, 84, 0.10)',
    sageBorder: 'rgba(58, 122, 84, 0.28)',
    
    lavender: '#6A5A9C',
    lavenderGlow: 'rgba(106, 90, 156, 0.10)',
    lavenderBorder: 'rgba(106, 90, 156, 0.28)',
    
    steel: '#3A6A8C',
    steelGlow: 'rgba(58, 106, 140, 0.12)',
    steelBorder: 'rgba(58, 106, 140, 0.30)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  small: 2,
  card: 4,
  modal: 6,
  round: 100,
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    light: '300' as any,
    regular: '400' as any,
    medium: '500' as any,
    semibold: '600' as any,
    bold: '700' as any,
    black: '900' as any,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Accent Usage Map
export const AccentUsage = {
  deadlines: Colors.accent.amber,
  legal: Colors.accent.teal,
  documents: Colors.accent.copper,
  critical: Colors.accent.crimson,
  success: Colors.accent.sage,
  resources: Colors.accent.lavender,
  interactive: Colors.accent.steel,
};
