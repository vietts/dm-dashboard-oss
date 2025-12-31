'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Heart,
  Sparkles,
  Swords,
  BookOpen,
  Wand2,
  ArrowRight,
  Check,
} from 'lucide-react'
import { getHitDie, getHitDieAverage, normalizeClassName, FIGHTING_STYLES, ARCANE_TRADITIONS, ELDRITCH_INVOCATIONS } from '@/lib/class-features'
import type { ConfirmationStepProps } from '../types'

function getChoiceName(choiceType: string, choiceId: string): string {
  switch (choiceType) {
    case 'fighting_style':
      return FIGHTING_STYLES.find(f => f.id === choiceId)?.name || choiceId
    case 'subclass':
      return ARCANE_TRADITIONS.find(t => t.id === choiceId)?.name || choiceId
    case 'invocation':
      return ELDRITCH_INVOCATIONS.find(i => i.id === choiceId)?.name || choiceId
    default:
      return choiceId
  }
}

export function ConfirmationStep({ character, state, updateState }: ConfirmationStepProps) {
  const normalizedClass = normalizeClassName(character.class || 'fighter')
  const hitDie = getHitDie(normalizedClass)
  const conModifier = Math.floor(((character.con || 10) - 10) / 2)

  // Calculate HP
  const hpRoll = state.useAverage ? getHitDieAverage(hitDie) : (state.hpRollResult || 0)
  const hpIncrease = hpRoll + conModifier
  const newMaxHP = character.max_hp + hpIncrease

  // Get automatic features
  const automaticFeatures = state.newFeatures.filter(f => !f.requiresChoice)

  return (
    <div className="space-y-6">
      {/* Level Change Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4 text-2xl font-bold">
            <span>Livello {character.level}</span>
            <ArrowRight className="w-6 h-6 text-primary" />
            <span className="text-primary">Livello {state.targetLevel}</span>
          </div>
        </CardContent>
      </Card>

      {/* HP Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Punti Ferita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-muted-foreground">
                {hpRoll} (d{hitDie}{state.useAverage ? ' media' : ''}) + {conModifier} (COS)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{character.max_hp} → {newMaxHP}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                +{hpIncrease} HP
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Summary */}
      {(automaticFeatures.length > 0 || state.selectedFightingStyle || state.selectedSubclass || state.selectedInvocations.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Abilità
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Automatic Features */}
            {automaticFeatures.map(feature => (
              <div key={feature.id} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium">{feature.name}</span>
              </div>
            ))}

            {/* Fighting Style */}
            {state.selectedFightingStyle && (
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Stile di Combattimento:</span>
                <Badge>{getChoiceName('fighting_style', state.selectedFightingStyle)}</Badge>
              </div>
            )}

            {/* Subclass */}
            {state.selectedSubclass && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Sottoclasse:</span>
                <Badge variant="outline">{state.selectedSubclass}</Badge>
              </div>
            )}

            {/* Invocations */}
            {state.selectedInvocations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Invocazioni Occulte:</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {state.selectedInvocations.map(inv => (
                    <Badge key={inv} variant="secondary">
                      {getChoiceName('invocation', inv)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spells Summary */}
      {state.newSpells.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              Nuovi Incantesimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {state.newSpells.map(spell => (
                <Badge key={spell.id} variant="secondary">
                  {spell.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Full Heal Option */}
      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="full-heal"
          checked={state.fullHeal}
          onCheckedChange={(checked) => updateState({ fullHeal: checked as boolean })}
        />
        <Label htmlFor="full-heal" className="flex-1 cursor-pointer">
          <span className="font-medium">Ripristina tutti i PF</span>
          <p className="text-sm text-muted-foreground">
            Porta i PF attuali al nuovo massimo ({newMaxHP})
          </p>
        </Label>
      </div>

      {/* Final Status */}
      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">HP Max</p>
              <p className="text-2xl font-bold text-primary">{newMaxHP}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">HP Attuali</p>
              <p className="text-2xl font-bold">
                {state.fullHeal ? newMaxHP : character.current_hp + hpIncrease}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
