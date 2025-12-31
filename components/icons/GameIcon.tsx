import { cn } from '@/lib/utils'

export type IconCategory = 'classes' | 'conditions' | 'ui'

interface GameIconProps {
  name: string
  category: IconCategory
  size?: number
  className?: string
}

/**
 * GameIcon component for rendering SVG icons from game-icons.net
 * Uses CSS mask-image to allow coloring via text color classes
 *
 * @example
 * <GameIcon name="barbarian" category="classes" size={24} className="text-red-500" />
 * <GameIcon name="poisoned" category="conditions" size={20} />
 */
export function GameIcon({
  name,
  category,
  size = 24,
  className
}: GameIconProps) {
  const iconUrl = `/icons/${category}/${name}.svg`

  return (
    <span
      role="img"
      aria-label={name}
      className={cn('inline-block bg-current', className)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maskImage: `url(${iconUrl})`,
        WebkitMaskImage: `url(${iconUrl})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}

// Class icon names mapped to D&D classes
export const CLASS_ICONS: Record<string, string> = {
  barbarian: 'barbarian',
  bard: 'bard',
  cleric: 'cleric',
  druid: 'druid',
  fighter: 'fighter',
  monk: 'monk',
  paladin: 'paladin',
  ranger: 'ranger',
  rogue: 'rogue',
  sorcerer: 'sorcerer',
  warlock: 'warlock',
  wizard: 'wizard',
  artificer: 'artificer',
}

// Condition icon names mapped to D&D conditions
export const CONDITION_ICONS: Record<string, string> = {
  blinded: 'blinded',
  charmed: 'charmed',
  deafened: 'deafened',
  frightened: 'frightened',
  grappled: 'grappled',
  incapacitated: 'incapacitated',
  invisible: 'invisible',
  paralyzed: 'paralyzed',
  petrified: 'petrified',
  poisoned: 'poisoned',
  prone: 'prone',
  restrained: 'restrained',
  stunned: 'stunned',
  unconscious: 'unconscious',
}

// UI icons for general interface elements
export const UI_ICONS: Record<string, string> = {
  d20: 'd20',              // Dice, loading
  combat: 'combat',        // Combat/swords
  dragon: 'dragon',        // Bestiary/encounters
  book: 'book',            // Spellbook
  quill: 'quill',          // Notes
  masks: 'masks',          // Party/characters
  skull: 'skull',          // Death saves
  scroll: 'scroll',        // Empty states
  heart: 'heart',          // Health/love
  hourglass: 'hourglass',  // Short rest
  rest: 'rest',            // Long rest
  path: 'path',            // Narrative path/branching
  compass: 'compass',      // Navigation/canvas controls
  flag: 'flag',            // Root node/starting point
}
