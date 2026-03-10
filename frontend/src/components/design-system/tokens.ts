/**
 * Design Tokens for SiroMix UI
 * 
 * Centralized design system tokens extracted from Visily designs.
 * All UI components must use these tokens for visual consistency.
 * 
 * DO NOT hardcode colors, spacing, or typography values in components.
 * 
 * IMPORTANT: Values extracted from Visily HTML exports - preserve exact specifications.
 */

// Color Palette (Exact Visily Values)
export const colors = {
  // Brand colors (purple - from Visily clarifications)
  brand: {
    primary: '#9a94de',      // Purple brand - buttons, logo, badges, accents
    light: '#9a94de0d',      // 5% opacity backgrounds
    hover: '#8984d0',        // Slightly darker for hover states
  },

  // Primary palette for compatibility
  primary: {
    DEFAULT: '#9a94de',      // Main brand purple
    50: '#f7f6fe',
    100: '#efedfd',
    200: '#dfdcfb',
    300: '#c9c3f7',
    400: '#b0a7f1',
    500: '#9a94de',         // Brand primary
    600: '#7c3aed',         // Checkbox accent per Visily
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Text colors (from Visily)
  text: {
    dark: '#171a1f',         // Headings, primary content
    gray: '#565d6d',         // Secondary text, labels
    light: '#9095a0',        // Tertiary text
  },

  // Border and backgrounds (from Visily)
  border: '#dee1e6',         // Card borders, dividers, input borders
  background: {
    main: '#fcfcfd',         // Off-white subtle background
    white: '#ffffff',        // Pure white for cards
    gray: '#f5f6f7',         // Gray backgrounds for skeletons
  },

  // Task status colors (exact Visily values)
  status: {
    pending: '#6b7280',      // Gray - pending tasks
    extracting: '#9a94de',   // Purple - processing (changed from blue)
    understanding: '#9a94de', // Purple - processing
    awaiting: '#fcb831',     // Yellow - needs confirmation (Visily warning)
    shuffling: '#9a94de',    // Purple - processing
    generating: '#9a94de',   // Purple - processing
    completed: '#39a85e',    // Green - success (Visily green)
    failed: '#d3595e',       // Red - error (Visily red)
  },

  // Semantic colors (Visily exact values)
  success: '#39a85e',        // Green (from Visily)
  warning: '#fcb831',        // Yellow (from Visily)
  error: '#d3595e',          // Red (from Visily)
  info: '#9a94de',           // Purple brand (changed from blue)
} as const;

// Typography (Visily exact values - Inter font)
export const typography = {
  fontFamily: {
    sans: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Courier New", Courier, monospace',
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: 400,      // Regular (Visily)
    medium: 500,      // Medium (Visily)
    semibold: 600,    // Semibold (Visily)
    bold: 700,        // Bold (Visily)
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  letterSpacing: {
    heading: '-0.02em',   // For headlines (Visily)
    tight: '-0.5px',      // For tight text (Visily)
    normal: '0',
  },
} as const;

// Spacing (4px/8px grid system)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

// Border Radius (Visily context-specific values - DO NOT normalize)
export const borderRadius = {
  sm: '0.25rem',    // 4px - minimal
  md: '0.5rem',     // 8px - inputs (rounded-md in Visily)
  '10px': '10px',   // 10px - cards/logo container (rounded-[10px] in Visily)
  lg: '0.75rem',    // 12px - rounded-lg
  xl: '1rem',       // 16px - large cards (rounded-xl in Visily)
  full: '9999px',   // Fully rounded - avatars, pills
} as const;

// Shadows (Visily exact values - context-specific)
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',  // Tailwind default shadow-sm
  card: '0px 2px 5px 0px #171a1f17, 0px 0px 2px 0px #171a1f1f',  // Custom card shadow (Visily)
  'auth-card': '0px 10px 25px rgba(23, 26, 31, 0.08)',  // Login card shadow (Visily)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

// Breakpoints (desktop-only for MVP)
export const breakpoints = {
  md: '768px',
  lg: '1024px',   // Minimum viewport width for MVP
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index layers
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Page-specific container spacing (Visily exact values - DO NOT normalize per Q5)
// Reference: contracts/pages.md Design System Preservation Rules
export const pageSpacing = {
  homepage: 'px-4 lg:px-[144px]',       // Widest - for hero section
  examDetail: 'px-4 lg:px-[120px]',     // Balanced - for content
  createExam: 'px-4 lg:px-36',          // Medium - for forms
  taskManagement: 'px-4 lg:px-32',      // Tighter - for table density
  login: 'max-w-[560px]',               // Centered card
  preview: 'max-w-[1152px]',            // Wide - for table
} as const;
