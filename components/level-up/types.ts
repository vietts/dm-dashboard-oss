import type { Character, CachedSpell, ClassResource } from '@/types/database'
import type { ClassFeature, FeatureChoice } from '@/lib/class-features'

// Extended Character type to match client-side CharacterState
export type CharacterForLevelUp = Omit<Character, 'class_resources'> & {
  class_resources: ClassResource[] | null
}

export type LevelUpStep = 1 | 2 | 3 | 4

export interface LevelUpState {
  currentStep: LevelUpStep
  targetLevel: number

  // Step 1: HP
  hpRollResult: number | null
  hpIncrease: number
  useAverage: boolean

  // Step 2: Class Features
  newFeatures: ClassFeature[]
  featureChoices: Record<string, string> // featureId -> choiceId
  selectedSubclass: string | null
  selectedFightingStyle: string | null
  selectedInvocations: string[]

  // Step 3: Spells
  newSpells: CachedSpell[]
  newSpellsCount: number

  // Step 4: Confirmation
  fullHeal: boolean

  // Computed resources
  newResources: ClassResource[]
}

export interface LevelUpWizardProps {
  open: boolean
  character: CharacterForLevelUp
  onComplete: (updates: LevelUpUpdates) => Promise<void>
  onCancel: () => void
}

export interface LevelUpUpdates {
  level: number
  max_hp: number
  current_hp?: number
  subclass?: string | null
  fighting_style?: string | null
  eldritch_invocations?: string[]
  class_resources: ClassResource[]
  newSpells: {
    character_id: string
    spell_slug: string
    spell_name: string
    spell_level: number
  }[]
}

export interface StepProps {
  character: CharacterForLevelUp
  state: LevelUpState
  updateState: (updates: Partial<LevelUpState>) => void
}

// Step component props
export interface HPStepProps extends StepProps {
  hitDie: number
  conModifier: number
}

export interface ClassFeaturesStepProps extends StepProps {
  features: ClassFeature[]
}

export interface SpellsStepProps extends StepProps {
  availableSpells: CachedSpell[]
  isLoading: boolean
  onSearchSpells: (query: string) => void
}

export interface ConfirmationStepProps extends StepProps {
  onConfirm: () => void
  isSubmitting: boolean
}

// Helper function types
export type GetModifier = (score: number) => number
