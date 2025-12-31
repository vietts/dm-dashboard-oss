'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Swords, BookOpen, Wand2 } from 'lucide-react'
import type { ClassFeaturesStepProps } from '../types'
import type { ClassFeature } from '@/lib/class-features'

function getFeatureIcon(choiceType?: string) {
  switch (choiceType) {
    case 'fighting_style':
      return <Swords className="w-4 h-4" />
    case 'subclass':
      return <BookOpen className="w-4 h-4" />
    case 'invocation':
      return <Wand2 className="w-4 h-4" />
    default:
      return <Sparkles className="w-4 h-4" />
  }
}

export function ClassFeaturesStep({ character, state, updateState, features }: ClassFeaturesStepProps) {
  // Separate features into automatic and choice-required
  const automaticFeatures = features.filter(f => !f.requiresChoice)
  const choiceFeatures = features.filter(f => f.requiresChoice)

  const handleFightingStyleChange = (value: string) => {
    updateState({ selectedFightingStyle: value })
  }

  const handleSubclassChange = (value: string) => {
    updateState({ selectedSubclass: value })
  }

  const handleInvocationToggle = (invocationId: string, checked: boolean) => {
    if (checked) {
      // Warlock at level 2 can have max 2 invocations
      const maxInvocations = state.targetLevel === 2 ? 2 : state.selectedInvocations.length + 1
      if (state.selectedInvocations.length < maxInvocations) {
        updateState({
          selectedInvocations: [...state.selectedInvocations, invocationId]
        })
      }
    } else {
      updateState({
        selectedInvocations: state.selectedInvocations.filter(id => id !== invocationId)
      })
    }
  }

  if (features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Nessuna nuova abilità</p>
        <p className="text-sm text-muted-foreground">
          Al livello {state.targetLevel} non ottieni nuove abilità di classe.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Automatic Features */}
      {automaticFeatures.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Nuove Abilità
          </h3>
          {automaticFeatures.map(feature => (
            <Card key={feature.id} className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getFeatureIcon()}
                  {feature.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                {feature.grantsResource && (
                  <Badge variant="secondary" className="mt-2">
                    Risorsa: {feature.grantsResource.name} ({feature.grantsResource.max}x / riposo {feature.grantsResource.recharge === 'short' ? 'breve' : 'lungo'})
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Choice Features */}
      {choiceFeatures.map(feature => (
        <div key={feature.id} className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            {getFeatureIcon(feature.choiceType)}
            {feature.name}
            <Badge variant="outline">Scelta richiesta</Badge>
          </h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>

          {/* Fighting Style Selection */}
          {feature.choiceType === 'fighting_style' && feature.choices && (
            <RadioGroup
              value={state.selectedFightingStyle || ''}
              onValueChange={handleFightingStyleChange}
              className="grid grid-cols-1 gap-2"
            >
              {feature.choices.map(choice => (
                <div key={choice.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={choice.id} id={choice.id} className="mt-1" />
                  <Label htmlFor={choice.id} className="flex-1 cursor-pointer">
                    <span className="font-medium">{choice.name}</span>
                    <p className="text-sm text-muted-foreground">{choice.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Subclass Selection */}
          {feature.choiceType === 'subclass' && feature.choices && (
            <RadioGroup
              value={state.selectedSubclass || ''}
              onValueChange={handleSubclassChange}
              className="grid grid-cols-1 gap-2"
            >
              {feature.choices.map(choice => (
                <Card
                  key={choice.id}
                  className={`cursor-pointer transition-colors ${
                    state.selectedSubclass === choice.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleSubclassChange(choice.id)}
                >
                  <CardContent className="flex items-start space-x-3 pt-4">
                    <RadioGroupItem value={choice.id} id={`sub-${choice.id}`} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={`sub-${choice.id}`} className="cursor-pointer">
                        <span className="font-medium text-base">{choice.name}</span>
                        <p className="text-sm text-muted-foreground mt-1">{choice.description}</p>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          )}

          {/* Invocation Selection (Warlock) */}
          {feature.choiceType === 'invocation' && feature.choices && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Seleziona {state.targetLevel === 2 ? '2' : '1'} invocazione
                {state.targetLevel === 2 ? 'i' : 'e'}
                <span className="text-muted-foreground ml-2">
                  ({state.selectedInvocations.length}/{state.targetLevel === 2 ? 2 : 1})
                </span>
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                {feature.choices.map(choice => {
                  const isSelected = state.selectedInvocations.includes(choice.id)
                  const maxReached = state.selectedInvocations.length >= (state.targetLevel === 2 ? 2 : 1)

                  return (
                    <div
                      key={choice.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : maxReached
                          ? 'opacity-50'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <Checkbox
                        id={`inv-${choice.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleInvocationToggle(choice.id, checked as boolean)
                        }
                        disabled={!isSelected && maxReached}
                      />
                      <Label htmlFor={`inv-${choice.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{choice.name}</span>
                        <p className="text-sm text-muted-foreground">{choice.description}</p>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
