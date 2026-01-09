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
  characterClass?: string
}

interface ClassMagicInfo {
  name: string
  characteristic: string
  type: string
  swapFrequency: string
  special: string | null
  focus: string
  startLevel?: number
}

const CLASS_MAGIC_INFO: Record<string, ClassMagicInfo> = {
  wizard: {
    name: 'Mago',
    characteristic: 'Intelligenza',
    type: 'Prepara dal libro',
    swapFrequency: 'Riposo lungo: qualsiasi numero',
    special: 'Libro degli incantesimi - copia pergamene (2h + 50mo/livello)',
    focus: 'Bacchetta, bastone, globo arcano',
  },
  cleric: {
    name: 'Chierico',
    characteristic: 'Saggezza',
    type: 'Prepara dalla lista completa',
    swapFrequency: 'Riposo lungo: qualsiasi numero',
    special: 'Dominio fornisce incantesimi bonus sempre preparati',
    focus: 'Simbolo sacro',
  },
  druid: {
    name: 'Druido',
    characteristic: 'Saggezza',
    type: 'Prepara dalla lista completa',
    swapFrequency: 'Riposo lungo: qualsiasi numero',
    special: 'Circolo può fornire incantesimi bonus',
    focus: 'Focus druidico',
  },
  paladin: {
    name: 'Paladino',
    characteristic: 'Carisma',
    type: 'Prepara (lista limitata)',
    swapFrequency: 'Riposo lungo: uno solo',
    special: 'Giuramento fornisce bonus. Punizione Divina 1x senza slot',
    focus: 'Simbolo sacro',
    startLevel: 2,
  },
  ranger: {
    name: 'Ranger',
    characteristic: 'Saggezza',
    type: 'Prepara (lista limitata)',
    swapFrequency: 'Riposo lungo: uno solo',
    special: null,
    focus: 'Nessuno (componenti materiali)',
    startLevel: 2,
  },
  bard: {
    name: 'Bardo',
    characteristic: 'Carisma',
    type: 'Conosce incantesimi fissi',
    swapFrequency: 'Solo salendo di livello: uno',
    special: 'Segreti Magici - impara da qualsiasi lista',
    focus: 'Strumento musicale',
  },
  sorcerer: {
    name: 'Stregone',
    characteristic: 'Carisma',
    type: 'Conosce incantesimi fissi',
    swapFrequency: 'Solo salendo di livello: uno',
    special: 'Punti Stregoneria + Metamagia',
    focus: 'Focus arcano',
  },
  warlock: {
    name: 'Warlock',
    characteristic: 'Carisma',
    type: 'Conosce incantesimi fissi',
    swapFrequency: 'Solo salendo di livello: uno',
    special: 'Magia del Patto: pochi slot (max 4) al livello massimo, recupero con RIPOSO BREVE',
    focus: 'Focus arcano',
  },
}

export default function QuickGuide({ defaultCollapsed = false, characterClass }: QuickGuideProps) {
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
      id: 'magic',
      title: 'Guida alla Magia',
      icon: 'book',
      content: (() => {
        const classInfo = characterClass ? CLASS_MAGIC_INFO[characterClass.toLowerCase()] : null

        return (
          <div className="space-y-3">
            {/* Slot Incantesimo */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-2 text-sm">Slot Incantesimo</h4>
              <p className="text-xs text-[var(--ink)]">
                Gli slot sono &quot;batterie magiche&quot;. Per lanciare un incantesimo, spendi uno slot di livello <strong>uguale o superiore</strong>.
              </p>
              <p className="text-xs text-[var(--ink)] mt-1">
                <strong>Upcasting:</strong> Alcuni incantesimi diventano più potenti con slot più alti.
              </p>
              <p className="text-xs text-[var(--ink)] mt-1">
                <strong>Recupero:</strong> Riposo lungo = tutti gli slot.
              </p>
            </div>

            {/* Trucchetti */}
            <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
              <h4 className="font-bold text-teal-800 mb-2 text-sm">∞ Trucchetti (Livello 0)</h4>
              <p className="text-xs text-[var(--ink)]">
                Lanciabili <strong>all&apos;infinito</strong>, senza consumare slot. Diventano più potenti automaticamente a certi livelli.
              </p>
            </div>

            {/* Concentrazione */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-2 text-sm">Concentrazione</h4>
              <ul className="text-xs text-[var(--ink)] list-disc list-inside space-y-1">
                <li>Puoi mantenere <strong>un solo</strong> incantesimo a concentrazione</li>
                <li><strong>Se subisci danni:</strong> TS Costituzione (CD = 10 o metà danni, il più alto)</li>
                <li><strong>Termina se:</strong> incapacitato, muori, lanci altra concentrazione</li>
              </ul>
            </div>

            {/* Componenti */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2 text-sm">Componenti</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><strong>V</strong> = Verbale</div>
                <div><strong>S</strong> = Somatica</div>
                <div><strong>M</strong> = Materiale</div>
              </div>
            </div>

            {/* Rituali */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2 text-sm">Rituali (R)</h4>
              <p className="text-xs text-[var(--ink)]">
                Lanciabili <strong>senza slot</strong> aggiungendo 10 minuti al tempo di lancio.
              </p>
            </div>

            {/* Regola Singolo Slot */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <h4 className="font-bold text-red-800 mb-2 text-sm">⚠️ Regola Singolo Slot per Turno</h4>
              <p className="text-xs text-[var(--ink)]">
                Se lanci un incantesimo bonus action che usa slot, l&apos;unico altro incantesimo nel turno può essere solo un <strong>trucchetto</strong> (1 azione).
              </p>
            </div>

            {/* Classe Specifica */}
            {classInfo && (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-300">
                <h4 className="font-bold text-indigo-800 mb-2 text-sm">
                  La Tua Classe: {classInfo.name}
                </h4>
                <div className="text-xs text-[var(--ink)] space-y-1">
                  <p><strong>Caratteristica:</strong> {classInfo.characteristic}</p>
                  <p><strong>Tipo:</strong> {classInfo.type}</p>
                  <p><strong>Cambio lista:</strong> {classInfo.swapFrequency}</p>
                  {classInfo.special && <p><strong>Speciale:</strong> {classInfo.special}</p>}
                  <p><strong>Focus:</strong> {classInfo.focus}</p>
                </div>
              </div>
            )}
          </div>
        )
      })(),
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
