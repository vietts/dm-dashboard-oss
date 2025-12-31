'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Character {
  id: string
  name: string
  player_name: string | null
}

interface PlayerCode {
  exists: boolean
  id?: string
  access_code?: string
  player_name?: string
  last_login?: string
  created_at?: string
}

interface PlayerCodeManagerProps {
  characters: Character[]
  campaignId: string
}

export function PlayerCodeManager({ characters, campaignId }: PlayerCodeManagerProps) {
  const [playerCodes, setPlayerCodes] = useState<Record<string, PlayerCode>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  // Fetch existing codes for all characters
  useEffect(() => {
    async function fetchCodes() {
      for (const char of characters) {
        try {
          const res = await fetch(`/api/player-code?characterId=${char.id}`)
          if (res.ok) {
            const data = await res.json()
            setPlayerCodes(prev => ({ ...prev, [char.id]: data }))
          }
        } catch (err) {
          console.error('Error fetching code for', char.name, err)
        }
      }
    }
    if (characters.length > 0) {
      fetchCodes()
    }
  }, [characters])

  async function generateCode(character: Character) {
    setLoading(prev => ({ ...prev, [character.id]: true }))
    try {
      const res = await fetch('/api/player-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          playerName: character.player_name || character.name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedCode(data.accessCode)
        setSelectedCharacter(character)
        setShowCodeDialog(true)

        // Refresh the code data
        const refreshRes = await fetch(`/api/player-code?characterId=${character.id}`)
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          setPlayerCodes(prev => ({ ...prev, [character.id]: refreshData }))
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Errore generazione codice')
      }
    } catch (err) {
      console.error('Error generating code:', err)
      alert('Errore di rete')
    } finally {
      setLoading(prev => ({ ...prev, [character.id]: false }))
    }
  }

  async function revokeCode(characterId: string) {
    setLoading(prev => ({ ...prev, [characterId]: true }))
    try {
      const res = await fetch(`/api/player-code?characterId=${characterId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPlayerCodes(prev => ({ ...prev, [characterId]: { exists: false } }))
        setConfirmRevoke(null)
      } else {
        alert('Errore revoca accesso')
      }
    } catch (err) {
      console.error('Error revoking code:', err)
    } finally {
      setLoading(prev => ({ ...prev, [characterId]: false }))
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return 'Mai'
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (characters.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-8 text-center text-slate-400">
          Nessun personaggio nella campagna
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <span>🔑</span> Accessi Giocatori
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {characters.map(char => {
            const code = playerCodes[char.id]
            const isLoading = loading[char.id]

            return (
              <div
                key={char.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-white">{char.name}</div>
                  <div className="text-sm text-slate-400">
                    {char.player_name || 'Giocatore non assegnato'}
                  </div>
                  {code?.exists && (
                    <div className="text-xs text-slate-500 mt-1">
                      Ultimo accesso: {formatDate(code.last_login)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {code?.exists ? (
                    <>
                      <Badge
                        variant="outline"
                        className="font-mono text-green-400 border-green-600 cursor-pointer hover:bg-green-900/30"
                        onClick={() => {
                          copyToClipboard(code.access_code!)
                          setGeneratedCode(code.access_code!)
                          setSelectedCharacter(char)
                          setShowCodeDialog(true)
                        }}
                        title="Clicca per copiare"
                      >
                        {code.access_code}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                        onClick={() => generateCode(char)}
                        disabled={isLoading}
                        title="Rigenera codice"
                      >
                        🔄
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                        onClick={() => setConfirmRevoke(char.id)}
                        disabled={isLoading}
                        title="Revoca accesso"
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => generateCode(char)}
                      disabled={isLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {isLoading ? '...' : '+ Genera Codice'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Dialog for showing generated code */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              Codice Accesso per {selectedCharacter?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Condividi questo codice con il giocatore
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <div
              className="inline-block px-6 py-4 bg-slate-800 rounded-lg font-mono text-3xl tracking-widest text-green-400 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={() => generatedCode && copyToClipboard(generatedCode)}
              title="Clicca per copiare"
            >
              {generatedCode}
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Clicca sul codice per copiarlo
            </p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg text-sm text-slate-300">
            <p className="font-medium mb-2">Istruzioni per il giocatore:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Vai su <span className="text-amber-400">/player/login</span></li>
              <li>Inserisci il codice <span className="font-mono text-green-400">{generatedCode}</span></li>
              <li>Accedi alla tua dashboard personaggio!</li>
            </ol>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCodeDialog(false)}
              className="border-slate-600"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm revoke dialog */}
      <Dialog open={!!confirmRevoke} onOpenChange={() => setConfirmRevoke(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-400">Revoca Accesso</DialogTitle>
            <DialogDescription className="text-slate-400">
              Sei sicuro di voler revocare l&apos;accesso per questo giocatore?
              Il codice verrà eliminato e dovrà essere rigenerato.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRevoke(null)}
              className="border-slate-600"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRevoke && revokeCode(confirmRevoke)}
              className="bg-red-600 hover:bg-red-500"
            >
              Revoca Accesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
