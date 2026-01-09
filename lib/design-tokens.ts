/**
 * Design Tokens - DM Dashboard
 * Based on D&D Beyond best practices and cartographic parchment theme
 *
 * Usage:
 * import { TYPOGRAPHY, SPACING, COLORS } from '@/lib/design-tokens'
 * className={TYPOGRAPHY.cardTitle}
 */

/**
 * SPACING SCALE
 * Based on 4px base unit (0.25rem)
 * Use these values for consistent spacing throughout the app
 */
export const SPACING = {
  xs: '0.25rem',   // 4px  - tight gaps, minimal spacing
  sm: '0.5rem',    // 8px  - standard gap between elements
  md: '1rem',      // 16px - section spacing, card padding
  lg: '1.5rem',    // 24px - major section spacing
  xl: '2rem',      // 32px - page-level spacing
} as const

/**
 * TYPOGRAPHY CLASSES
 * Standardized text styles for consistent hierarchy
 */
export const TYPOGRAPHY = {
  // Font sizes with semantic line heights
  xs: 'text-xs',      // 12px - meta info, tags, counts
  sm: 'text-sm',      // 14px - body text, descriptions
  base: 'text-base',  // 16px - primary content
  lg: 'text-lg',      // 18px - section headers
  xl: 'text-xl',      // 20px - card titles
  '2xl': 'text-2xl',  // 24px - page headers, stats

  // Line heights
  tight: 'leading-tight',    // 1.25 - titles, headers
  normal: 'leading-normal',  // 1.5 - body text
  relaxed: 'leading-relaxed', // 1.625 - readable paragraphs

  // Font weights
  weightNormal: 'font-normal',     // 400
  weightMedium: 'font-medium',     // 500
  weightSemibold: 'font-semibold', // 600
  weightBold: 'font-bold',         // 700
  weightExtrabold: 'font-extrabold', // 800

  // Composite styles (commonly used combinations)
  cardTitle: 'text-lg font-bold leading-tight',
  sectionHeader: 'text-xl font-display font-bold',
  body: 'text-sm leading-relaxed',
  metaInfo: 'text-xs text-[var(--ink-light)]',
  stat: 'text-2xl font-bold font-display',
} as const

/**
 * SEMANTIC COLORS
 * CSS custom properties and hex values
 */
export const COLORS = {
  // Theme colors (CSS variables from globals.css)
  primary: 'var(--teal)',
  danger: 'var(--coral)',
  warning: 'var(--amber-dark)',
  success: 'var(--health-full)',

  // Text colors
  ink: 'var(--ink)',
  inkLight: 'var(--ink-light)',
  inkFaded: 'var(--ink-faded)',

  // Background colors
  paper: 'var(--paper)',
  cream: 'var(--cream)',
  creamDark: 'var(--cream-dark)',

  // Action type colors (for badges, buttons)
  action: 'var(--teal)',
  bonusAction: '#2563eb',  // blue-600
  reaction: '#9333ea',     // purple-600
  other: '#6b7280',        // gray-500

  // HP status colors
  hpFull: 'var(--health-full)',
  hpMid: 'var(--health-mid)',
  hpLow: 'var(--health-low)',

  // Spell school colors (D&D Beyond style)
  schools: {
    abjuration: '#2563eb',     // blue-600
    conjuration: '#9333ea',    // purple-600
    divination: '#4f46e5',     // indigo-600
    enchantment: '#ec4899',    // pink-600
    evocation: '#dc2626',      // red-600
    illusion: '#7c3aed',       // violet-600
    necromancy: '#1f2937',     // gray-800
    transmutation: '#059669',  // green-600
  },
} as const

/**
 * SHADOWS
 * Elevation levels for depth hierarchy
 */
export const SHADOW = {
  none: 'shadow-none',
  sm: 'shadow-sm',   // 0 2px 4px rgba(42, 37, 32, 0.08)
  md: 'shadow-md',   // 0 4px 12px rgba(42, 37, 32, 0.12)
  lg: 'shadow-lg',   // 0 8px 24px rgba(42, 37, 32, 0.15)
  xl: 'shadow-xl',   // 0 16px 48px rgba(42, 37, 32, 0.2)
} as const

/**
 * TRANSITIONS
 * Standard animation durations
 */
export const TRANSITION = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
} as const

/**
 * HELPER FUNCTIONS
 */

/**
 * Get spell school color by name
 */
export function getSpellSchoolColor(school: string | undefined): string {
  if (!school) return COLORS.inkFaded
  const normalized = school.toLowerCase().trim() as keyof typeof COLORS.schools
  return COLORS.schools[normalized] || COLORS.inkFaded
}

/**
 * Get action type color by type
 */
export function getActionTypeColor(type: 'action' | 'bonus_action' | 'reaction' | 'other'): string {
  const colorMap = {
    action: COLORS.action,
    bonus_action: COLORS.bonusAction,
    reaction: COLORS.reaction,
    other: COLORS.other,
  }
  return colorMap[type] || COLORS.other
}

/**
 * Get HP color based on percentage
 */
export function getHPColor(current: number, max: number): string {
  const percentage = (current / max) * 100
  if (percentage <= 25) return COLORS.hpLow
  if (percentage <= 50) return COLORS.hpMid
  return COLORS.hpFull
}
