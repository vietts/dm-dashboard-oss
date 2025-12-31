'use client'

import { Character, ClassResource } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { InfoTooltip } from '@/components/ui/tooltip'

interface ResourceTrackerProps {
  character: Character
}

// Spell slot structure by class level (simplified for common casters)
const SPELL_SLOTS_BY_LEVEL: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
}

// Class resource descriptions for tooltips
const CLASS_RESOURCE_TOOLTIPS: Record<string, string> = {
  'recupero arcano': 'Una volta per riposo corto, recuperi slot incantesimo di livello totale pari a metà del tuo livello da mago (arrotondato per eccesso).',
  'arcane recovery': 'Once per short rest, recover spell slots with combined level equal to half your wizard level (rounded up).',
  'channel divinity': 'Puoi incanalare energia divina per alimentare effetti magici. Ricarica dopo un riposo breve o lungo.',
  'canalizzare divinità': 'Puoi incanalare energia divina per alimentare effetti magici. Ricarica dopo un riposo breve o lungo.',
  'wild shape': 'Puoi trasformarti magicamente in una bestia che hai visto. Ricarica dopo un riposo breve o lungo.',
  'forma selvaggia': 'Puoi trasformarti magicamente in una bestia che hai visto. Ricarica dopo un riposo breve o lungo.',
  'rage': 'In battaglia, combatti con ferocia primordiale. Ottieni bonus ai danni e resistenza.',
  'ira': 'In battaglia, combatti con ferocia primordiale. Ottieni bonus ai danni e resistenza.',
  'bardic inspiration': 'Puoi ispirare gli altri con parole o musica. Il bersaglio può aggiungere il dado al suo tiro.',
  'ispirazione bardica': 'Puoi ispirare gli altri con parole o musica. Il bersaglio può aggiungere il dado al suo tiro.',
  'ki': 'Punti di energia mistica che alimentano le tue abilità monastiche.',
  'sorcery points': 'Punti che puoi usare per creare slot incantesimo o alimentare metamagie.',
  'punti stregoneria': 'Punti che puoi usare per creare slot incantesimo o alimentare metamagie.',
  'superiority dice': 'Dadi che alimentano le tue manovre di combattimento.',
  'dadi superiorità': 'Dadi che alimentano le tue manovre di combattimento.',
  'lay on hands': 'Puoi curare toccando una creatura. Hai un pool di punti ferita pari a 5 × livello paladino.',
  'imposizione delle mani': 'Puoi curare toccando una creatura. Hai un pool di punti ferita pari a 5 × livello paladino.',
}

// Check if class is a full caster
function isFullCaster(className: string | null): boolean {
  if (!className) return false
  const casterClasses = ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'warlock']
  return casterClasses.some(c => className.toLowerCase().includes(c))
}

// Get hit die based on class
function getHitDie(className: string | null): number {
  if (!className) return 8
  const cl = className.toLowerCase()
  if (cl.includes('barbarian')) return 12
  if (cl.includes('fighter') || cl.includes('paladin') || cl.includes('ranger')) return 10
  if (cl.includes('sorcerer') || cl.includes('wizard')) return 6
  return 8 // Default for most classes
}

// Get tooltip for a resource - prioritize custom description, fallback to generic
function getResourceTooltip(resource: ClassResource): string | null {
  // First check if the resource has a custom description from DB
  if (resource.description && resource.description.trim()) {
    return resource.description
  }
  // Fallback to generic tooltip
  const key = resource.name.toLowerCase()
  return CLASS_RESOURCE_TOOLTIPS[key] || null
}

export default function ResourceTracker({ character }: ResourceTrackerProps) {
  const classResources = character.class_resources as ClassResource[] | null

  // Get spell slots for casters
  const spellSlots = isFullCaster(character.class) ? SPELL_SLOTS_BY_LEVEL[character.level] || [] : []
  const hitDie = getHitDie(character.class)

  return (
    <div className="parchment-card p-4">
      {/* Horizontal layout - flex wrap */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* Hit Dice */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--ink-light)]">Dadi Vita:</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-[var(--ink)]">{character.level}d{hitDie}</span>
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: Math.min(character.level, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded bg-[var(--teal)] flex items-center justify-center"
                >
                  <GameIcon name="d20" category="ui" size={12} className="text-white" />
                </div>
              ))}
              {character.level > 5 && (
                <span className="text-xs text-[var(--ink-faded)] ml-1">+{character.level - 5}</span>
              )}
            </div>
          </div>
        </div>

        {/* Spell Slots (for casters) - Inline */}
        {spellSlots.length > 0 && (
          <div className="flex items-center gap-2">
            <GameIcon name="book" category="ui" size={14} className="text-purple-500" />
            <span className="text-sm text-[var(--ink-light)]">Slot:</span>
            <div className="flex gap-2">
              {spellSlots.map((slots, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-xs text-[var(--ink-faded)]">{index + 1}°</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: slots }).map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full bg-purple-500 border border-purple-400"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class Resources - Inline with tooltips */}
        {classResources && classResources.length > 0 && classResources.map((resource) => {
          const tooltip = getResourceTooltip(resource)
          const isPassive = resource.recharge === 'passive'

          return (
            <div
              key={resource.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                isPassive
                  ? 'bg-[var(--ink)]/5 border border-[var(--ink)]/10'
                  : 'bg-[var(--cream-dark)]'
              }`}
            >
              <span className={`text-sm ${isPassive ? 'text-[var(--ink-light)]' : 'text-[var(--ink)]'}`}>
                {resource.name}
              </span>
              {tooltip && <InfoTooltip content={tooltip} />}

              {/* Show counter only for non-passive resources */}
              {!isPassive && (
                <>
                  <span className="text-sm font-medium text-[var(--ink)]">
                    {resource.current}/{resource.max}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: resource.max }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          i < resource.current
                            ? 'bg-[var(--health-mid)] border border-amber-400'
                            : 'bg-[var(--cream)] border border-[var(--border-decorative)]'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Recharge badge */}
              <span className="text-[10px] text-[var(--ink-faded)] flex items-center gap-0.5">
                {isPassive ? (
                  <>
                    <span className="text-xs">∞</span>
                    sempre
                  </>
                ) : (
                  <>
                    <GameIcon name={resource.recharge === 'short' ? 'hourglass' : 'rest'} category="ui" size={10} />
                    {resource.recharge === 'short' ? 'breve' : 'lungo'}
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Death Saves (only when at 0 HP) */}
      {character.current_hp <= 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-decorative)]">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--coral)] flex items-center gap-1">
              <GameIcon name="skull" category="ui" size={16} />
              Tiri Morte
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-light)]">✓</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < character.death_save_successes
                        ? 'bg-[var(--teal)]'
                        : 'bg-[var(--cream)] border-2 border-[var(--border-decorative)]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-light)]">✗</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < character.death_save_failures
                        ? 'bg-[var(--coral)]'
                        : 'bg-[var(--cream)] border-2 border-[var(--border-decorative)]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
