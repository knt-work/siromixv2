/**
 * Theme Configuration for SiroMix UI
 * 
 * Extends Tailwind CSS theme with custom design tokens.
 * Import this in tailwind.config.js to apply design system.
 */

import { colors, spacing, borderRadius, shadows, breakpoints, zIndex } from './tokens';

export const theme = {
  colors: {
    // Override Tailwind defaults with our design tokens
    primary: colors.primary,
    gray: colors.gray,
    success: { DEFAULT: colors.success },
    warning: { DEFAULT: colors.warning },
    error: { DEFAULT: colors.error },
    info: { DEFAULT: colors.info },
    
    // Task status colors (custom utility classes)
    status: colors.status,
  },

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
    lg: borderRadius.lg,
    full: borderRadius.full,
  },

  boxShadow: {
    sm: shadows.sm,
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
