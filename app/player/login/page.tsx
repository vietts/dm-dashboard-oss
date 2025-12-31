'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlayerLoginPage() {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/player-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/player/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Codice non valido')
        setLoading(false)
      }
    } catch {
      setError('Errore di connessione')
      setLoading(false)
    }
  }

  // Format code as user types (add hyphen after 4 chars)
  function handleCodeChange(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setAccessCode(cleaned.slice(0, 8))
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-stone-900 border border-stone-800 rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎭</div>
            <h1 className="text-2xl font-bold text-emerald-500 mb-2">Portale Giocatore</h1>
            <p className="text-stone-400 text-sm">
              Inserisci il codice fornito dal tuo Dungeon Master
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="CODICE ACCESSO"
                className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
                autoFocus
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <p className="text-stone-500 text-xs text-center mt-2">
                8 caratteri alfanumerici
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || accessCode.length !== 8}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Accesso...' : 'Entra nella campagna'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-800">
            <p className="text-stone-500 text-xs text-center">
              Non hai un codice? Chiedilo al tuo DM!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
