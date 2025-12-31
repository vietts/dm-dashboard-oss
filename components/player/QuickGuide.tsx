'use client'

import { useState } from 'react'
import { GameIcon } from '@/components/icons/GameIcon'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface GuideSection {
  id: string
  title: string
  icon: string
  content: React.ReactNode
}

interface QuickGuideProps {
  defaultCollapsed?: boolean
}

export default function QuickGuide({ defaultCollapsed = false }: QuickGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sections: GuideSection[] = [
    {
      id: 'dice',
      title: 'Come funzionano i tiri',
      icon: 'd20',
      content: (
        <div className="space-y-3 text-sm text-[var(--ink-light)]">
          <div>
            <strong className="text-[var(--ink)]">Tiro base:</strong> d20 + modificatore vs DC (Difficoltà)
          </div>
          <div>
            <strong className="text-[var(--ink)]">Vantaggio:</strong> Tira 2d20, prendi il risultato più alto
          </div>
          <div>
            <strong className="text-[var(--ink)]">Svantaggio:</strong> Tira 2d20, prendi il risultato più basso
          </div>
          <div className="bg-[var(--cream-dark)] p-2 rounded border border-[var(--border-decorative)]">
            <strong className="text-[var(--teal)]">20 naturale =</strong> Successo critico (attacchi)
            <br />
            <strong className="text-[var(--coral)]">1 naturale =</strong> Fallimento automatico
          </div>
        </div>
      ),
    },
    {
      id: 'combat',
      title: 'Azioni in combattimento',
      icon: 'combat',
      content: (
        <div className="space-y-3 text-sm text-[var(--ink-light)]">
          <div>
            <strong className="text-[var(--health-mid)]">Azione:</strong>
            <ul className="list-disc list-inside ml-2 text-[var(--ink-light)]">
              <li>Attaccare</li>
              <li>Lanciare un incantesimo</li>
              <li>Scatto (movimento extra)</li>
              <li>Disimpegno (niente attacchi opportunità)</li>
              <li>Schivare (+svantaggio per chi ti attacca)</li>
              <li>Aiutare (dare vantaggio a un alleato)</li>
              <li>Nascondersi</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-600">Azione Bonus:</strong> Dipende da classe/abilità
          </div>
          <div>
            <strong className="text-purple-600">Reazione:</strong> 1 per round (es. Attacco opportunità)
          </div>
          <div>
            <strong className="text-[var(--teal)]">Movimento:</strong> Usa la tua velocità, può essere spezzato
          </div>
        </div>
      ),
    },
    {
      id: 'rests',
      title: 'Riposi',
      icon: 'rest',
      content: (
        <div className="space-y-3 text-sm text-[var(--ink-light)]">
          <div className="bg-[var(--cream-dark)] p-2 rounded border border-[var(--border-decorative)]">
            <strong className="text-[var(--health-mid)]">Riposo Breve</strong> (1 ora)
            <ul className="list-disc list-inside ml-2 text-[var(--ink-light)]">
              <li>Usa Dadi Vita per recuperare HP</li>
              <li>Alcune abilità si ricaricano</li>
            </ul>
          </div>
          <div className="bg-[var(--cream-dark)] p-2 rounded border border-[var(--border-decorative)]">
            <strong className="text-[var(--teal)]">Riposo Lungo</strong> (8 ore)
            <ul className="list-disc list-inside ml-2 text-[var(--ink-light)]">
              <li>Recupera tutti gli HP</li>
              <li>Recupera metà dei Dadi Vita (minimo 1)</li>
              <li>Tutte le risorse si ricaricano</li>
              <li>Slot incantesimi ripristinati</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'conditions',
      title: 'Condizioni comuni',
      icon: 'hourglass',
      content: (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { name: 'Accecato', desc: 'Fallisci check che richiedono vista' },
            { name: 'Affascinato', desc: 'Non puoi attaccare chi ti ha affascinato' },
            { name: 'Afferrato', desc: 'Velocità 0' },
            { name: 'Avvelenato', desc: 'Svantaggio su attacchi e check abilità' },
            { name: 'Paralizzato', desc: 'Incapacitato, fallisci FOR e DES' },
            { name: 'Pietrificato', desc: 'Peso x10, resistenze, immunità' },
            { name: 'Prono', desc: 'Svantaggio attacchi, +vantaggio da vicino' },
            { name: 'Spaventato', desc: 'Svantaggio mentre vedi la fonte' },
            { name: 'Stordito', desc: 'Incapacitato, non puoi muoverti' },
            { name: 'Invisibile', desc: 'Svantaggio per essere colpito' },
          ].map((c) => (
            <div key={c.name} className="bg-[var(--paper)] p-2 rounded border border-[var(--border-decorative)]">
              <span className="text-[var(--ink)] font-medium">{c.name}</span>
              <p className="text-[var(--ink-light)] mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="parchment-card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--ink)]/5 transition-colors"
      >
        <h3 className="text-lg font-display font-semibold text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="d20" category="ui" size={20} className="text-[var(--teal)]" />
          Guida Rapida
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
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}
      >
        <div className="px-4 pb-4 space-y-2">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id

            return (
              <div key={section.id} className="bg-[var(--cream-dark)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-[var(--ink)]/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GameIcon name={section.icon} category="ui" size={16} className="text-[var(--teal)]" />
                    <span className="text-[var(--ink)]">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[var(--ink-light)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--ink-light)]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-[var(--border-decorative)]">
                    {section.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
