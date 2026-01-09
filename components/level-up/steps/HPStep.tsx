'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dices, Calculator, Heart, ArrowRight } from 'lucide-react'
import { getHitDieAverage } from '@/lib/class-features'
import type { HPStepProps } from '../types'

export function HPStep({ character, state, updateState, hitDie, conModifier }: HPStepProps) {
  const average = getHitDieAverage(hitDie)

  const handleRollInput = (value: string) => {
    const num = parseInt(value)
    if (isNaN(num)) {
      updateState({ hpRollResult: null, useAverage: false })
    } else {
      // Clamp to valid die range
      const clamped = Math.max(1, Math.min(hitDie, num))
      updateState({ hpRollResult: clamped, useAverage: false })
    }
  }

  const handleUseAverage = () => {
    updateState({ useAverage: true, hpRollResult: average })
  }

  const calculateTotal = () => {
    if (state.useAverage) {
      return average + conModifier
    }
    return (state.hpRollResult || 0) + conModifier
  }

  const newMaxHP = (character.max_hp ?? 10) + calculateTotal()

  return (
    <div className="space-y-6">
      {/* Dice Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Dices className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Dado Vita</p>
                <p className="text-2xl font-bold text-primary">d{hitDie}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Modificatore COS</p>
              <p className="text-2xl font-bold">
                {conModifier >= 0 ? '+' : ''}{conModifier}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roll Input */}
      <div className="space-y-4">
        <Label className="text-base">Inserisci il risultato del tiro</Label>
        <p className="text-sm text-muted-foreground">
          Tira un d{hitDie} e inserisci il risultato, oppure usa la media.
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min={1}
              max={hitDie}
              placeholder={`1-${hitDie}`}
              value={state.useAverage ? '' : (state.hpRollResult || '')}
              onChange={(e) => handleRollInput(e.target.value)}
              className="text-center text-lg font-mono"
              disabled={state.useAverage}
            />
          </div>
          <Button
            variant={state.useAverage ? 'default' : 'outline'}
            onClick={handleUseAverage}
            className="gap-2"
          >
            <Calculator className="w-4 h-4" />
            Media ({average})
          </Button>
        </div>
      </div>

      {/* Preview */}
      {(state.hpRollResult !== null || state.useAverage) && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Calcolo</p>
                  <p className="font-mono">
                    {state.useAverage ? average : state.hpRollResult} (d{hitDie}) +{' '}
                    {conModifier >= 0 ? conModifier : `(${conModifier})`} (COS) ={' '}
                    <span className="font-bold text-green-600 dark:text-green-400">
                      +{calculateTotal()} HP
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
              <div className="flex items-center justify-center gap-4 text-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">HP Attuali</p>
                  <p className="font-bold">{character.max_hp}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Nuovi HP Max</p>
                  <p className="font-bold text-green-600 dark:text-green-400">{newMaxHP}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
