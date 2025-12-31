'use client'

import { useState } from 'react'
import { GameIcon } from '@/components/icons/GameIcon'
import { ChevronDown } from 'lucide-react'

interface GlossaryTerm {
  term: string
  definition: string
  category: 'combat' | 'magic' | 'general'
}

interface GlossaryProps {
  defaultCollapsed?: boolean
}

const terms: GlossaryTerm[] = [
  // Combat
  { term: 'AC (Classe Armatura)', definition: 'Il numero che un attacco deve raggiungere o superare per colpirti.', category: 'combat' },
  { term: 'Attacco Opportunità', definition: 'Reazione per attaccare un nemico che esce dalla tua portata senza Disimpegno.', category: 'combat' },
  { term: 'Copertura', definition: 'Mezza copertura (+2 AC), tre quarti (+5 AC), totale (non puoi essere bersagliato).', category: 'combat' },
  { term: 'Iniziativa', definition: 'Tiro all\'inizio del combattimento per determinare l\'ordine dei turni.', category: 'combat' },
  { term: 'Round', definition: 'Un ciclo completo di turni di tutti i partecipanti al combattimento (~6 secondi).', category: 'combat' },

  // Magic
  { term: 'Concentrazione', definition: 'Alcuni incantesimi richiedono concentrazione. Puoi concentrarti su un solo incantesimo alla volta.', category: 'magic' },
  { term: 'Componenti', definition: 'V = Verbale, S = Somatica (gesti), M = Materiale. Necessari per lanciare.', category: 'magic' },
  { term: 'Cantrip', definition: 'Incantesimo di livello 0, lanciabile a volontà senza consumare slot.', category: 'magic' },
  { term: 'Spell Save DC', definition: 'La difficoltà che i nemici devono superare per resistere ai tuoi incantesimi.', category: 'magic' },
  { term: 'Slot Incantesimo', definition: 'Risorse limitate per lanciare incantesimi di livello 1+. Si ricaricano con riposo lungo.', category: 'magic' },

  // General
  { term: 'Tiro Salvezza', definition: 'Tiro per evitare o ridurre effetti negativi (veleni, trappole, incantesimi).', category: 'general' },
  { term: 'Prova di Abilità', definition: 'd20 + modificatore abilità. Usato per azioni fuori dal combattimento.', category: 'general' },
  { term: 'Competenza', definition: 'Bonus che aggiungi a tiri in cui sei addestrato. Aumenta con il livello.', category: 'general' },
  { term: 'Ispirazione', definition: 'Risorsa speciale data dal DM. Puoi usarla per ritirare un dado.', category: 'general' },
  { term: 'CD (Classe Difficoltà)', definition: 'Il numero da raggiungere o superare per avere successo in un\'azione.', category: 'general' },
]

const categoryLabels: Record<string, { label: string; color: string }> = {
  combat: { label: 'Combattimento', color: 'text-[var(--coral)]' },
  magic: { label: 'Magia', color: 'text-purple-600' },
  general: { label: 'Generale', color: 'text-blue-600' },
}

export default function Glossary({ defaultCollapsed = false }: GlossaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTerms = terms.filter((t) => {
    const matchesCategory = filter === 'all' || t.category === filter
    const matchesSearch = t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.definition.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="parchment-card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--ink)]/5 transition-colors"
      >
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="book" category="ui" size={20} className="text-[var(--teal)]" />
          Glossario D&D
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--ink-faded)]">
            {isCollapsed ? 'Espandi' : 'Comprimi'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[var(--ink-light)] transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
        }`}
      >
        <div className="px-4 pb-4">
          {/* Search and Filter */}
          <div className="space-y-2 mb-4">
            <input
              type="text"
              placeholder="Cerca termine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--paper)] border border-[var(--border-decorative)] rounded text-[var(--ink)] placeholder-[var(--ink-faded)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
            />
            <div className="flex gap-1 flex-wrap">
              {['all', 'combat', 'magic', 'general'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filter === cat
                      ? 'bg-[var(--teal)] text-white'
                      : 'bg-[var(--cream-dark)] text-[var(--ink-light)] hover:bg-[var(--ink)]/10'
                  }`}
                >
                  {cat === 'all' ? 'Tutti' : categoryLabels[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Terms List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTerms.map((t) => (
              <div key={t.term} className="bg-[var(--cream-dark)] rounded p-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${categoryLabels[t.category].color}`}>
                    {t.term}
                  </span>
                </div>
                <p className="text-[var(--ink-light)] text-xs mt-1">{t.definition}</p>
              </div>
            ))}
            {filteredTerms.length === 0 && (
              <p className="text-[var(--ink-faded)] text-sm text-center py-4">
                Nessun termine trovato
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
