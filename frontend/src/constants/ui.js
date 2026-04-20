/**
 * Global UI & Theme Constants
 * Single source of truth for design tokens across the application.
 * Mirrors the Tailwind CSS theme defined in globals.css.
 */

export const THEME = {
  // Brand Colors (Matching globals.css)
  COLORS: {
    BRAND: {
      PRIMARY: '#5EC0C2',     // Brand Teal
      SECONDARY: '#5AB7BC',   // Brand Teal Dark
      ACCENT: '#FFFF00',      // Brand Yellow
      GLOW: '#16F8F9',        // Brand Cyan
      BLACK: '#000000',
    },
    // Neutrals (Standardized naming)
    NEUTRAL: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      950: '#030712',
    },
    // Status
    STATUS: {
      SUCCESS: '#22C55E',
      WARNING: '#F59E0B',
      ERROR: '#EF4444',
      INFO: '#3B82F6',
    }
  },

  // Font Configuration
  FONTS: {
    SANS: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
    MONO: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
  },

  // Standardized Font Sizes (matching typical Tailwind utility equivalents)
  FONT_SIZE: {
    TINY: '9px',      // For table headers, badges
    XSMALL: '10px',   // For secondary text, status
    SMALL: '12px',    // For primary body text in cards
    BASE: '13px',     // Default input and label size
    LARGE: '16px',    // Section headers
    XLARGE: '20px',   // Page titles
    XXLARGE: '24px',  // Featured numbers
  },

  // Spacing & Sizing
  SPACING: {
    GUTTER: '24px',   // Main page padding
    SECTION: '16px',  // Gap between sections
    CARD: '20px',     // Padding inside cards
  },

  // Layout Properties
  RADIUS: {
    SMALL: '4px',
    BASE: '8px',
    LARGE: '12px',
    XLARGE: '16px',
    FULL: '9999px',
  },

  // Animation Transitions
  TRANSITION: {
    DEFAULT: 'all 0.3s ease',
    FAST: 'all 0.15s ease',
    SLOW: 'all 0.5s ease',
  },

  // Layering
  Z_INDEX: {
    BASE: 0,
    HEADER: 50,
    SIDEBAR: 100,
    DROPDOWN: 200,
    MODAL: 1000,
    TOAST: 2000,
  }
};

/**
 * Common Layout Constants
 */
export const LAYOUT = {
  SIDEBAR_WIDTH: '240px',
  HEADER_HEIGHT: '64px',
  MODAL_MAX_WIDTH: '600px',
};
