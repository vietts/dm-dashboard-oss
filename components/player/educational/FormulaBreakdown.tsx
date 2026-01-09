/**
 * Formula Breakdown Component
 *
 * Generic component for displaying any D&D formula with a breakdown of values.
 * Used for spell DC, spell attack bonus, saving throws, etc.
 *
 * Shows:
 * - Formula title
 * - General formula description
 * - Breakdown of each component with values
 * - Total result
 * - Optional additional info (class, ability, etc.)
 */

import type { AbilityColorScheme } from '@/lib/ability-colors'

interface BreakdownItem {
  label: string                      // Description (e.g., "Mod. CAR")
  value: number                      // Numeric value
  color?: AbilityColorScheme         // Optional color scheme for ability-based items
}

interface FormulaBreakdownProps {
  title: string                      // Formula title (e.g., "CD Tiro Salvezza Incantesimi")
  formula: string                    // Formula description (e.g., "8 + mod. Incantatore + Competenza")
  breakdown: BreakdownItem[]         // Array of breakdown items
  total: number                      // Final calculated value
  characterClass?: string            // Optional character class
  additionalInfo?: React.ReactNode   // Optional additional information
}

export default function FormulaBreakdown({
  title,
  formula,
  breakdown,
  total,
  characterClass,
  additionalInfo,
}: FormulaBreakdownProps) {
  return (
    <div className="formula-breakdown p-3 min-w-[280px]">
      {/* Header */}
      <div className="font-semibold text-sm mb-2 text-[var(--cream)]">{title}</div>

      {/* Formula generale */}
      <div className="formula bg-white/10 p-2 rounded text-xs font-mono mb-3 text-[var(--cream)]">
        {formula}
      </div>

      {/* Breakdown valori reali */}
      <div className="breakdown space-y-2">
        <div className="text-xs font-semibold text-[var(--cream)]/80 mb-2">
          Con il tuo personaggio:
        </div>

        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className={item.color ? 'text-[var(--teal-light)]' : 'text-[var(--cream)]/80'}>{item.label}</span>
            <span className="font-bold font-mono text-[var(--cream)]">
              {item.value >= 0 ? '+' : ''}
              {item.value}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="border-t border-[var(--cream)]/30 pt-2 mt-2 flex justify-between items-center font-bold">
          <span className="text-[var(--cream)]">TOTALE</span>
          <span className="text-[var(--teal-light)] font-mono text-base">{total}</span>
        </div>
      </div>

      {/* Class info */}
      {characterClass && (
        <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80">
          <div className="font-semibold text-[var(--cream)]">Classe: {characterClass}</div>
        </div>
      )}

      {/* Additional info */}
      {additionalInfo && (
        <div className="mt-3 pt-3 border-t border-[var(--cream)]/30 text-xs text-[var(--cream)]/80">
          {additionalInfo}
        </div>
      )}
    </div>
  )
}

/**
 * Helper function to format ability modifier display
 */
export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

/**
 * Pre-built formula configurations for common D&D calculations
 */

interface FormulaConfig {
  title: string
  formula: string
}

export const FORMULA_CONFIGS: Record<string, FormulaConfig> = {
  spellSaveDC: {
    title: 'CD Tiro Salvezza Incantesimi',
    formula: '8 + mod. Incantatore + Competenza',
  },
  spellAttack: {
    title: 'Bonus Attacco con Incantesimo',
    formula: 'mod. Incantatore + Competenza',
  },
  weaponAttack: {
    title: 'Bonus Attacco con Arma',
    formula: 'mod. FOR/DES + Competenza (se competente)',
  },
  savingThrow: {
    title: 'Tiro Salvezza',
    formula: 'd20 + mod. Caratteristica + Competenza (se competente)',
  },
  abilityCheck: {
    title: 'Prova di Abilità',
    formula: 'd20 + mod. Caratteristica + Competenza (se competente)',
  },
  initiative: {
    title: 'Iniziativa',
    formula: 'd20 + mod. DES',
  },
  armorClass: {
    title: 'Classe Armatura',
    formula: '10 + mod. DES + bonus armatura',
  },
}
