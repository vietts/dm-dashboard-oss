'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { Character, CachedSpell, ClassResource } from '@/types/database'
import type { LevelUpState, LevelUpUpdates, LevelUpWizardProps } from './types'
import {
  getFeaturesAtLevel,
  getHitDie,
  getHitDieAverage,
  normalizeClassName,
  isSpellcasterAtLevel,
  getNewSpellsKnown,
  SPELL_SLOT_PROGRESSION,
} from '@/lib/class-features'

import { HPStep } from './steps/HPStep'
import { ClassFeaturesStep } from './steps/ClassFeaturesStep'
import { SpellsStep } from './steps/SpellsStep'
import { ConfirmationStep } from './steps/ConfirmationStep'

function getModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

const STEP_TITLES = [
  'Punti Ferita',
  'Abilità di Classe',
  'Incantesimi',
  'Conferma',
]

export function LevelUpWizard({ open, character, onComplete, onCancel }: LevelUpWizardProps) {
  const targetLevel = (character.level ?? 1) + 1
  const normalizedClass = normalizeClassName(character.class || 'fighter')
  const hitDie = getHitDie(normalizedClass)
  const conModifier = getModifier(character.con || 10)

  // Get features for the new level
  const newFeatures = useMemo(() => {
    return getFeaturesAtLevel(normalizedClass, targetLevel)
  }, [normalizedClass, targetLevel])

  // Check if character becomes a spellcaster at this level
  const isSpellcaster = isSpellcasterAtLevel(normalizedClass, targetLevel)
  const wasSpellcaster = isSpellcasterAtLevel(normalizedClass, character.level ?? 1)
  const newSpellsCount = getNewSpellsKnown(normalizedClass, character.level ?? 1, targetLevel)

  // State
  const [state, setState] = useState<LevelUpState>({
    currentStep: 1,
    targetLevel,
    hpRollResult: null,
    hpIncrease: 0,
    useAverage: false,
    newFeatures,
    featureChoices: {},
    selectedSubclass: character.subclass || null,
    selectedFightingStyle: character.fighting_style || null,
    selectedInvocations: (character.eldritch_invocations as string[]) || [],
    newSpells: [],
    newSpellsCount,
    fullHeal: true,
    newResources: [],
  })

  const [availableSpells, setAvailableSpells] = useState<CachedSpell[]>([])
  const [isLoadingSpells, setIsLoadingSpells] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateState = useCallback((updates: Partial<LevelUpState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Determine total steps (skip spells step if not a spellcaster or no new spells)
  const hasSpellStep = isSpellcaster && (newSpellsCount > 0 || !wasSpellcaster)
  const totalSteps = hasSpellStep ? 4 : 3

  // Map current step to actual step number for display
  const getDisplayStep = (step: number): number => {
    if (!hasSpellStep && step >= 3) {
      return step - 1
    }
    return step
  }

  const getActualStep = (displayStep: number): number => {
    if (!hasSpellStep && displayStep >= 3) {
      return displayStep + 1
    }
    return displayStep
  }

  // Navigation
  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.hpRollResult !== null || state.useAverage
      case 2:
        // Check if all required choices are made
        const requiredFeatures = newFeatures.filter(f => f.requiresChoice)
        for (const feature of requiredFeatures) {
          if (feature.choiceType === 'fighting_style' && !state.selectedFightingStyle) {
            return false
          }
          if (feature.choiceType === 'subclass' && !state.selectedSubclass) {
            return false
          }
          if (feature.choiceType === 'invocation') {
            // Warlock at level 2 needs 2 invocations
            const requiredCount = targetLevel === 2 ? 2 : 1
            if (state.selectedInvocations.length < requiredCount) {
              return false
            }
          }
        }
        return true
      case 3:
        // Check if enough spells are selected
        return state.newSpells.length >= newSpellsCount
      case 4:
        return true
      default:
        return false
    }
  }, [state, newFeatures, newSpellsCount, targetLevel])

  const goNext = () => {
    if (state.currentStep === 2 && !hasSpellStep) {
      // Skip to confirmation
      updateState({ currentStep: 4 })
    } else if (state.currentStep < 4) {
      updateState({ currentStep: (state.currentStep + 1) as 1 | 2 | 3 | 4 })
    }
  }

  const goBack = () => {
    if (state.currentStep === 4 && !hasSpellStep) {
      // Skip back to features
      updateState({ currentStep: 2 })
    } else if (state.currentStep > 1) {
      updateState({ currentStep: (state.currentStep - 1) as 1 | 2 | 3 | 4 })
    }
  }

  // Search spells
  const handleSearchSpells = async (query: string) => {
    // This would be implemented in the parent component or via API
    // For now, it's a placeholder
  }

  // Calculate final HP increase
  const calculateHPIncrease = (): number => {
    if (state.useAverage) {
      return getHitDieAverage(hitDie) + conModifier
    }
    return (state.hpRollResult || 0) + conModifier
  }

  // Build class resources based on features
  const buildClassResources = (): ClassResource[] => {
    const currentResources: ClassResource[] = (character.class_resources as ClassResource[]) || []
    const newResources: ClassResource[] = [...currentResources]

    for (const feature of newFeatures) {
      if (feature.grantsResource) {
        const existing = newResources.find(r => r.id === feature.grantsResource!.resourceId)
        if (!existing) {
          newResources.push({
            id: feature.grantsResource.resourceId,
            name: feature.grantsResource.name,
            max: feature.grantsResource.max,
            current: feature.grantsResource.max,
            recharge: feature.grantsResource.recharge,
            class: character.class || 'unknown',
          })
        }
      }
    }

    // Update Lay on Hands pool for Paladins
    const layOnHands = newResources.find(r => r.id === 'lay_on_hands')
    if (layOnHands && normalizedClass === 'paladin') {
      layOnHands.max = targetLevel * 5
      layOnHands.current = targetLevel * 5
    }

    return newResources
  }

  // Submit level up
  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const hpIncrease = calculateHPIncrease()
      const newMaxHP = (character.max_hp ?? 10) + hpIncrease

      const updates: LevelUpUpdates = {
        level: targetLevel,
        max_hp: newMaxHP,
        current_hp: state.fullHeal ? newMaxHP : (character.current_hp ?? 10) + hpIncrease,
        subclass: state.selectedSubclass,
        fighting_style: state.selectedFightingStyle,
        eldritch_invocations: state.selectedInvocations.length > 0 ? state.selectedInvocations : undefined,
        class_resources: buildClassResources(),
        newSpells: state.newSpells.map(spell => ({
          character_id: character.id,
          spell_slug: spell.slug,
          spell_name: spell.name,
          spell_level: spell.level_int || 0,
        })),
      }

      await onComplete(updates)
    } catch (error) {
      console.error('Level up failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Level Up: {character.name}
          </DialogTitle>
          <DialogDescription>
            Livello {character.level} → {targetLevel}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
            const actualStep = getActualStep(step)
            const isCurrent = state.currentStep === actualStep
            const isCompleted = state.currentStep > actualStep

            return (
              <div key={step} className="flex items-center">
                {step > 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isCurrent && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-green-500 text-white',
                    !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step}
                </div>
              </div>
            )
          })}
        </div>

        {/* Step Title */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          {STEP_TITLES[state.currentStep - 1]}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {state.currentStep === 1 && (
            <HPStep
              character={character}
              state={state}
              updateState={updateState}
              hitDie={hitDie}
              conModifier={conModifier}
            />
          )}

          {state.currentStep === 2 && (
            <ClassFeaturesStep
              character={character}
              state={state}
              updateState={updateState}
              features={newFeatures}
            />
          )}

          {state.currentStep === 3 && hasSpellStep && (
            <SpellsStep
              character={character}
              state={state}
              updateState={updateState}
              availableSpells={availableSpells}
              isLoading={isLoadingSpells}
              onSearchSpells={handleSearchSpells}
            />
          )}

          {state.currentStep === 4 && (
            <ConfirmationStep
              character={character}
              state={state}
              updateState={updateState}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
        </div>

        {/* Navigation Buttons - fixed at bottom */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={state.currentStep === 1 ? onCancel : goBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {state.currentStep === 1 ? 'Annulla' : 'Indietro'}
          </Button>

          {state.currentStep < 4 ? (
            <Button onClick={goNext} disabled={!canGoNext}>
              Avanti
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applicando...
                </>
              ) : (
                'Conferma Level Up'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
