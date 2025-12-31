'use client'

import { useState, useCallback, useRef } from 'react'
import { BackgroundAnswers } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Send } from 'lucide-react'

// The 5 guiding questions
const BACKGROUND_QUESTIONS = [
  {
    key: 'origins' as const,
    emoji: '🏠',
    title: 'Origini',
    question: 'Da dove vieni? Qual è la tua famiglia o comunità di origine?',
    placeholder: 'Descrivi il luogo dove sei cresciuto, la tua famiglia, la tua infanzia...'
  },
  {
    key: 'motivation' as const,
    emoji: '💭',
    title: 'Motivazione',
    question: 'Perché sei diventato un avventuriero? Cosa cerchi?',
    placeholder: 'Cosa ti ha spinto a lasciare la tua vita precedente? Quale obiettivo persegui?'
  },
  {
    key: 'fear' as const,
    emoji: '😨',
    title: 'Paura o Difetto',
    question: 'Qual è la tua più grande paura o il tuo difetto principale?',
    placeholder: 'Cosa ti terrorizza? Qual è il tuo punto debole caratteriale?'
  },
  {
    key: 'bonds' as const,
    emoji: '🤝',
    title: 'Legami',
    question: 'Chi è importante per te? Chi proteggeresti a ogni costo?',
    placeholder: 'Familiari, amici, mentori, amori... chi conta nella tua vita?'
  },
  {
    key: 'trait' as const,
    emoji: '⚔️',
    title: 'Tratto Distintivo',
    question: 'Come ti comporti in situazioni di stress o pericolo?',
    placeholder: 'Sei impulsivo o riflessivo? Aggressivo o diplomatico? Come reagisci sotto pressione?'
  }
]

interface CharacterBackgroundProps {
  playerId: string
  initialAnswers?: BackgroundAnswers
  // Secret feature
  secret?: string | null        // Current secret value
  onSecretSave?: (secret: string) => Promise<void>  // Callback to save secret
  showSecret?: boolean          // true = DM view (show secret text), false = player view
  defaultCollapsed?: boolean    // Start collapsed (for dashboard layout)
}

export default function CharacterBackground({
  playerId,
  initialAnswers,
  secret,
  onSecretSave,
  showSecret = false,
  defaultCollapsed = false
}: CharacterBackgroundProps) {
  const [answers, setAnswers] = useState<BackgroundAnswers>(initialAnswers || {})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Secret state
  const [secretDraft, setSecretDraft] = useState('')
  const [savingSecret, setSavingSecret] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const isSealed = Boolean(secret && secret.trim().length > 0)

  // Count completed answers
  const completedCount = BACKGROUND_QUESTIONS.filter(
    q => answers[q.key] && answers[q.key]!.trim().length > 0
  ).length

  // Debounced save function
  const saveAnswers = useCallback(async (answersToSave: BackgroundAnswers) => {
    setSaving(true)
    try {
      const res = await fetch('/api/player-background', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          answers: answersToSave
        })
      })

      if (res.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Failed to save background:', error)
    } finally {
      setSaving(false)
    }
  }, [playerId])

  // Handle input change with debounce
  const handleChange = useCallback((key: keyof BackgroundAnswers, value: string) => {
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (1.5 seconds after typing stops)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswers(newAnswers)
    }, 1500)
  }, [answers, saveAnswers])

  // Cleanup timeout on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cleanupRef = useRef(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  })

  // Handle secret seal
  const handleSealSecret = useCallback(async () => {
    if (!onSecretSave || !secretDraft.trim()) return

    setSavingSecret(true)
    try {
      await onSecretSave(secretDraft.trim())
      setShowConfirm(false)
      setSecretDraft('')
    } catch (error) {
      console.error('Failed to seal secret:', error)
    } finally {
      setSavingSecret(false)
    }
  }, [onSecretSave, secretDraft])

  return (
    <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
      <CardHeader
        className="pb-3 cursor-pointer select-none hover:bg-[var(--cream-dark)]/50 transition-colors rounded-t-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
            La Tua Storia
            {/* Collapse indicator */}
            <span className={`text-[var(--ink-faded)] text-sm transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
              ▶
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Secret sealed badge */}
            {Boolean(secret && secret.trim().length > 0) && (
              <span className="text-xs bg-[var(--teal)]/20 text-[var(--teal)] px-2 py-0.5 rounded flex items-center gap-1">
                <Lock size={10} />
                Sigillato
              </span>
            )}
            {/* Progress indicator */}
            <span className="text-sm font-normal text-[var(--ink-light)]">
              {completedCount}/5
            </span>
            {/* Save indicator */}
            {saving && (
              <span className="text-xs text-[var(--ink-light)] animate-pulse">
                ...
              </span>
            )}
            {!saving && lastSaved && (
              <span className="text-xs text-green-600">
                ✓
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {!isCollapsed && (
      <CardContent className="space-y-4">
        {/* Tooltip/Banner - Paper sheet reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <GameIcon name="scroll" category="ui" size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Ricorda:</strong> Riporta queste informazioni anche sulla tua scheda cartacea!
            Ti aiuterà durante le sessioni di gioco.
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-[var(--cream-dark)] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[var(--teal)] transition-all duration-300"
            style={{ width: `${(completedCount / 5) * 100}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {BACKGROUND_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                <span className="text-lg">{q.emoji}</span>
                <span>{q.title}</span>
                {answers[q.key] && answers[q.key]!.trim().length > 0 && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </label>
              <p className="text-xs text-[var(--ink-light)] italic ml-7">
                {q.question}
              </p>
              <Textarea
                value={answers[q.key] || ''}
                onChange={(e) => handleChange(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="resize-none bg-white/50 border-[var(--ink-faded)]/20 focus:border-[var(--teal)]/50"
              />
            </div>
          ))}
        </div>

        {/* Completion message */}
        {completedCount === 5 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-sm text-green-800">
              <strong>Ottimo lavoro!</strong> Hai completato tutte le domande sulla storia del tuo personaggio.
            </p>
          </div>
        )}

        {/* Secret Section */}
        {onSecretSave && (
          <div className="mt-6 pt-6 border-t-2 border-dashed border-[var(--coral)]/30">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={20} className="text-[var(--coral)]" />
              <h3 className="text-lg font-display font-semibold text-[var(--ink)]">
                Il Tuo Segreto
              </h3>
            </div>

            {/* DM View - Show the secret */}
            {showSecret && isSealed && (
              <div className="bg-[var(--coral)]/10 border-2 border-[var(--coral)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--ink-light)] mb-2 italic">
                  Segreto del personaggio (visibile solo al DM):
                </p>
                <p className="text-[var(--ink)] whitespace-pre-wrap">{secret}</p>
              </div>
            )}

            {/* Player View - Already sealed */}
            {!showSecret && isSealed && (
              <div className="bg-[var(--teal)]/10 border-2 border-[var(--teal)]/30 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--teal)]/20 flex items-center justify-center">
                  <Lock size={20} className="text-[var(--teal)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--teal)]">Segreto sigillato</p>
                  <p className="text-sm text-[var(--ink-light)]">
                    Il tuo segreto è stato inviato al DM e non può essere modificato.
                  </p>
                </div>
              </div>
            )}

            {/* Player View - Not sealed yet */}
            {!showSecret && !isSealed && !showConfirm && (
              <>
                <div className="bg-[var(--coral)]/5 border border-[var(--coral)]/20 rounded-lg p-3 mb-3">
                  <p className="text-sm text-[var(--coral)]">
                    <strong>Attenzione:</strong> Questo segreto sarà visibile SOLO al DM.
                    Una volta sigillato, non potrai più modificarlo.
                  </p>
                </div>
                <Textarea
                  value={secretDraft}
                  onChange={(e) => setSecretDraft(e.target.value)}
                  placeholder="Scrivi qui il tuo segreto... Un oscuro passato? Un tradimento? Un obiettivo nascosto?"
                  rows={4}
                  className="resize-none bg-white/50 border-[var(--coral)]/30 focus:border-[var(--coral)]/50 mb-3"
                />
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!secretDraft.trim()}
                  className="bg-[var(--coral)] hover:bg-[var(--coral-dark)] text-white"
                >
                  <Send size={16} className="mr-2" />
                  Sigilla e Invia al DM
                </Button>
              </>
            )}

            {/* Confirmation dialog */}
            {!showSecret && !isSealed && showConfirm && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <p className="text-amber-800 font-medium mb-3">
                  Sei sicuro di voler sigillare questo segreto?
                </p>
                <p className="text-sm text-amber-700 mb-4">
                  Una volta confermato, non potrai più leggerlo né modificarlo.
                  Solo il DM potrà vederlo.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSealSecret}
                    disabled={savingSecret}
                    className="bg-[var(--coral)] hover:bg-[var(--coral-dark)] text-white"
                  >
                    {savingSecret ? 'Sigillando...' : 'Conferma e Sigilla'}
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(false)}
                    variant="outline"
                    disabled={savingSecret}
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {/* DM View - No secret yet */}
            {showSecret && !isSealed && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-[var(--ink-light)] italic">
                  Il giocatore non ha ancora scritto un segreto.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
