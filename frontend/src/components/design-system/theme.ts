/**
 * Theme Configuration for SiroMix UI
 * 
 * Extends Tailwind CSS theme with custom design tokens.
 * Import this in tailwind.config.js to apply design system.
 * Updated with purple #9a94de brand and exact Visily values.
 */

import { colors, spacing, borderRadius, shadows, breakpoints, zIndex, typography } from './tokens';

export const theme = {
  colors: {
    // Override Tailwind defaults with our design tokens
    primary: colors.primary,        // Purple #9a94de (Visily brand)
    brand: colors.brand,            // Brand object for purple variants
    text: colors.text,              // Text color tokens (dark, gray, light)
    border: colors.border,          // Border color #dee1e6
    background: colors.background,   // Background colors (main, white, gray)
    
    // Keep semantic colors
    success: { DEFAULT: colors.success },
    warning: { DEFAULT: colors.warning },
    error: { DEFAULT: colors.error },
    info: { DEFAULT: colors.info },
    
    // Task status colors (custom utility classes)
    status: colors.status,
  },

  fontFamily: {
    sans: typography.fontFamily.sans.split(','),
    mono: typography.fontFamily.mono.split(','),
  },

  fontWeight: typography.fontWeight,

  letterSpacing: typography.letterSpacing,

  spacing: {
    // Extend default spacing with our grid system
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    '2xl': spacing['2xl'],
    '3xl': spacing['3xl'],
  },

  borderRadius: {
    sm: borderRadius.sm,
    md: borderRadius.md,
    '10px': borderRadius['10px'],    // Visily card/logo radius
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    full: borderRadius.full,
  },

  boxShadow: {
    sm: shadows.sm,
    card: shadows.card,              // Visily custom card shadow
    'auth-card': shadows['auth-card'], // Visily login card shadow
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
  },

  screens: {
    md: breakpoints.md,
    lg: breakpoints.lg,
    xl: breakpoints.xl,
    '2xl': breakpoints['2xl'],
  },

  zIndex: {
    dropdown: zIndex.dropdown.toString(),
    sticky: zIndex.sticky.toString(),
    fixed: zIndex.fixed.toString(),
    'modal-backdrop': zIndex.modalBackdrop.toString(),
    modal: zIndex.modal.toString(),
    popover: zIndex.popover.toString(),
    tooltip: zIndex.tooltip.toString(),
  },
} as const;

export default theme;
