'use client'

import { useState } from 'react'
import type { Character } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'

interface FeaturesPanelProps {
  character: Character
  readOnly?: boolean
}

interface ClassResource {
  id: string
  name: string
  description: string
  current: number
  max: number
  recharge: 'short' | 'long' | 'dawn' | string
  class: string
}

/**
 * Feature Card Component
 * Displays a single class/race feature with expandable description
 */
function FeatureCard({
  title,
  description,
  source,
  uses,
  icon = 'sparkles',
}: {
  title: string
  description: string
  source: string
  uses?: { current: number; max: number; recharge: string }
  icon?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="parchment-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <GameIcon name={icon} category="ui" size={24} className="text-[var(--teal)] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-[var(--ink)] text-base mb-1">{title}</h4>
            <p className="text-xs text-[var(--ink-faded)] mb-2">{source}</p>

            {/* Description - expandable */}
            <div className={`text-sm text-[var(--ink-light)] ${!expanded ? 'line-clamp-2' : ''}`}>
              {description}
            </div>

            {description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-[var(--teal)] hover:underline mt-1"
              >
                {expanded ? 'Mostra meno' : 'Mostra tutto'}
              </button>
            )}
          </div>
        </div>

        {/* Uses indicator */}
        {uses && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="text-sm font-bold text-[var(--ink)]">
              {uses.current}/{uses.max}
            </div>
            <div className="text-xs text-[var(--ink-faded)]">
              {uses.recharge === 'short' && 'Riposo breve'}
              {uses.recharge === 'long' && 'Riposo lungo'}
              {uses.recharge === 'dawn' && 'Alba'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Features Panel Component
 * Displays all class features, race features, and special abilities
 */
export default function FeaturesPanel({ character, readOnly = false }: FeaturesPanelProps) {
  // Parse class resources from character
  const classResources: ClassResource[] = (character.class_resources as unknown as ClassResource[]) || []

  // Parse eldritch invocations for Warlock
  const eldritchInvocations: string[] = (character.eldritch_invocations as unknown as string[]) || []

  // Class-specific features based on level (hardcoded for now - could be from Open5e later)
  const getClassFeatures = (): Array<{ title: string; description: string; icon: string }> => {
    const features: Array<{ title: string; description: string; icon: string }> = []
    const charClass = character.class?.toLowerCase()
    const level = character.level || 1

    // Common features for specific classes
    if (charClass === 'rogue') {
      features.push({
        title: 'Attacco Furtivo',
        description: `Una volta per turno, puoi infliggere 1d6 danni extra a una creatura che colpisci con un attacco se hai vantaggio al tiro. Il bersaglio deve essere colpito da un'arma con accuratezza o da lancio. Non hai bisogno di vantaggio se un altro nemico del bersaglio si trova entro 1,5 metri da esso.`,
        icon: 'dagger',
      })
      features.push({
        title: 'Gergo dei Ladri',
        description:
          'Conosci il gergo dei ladri, un misto segreto di dialetto, slang e codici che ti permette di nascondere messaggi in conversazioni apparentemente normali. Comprendi anche segnali e simboli segreti usati dai ladri.',
        icon: 'scroll',
      })

      if (level >= 2) {
        features.push({
          title: 'Azione Astuta',
          description:
            'Puoi usare un\'azione bonus ad ogni turno in combattimento per Scattare, Disimpegnarsi o Nascondersi.',
          icon: 'running',
        })
      }
    }

    if (charClass === 'paladin') {
      features.push({
        title: 'Percezione del Divino',
        description:
          'Come azione, percepisci celestiali, immondi e non morti entro 18 metri. Puoi usare questa abilità un numero di volte pari a 1 + il tuo modificatore di Carisma.',
        icon: 'eye',
      })
    }

    if (charClass === 'barbarian') {
      if (level >= 1) {
        features.push({
          title: 'Ira',
          description:
            'In battaglia, combatti con ferocia primordiale. Durante il tuo turno, puoi entrare in ira come azione bonus. In ira, ottieni vantaggio ai tiri per colpire di Forza, bonus ai danni di Forza e resistenza ai danni fisici.',
          icon: 'fire',
        })
      }
    }

    if (charClass === 'fighter') {
      if (level >= 1) {
        features.push({
          title: 'Second Wind',
          description:
            'Hai una riserva limitata di stamina. Durante il tuo turno, puoi usare un\'azione bonus per recuperare PF pari a 1d10 + il tuo livello da guerriero. Puoi usare questa abilità una volta per riposo breve o lungo.',
          icon: 'heart',
        })
      }
    }

    return features
  }

  // Race features (hardcoded for common races - could be from Open5e later)
  const getRaceFeatures = (): Array<{ title: string; description: string; icon: string }> => {
    const features: Array<{ title: string; description: string; icon: string }> = []
    const race = character.race?.toLowerCase()

    if (race?.includes('elf')) {
      features.push({
        title: 'Scurovisione',
        description:
          'Puoi vedere in condizioni di luce fioca entro 18 metri come se fosse luce intensa, e al buio come se fosse luce fioca. Non puoi discernere i colori al buio, solo sfumature di grigio.',
        icon: 'eye',
      })
      features.push({
        title: 'Ascendenza Fatata',
        description:
          'Hai vantaggio ai tiri salvezza contro charme e non puoi essere addormentato magicamente.',
        icon: 'sparkles',
      })
      features.push({
        title: 'Trance',
        description:
          'Gli elfi non dormono. Meditano in trance per 4 ore al giorno, ottenendo gli stessi benefici di 8 ore di sonno per un umano.',
        icon: 'moon',
      })
    }

    if (race?.includes('dwarf')) {
      features.push({
        title: 'Scurovisione',
        description:
          'Puoi vedere in condizioni di luce fioca entro 18 metri come se fosse luce intensa, e al buio come se fosse luce fioca. Non puoi discernere i colori al buio, solo sfumature di grigio.',
        icon: 'eye',
      })
      features.push({
        title: 'Resilienza Nanica',
        description: 'Hai vantaggio ai tiri salvezza contro veleno e resistenza ai danni da veleno.',
        icon: 'shield',
      })
    }

    if (race?.includes('halfling')) {
      features.push({
        title: 'Fortunato',
        description:
          'Quando ottieni un 1 naturale in un tiro per colpire, tiro abilità o tiro salvezza, puoi ritirare il dado. Devi usare il nuovo risultato.',
        icon: 'dice',
      })
      features.push({
        title: 'Coraggioso',
        description: 'Hai vantaggio ai tiri salvezza contro paura.',
        icon: 'shield',
      })
      features.push({
        title: 'Agilità Halfling',
        description:
          'Puoi muoverti attraverso lo spazio di qualsiasi creatura di taglia superiore alla tua.',
        icon: 'running',
      })
    }

    if (race?.includes('human')) {
      features.push({
        title: 'Versatilità Umana',
        description:
          'Gli umani sono adattabili e diversificati. Ottieni competenza in un\'abilità a tua scelta.',
        icon: 'star',
      })
    }

    if (race?.includes('dragonborn')) {
      features.push({
        title: 'Arma a Soffio',
        description:
          'Puoi usare la tua azione per esalare energia distruttiva. La forma, la dimensione e il tipo di danno dipendono dal tipo di drago da cui discendi.',
        icon: 'fire',
      })
      features.push({
        title: 'Resistenza ai Danni',
        description: 'Hai resistenza al tipo di danno associato alla tua discendenza dracomica.',
        icon: 'shield',
      })
    }

    if (race?.includes('tiefling')) {
      features.push({
        title: 'Scurovisione',
        description:
          'Grazie alla tua eredità infernale, puoi vedere al buio entro 18 metri.',
        icon: 'eye',
      })
      features.push({
        title: 'Resistenza Infernale',
        description: 'Hai resistenza ai danni da fuoco.',
        icon: 'fire',
      })
    }

    return features
  }

  const classFeatures = getClassFeatures()
  const raceFeatures = getRaceFeatures()
  const hasFightingStyle = character.fighting_style
  const hasSubclass = character.subclass

  return (
    <div className="features-panel space-y-6">
      {/* Class Resources (with limited uses) */}
      {classResources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="energy" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Risorse di Classe</h3>
          </div>
          <div className="space-y-3">
            {classResources.map((resource) => (
              <FeatureCard
                key={resource.id}
                title={resource.name}
                description={resource.description}
                source={`${resource.class.charAt(0).toUpperCase() + resource.class.slice(1)}`}
                uses={{
                  current: resource.current,
                  max: resource.max,
                  recharge: resource.recharge,
                }}
                icon="energy"
              />
            ))}
          </div>
        </div>
      )}

      {/* Class Features */}
      {classFeatures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="scroll" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Privilegi di Classe</h3>
          </div>
          <div className="space-y-3">
            {classFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                source={character.class ? character.class.charAt(0).toUpperCase() + character.class.slice(1) : 'Classe'}
                icon={feature.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fighting Style (Fighter, Paladin, Ranger) */}
      {hasFightingStyle && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="sword" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Stile di Combattimento</h3>
          </div>
          <FeatureCard
            title={hasFightingStyle}
            description="Hai adottato uno stile di combattimento particolare che ti garantisce benefici specifici."
            source={character.class ? character.class.charAt(0).toUpperCase() + character.class.slice(1) : 'Classe'}
            icon="sword"
          />
        </div>
      )}

      {/* Subclass */}
      {hasSubclass && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="book" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Sottoclasse</h3>
          </div>
          <FeatureCard
            title={hasSubclass}
            description={`Hai scelto la sottoclasse ${hasSubclass}.`}
            source={character.class ? character.class.charAt(0).toUpperCase() + character.class.slice(1) : 'Classe'}
            icon="book"
          />
        </div>
      )}

      {/* Eldritch Invocations (Warlock) */}
      {eldritchInvocations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="sparkles" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Invocazioni Arcane</h3>
          </div>
          <div className="space-y-3">
            {eldritchInvocations.map((invocation, index) => (
              <FeatureCard
                key={index}
                title={invocation}
                description="Invocazione arcana ottenuta dal tuo patrono."
                source="Warlock"
                icon="sparkles"
              />
            ))}
          </div>
        </div>
      )}

      {/* Race Features */}
      {raceFeatures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GameIcon name="user" category="ui" size={24} className="text-[var(--teal)]" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)]">Tratti Razziali</h3>
          </div>
          <div className="space-y-3">
            {raceFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                source={character.race?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Razza'}
                icon={feature.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {classResources.length === 0 &&
        classFeatures.length === 0 &&
        raceFeatures.length === 0 &&
        !hasFightingStyle &&
        !hasSubclass &&
        eldritchInvocations.length === 0 && (
          <div className="parchment-card p-8 text-center">
            <GameIcon name="book" category="ui" size={48} className="text-[var(--ink-faded)] mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-[var(--ink)] mb-2">
              Nessun Privilegio Disponibile
            </h3>
            <p className="text-[var(--ink-light)] text-sm">
              I privilegi di classe e razza verranno visualizzati qui quando disponibili.
            </p>
          </div>
        )}
    </div>
  )
}
