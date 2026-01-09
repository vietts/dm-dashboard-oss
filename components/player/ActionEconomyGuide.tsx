'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { GameIcon } from '@/components/icons/GameIcon'
import type { Character } from '@/types/database'

interface ActionEconomyGuideProps {
  character?: Character  // Opzionale - per mostrare velocità personalizzata
}

/**
 * Action Economy Guide Component
 *
 * Spiega ai giocatori principianti come funziona l'economia delle azioni in D&D 5e.
 * Collapsible section con visualizzazione a griglia.
 */
export default function ActionEconomyGuide({ character }: ActionEconomyGuideProps) {
  const [expanded, setExpanded] = useState(false)
  const speed = character?.speed || 9  // Default 9m (30ft)

  return (
    <div className="action-economy-guide parchment-card p-4 mb-4">
      {/* Header collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <GameIcon name="info" category="ui" size={20} className="text-[var(--teal)]" />
          <h3 className="font-display font-bold text-[var(--ink)]">
            Come Funzionano le Azioni?
          </h3>
        </div>
        <div className="text-[var(--ink-light)] group-hover:text-[var(--ink)]">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Contenuto espandibile */}
      {expanded && (
        <div className="mt-4">
          {/* Intro */}
          <p className="text-sm text-[var(--ink-light)] mb-4">
            Ogni <strong>turno</strong> in combattimento hai a disposizione diverse azioni.
            Ecco cosa puoi fare:
          </p>

          {/* Grid azioni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1 AZIONE */}
            <div className="p-3 bg-[var(--teal)]/10 border border-[var(--teal)]/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <GameIcon name="sword" category="ui" size={18} className="text-[var(--teal)]" />
                <div className="font-bold text-sm text-[var(--ink)]">⚔️ 1 Azione</div>
              </div>
              <div className="text-xs text-[var(--ink-light)] mb-2">
                Ogni turno hai <strong>UNA</strong> azione. Puoi scegliere tra:
              </div>
              <ul className="text-xs text-[var(--ink-light)] space-y-1 ml-4">
                <li>• <strong>Attacco</strong>: colpisci con un'arma o a mani nude</li>
                <li>• <strong>Magia</strong>: lanci un incantesimo</li>
                <li>• <strong>Scatto</strong>: raddoppi il movimento</li>
                <li>• <strong>Schivata</strong>: svantaggio agli attacchi contro di te</li>
                <li>• <strong>Disimpegno</strong>: ti muovi senza provocare attacchi</li>
                <li>• <strong>Nascondersi</strong>: prova di Furtività</li>
                <li>• <strong>Aiuto</strong>: dai vantaggio a un alleato</li>
                <li>• <strong>Prepararsi</strong>: prepari un'azione per un innesco</li>
              </ul>
            </div>

            {/* 1 AZIONE BONUS */}
            <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <GameIcon name="zap" category="ui" size={18} className="text-blue-600" />
                <div className="font-bold text-sm text-[var(--ink)]">⚡ 1 Azione Bonus</div>
              </div>
              <div className="text-xs text-[var(--ink-light)] mb-2">
                Hai <strong>UNA</strong> azione bonus per turno, MA solo se qualcosa te la concede!
              </div>
              <div className="text-xs text-[var(--ink-light)] space-y-1">
                <div>
                  ✓ Alcune abilità di classe (es. Azione Scaltra del Ladro)
                </div>
                <div>
                  ✓ Alcuni incantesimi con tempo "azione bonus"
                </div>
                <div className="mt-2 italic text-[var(--teal)]">
                  → Vedi le tue Azioni Bonus specifiche qui sotto! ↓
                </div>
              </div>
            </div>

            {/* 1 REAZIONE */}
            <div className="p-3 bg-purple-500/10 border border-purple-400/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <GameIcon name="shield" category="ui" size={18} className="text-purple-600" />
                <div className="font-bold text-sm text-[var(--ink)]">🛡️ 1 Reazione</div>
              </div>
              <div className="text-xs text-[var(--ink-light)] mb-2">
                Hai <strong>UNA</strong> reazione tra un turno e l'altro.
                Recupera all'inizio del tuo turno.
              </div>
              <ul className="text-xs text-[var(--ink-light)] space-y-1 ml-4">
                <li>• <strong>Attacco di Opportunità</strong>: un nemico esce dalla tua portata (1,5m)</li>
                <li>• <strong>Azione Preparata</strong>: l'innesco che hai scelto si verifica</li>
                <li>• <strong>Reazioni di classe</strong>: (es. Scudo per Mago)</li>
              </ul>
            </div>

            {/* MOVIMENTO */}
            <div className="p-3 bg-green-500/10 border border-green-400/30 rounded">
              <div className="flex items-center gap-2 mb-2">
                <GameIcon name="run" category="ui" size={18} className="text-green-600" />
                <div className="font-bold text-sm text-[var(--ink)]">🏃 Movimento</div>
              </div>
              <div className="text-xs text-[var(--ink-light)] mb-2">
                Puoi muoverti fino a <strong>{speed}m</strong> per turno.
              </div>
              <ul className="text-xs text-[var(--ink-light)] space-y-1 ml-4">
                <li>• Puoi <strong>spezzare</strong> il movimento (es. 3m → attacco → 6m)</li>
                <li>• Azione Scatto: <strong>raddoppia</strong> il movimento</li>
                <li>• Movimento in terreno difficile: <strong>×2</strong> il costo</li>
              </ul>
            </div>
          </div>

          {/* Interazione oggetto */}
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-400/30 rounded">
            <div className="flex items-center gap-2 mb-2">
              <GameIcon name="hand" category="ui" size={18} className="text-amber-600" />
              <div className="font-bold text-sm text-[var(--ink)]">🤝 1 Interazione Oggetto Gratuita</div>
            </div>
            <div className="text-xs text-[var(--ink-light)]">
              Puoi interagire gratuitamente con <strong>1 oggetto</strong> per turno
              (es. sfoderare/riporre un'arma, aprire una porta, prendere un oggetto da terra).
              Se serve interagire con più oggetti, usa l'azione Utilizzo.
            </div>
          </div>

          {/* Nota importante */}
          <div className="mt-4 p-3 bg-[var(--cream)] border border-[var(--ink)]/20 rounded">
            <div className="text-xs text-[var(--ink)] space-y-1">
              <div className="font-bold mb-1">⚠️ Regola Importante:</div>
              <div>
                Se lanci un incantesimo con tempo <em>azione bonus</em>, puoi lanciare
                solo <strong>cantrip</strong> (trucchetti) con l'azione normale in quel turno.
                Non puoi lanciare 2 incantesimi di livello 1+ nello stesso turno!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
