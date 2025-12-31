// D&D 5e Utilities

import type { ClassResource } from '@/types/database'

// Condizioni con descrizioni e icone
// iconSvg = nome file SVG in /public/icons/conditions/
// iconEmoji = fallback emoji
export const CONDITIONS = {
  blinded: {
    name: 'Blinded',
    nameIt: 'Accecato',
    icon: '👁️',
    iconSvg: 'blinded',
    description: 'Auto-fail sight checks, attacks have disadvantage, attacks against have advantage',
  },
  charmed: {
    name: 'Charmed',
    nameIt: 'Affascinato',
    icon: '💖',
    iconSvg: 'charmed',
    description: "Can't attack charmer, charmer has advantage on social checks",
  },
  deafened: {
    name: 'Deafened',
    nameIt: 'Assordato',
    icon: '🔇',
    iconSvg: 'deafened',
    description: 'Auto-fail hearing checks',
  },
  frightened: {
    name: 'Frightened',
    nameIt: 'Spaventato',
    icon: '😨',
    iconSvg: 'frightened',
    description: "Disadvantage while source is visible, can't willingly move closer",
  },
  grappled: {
    name: 'Grappled',
    nameIt: 'Afferrato',
    icon: '🤝',
    iconSvg: 'grappled',
    description: 'Speed 0, ends if grappler incapacitated or moved away',
  },
  incapacitated: {
    name: 'Incapacitated',
    nameIt: 'Incapacitato',
    icon: '💫',
    iconSvg: 'incapacitated',
    description: "Can't take actions or reactions",
  },
  invisible: {
    name: 'Invisible',
    nameIt: 'Invisibile',
    icon: '👻',
    iconSvg: 'invisible',
    description: 'Attacks have advantage, attacks against have disadvantage',
  },
  paralyzed: {
    name: 'Paralyzed',
    nameIt: 'Paralizzato',
    icon: '🧊',
    iconSvg: 'paralyzed',
    description: 'Incapacitated, auto-fail STR/DEX saves, attacks have advantage, hits within 5ft are crits',
  },
  petrified: {
    name: 'Petrified',
    nameIt: 'Pietrificato',
    icon: '🪨',
    iconSvg: 'petrified',
    description: 'Transformed to stone, incapacitated, unaware, resistance to all damage',
  },
  poisoned: {
    name: 'Poisoned',
    nameIt: 'Avvelenato',
    icon: '🤢',
    iconSvg: 'poisoned',
    description: 'Disadvantage on attacks and ability checks',
  },
  prone: {
    name: 'Prone',
    nameIt: 'Prono',
    icon: '🛌',
    iconSvg: 'prone',
    description: 'Crawl only, disadvantage on attacks, melee within 5ft has advantage, ranged has disadvantage',
  },
  restrained: {
    name: 'Restrained',
    nameIt: 'Trattenuto',
    icon: '⛓️',
    iconSvg: 'restrained',
    description: 'Speed 0, attacks have disadvantage, attacks against have advantage, disadvantage on DEX saves',
  },
  stunned: {
    name: 'Stunned',
    nameIt: 'Stordito',
    icon: '💥',
    iconSvg: 'stunned',
    description: 'Incapacitated, auto-fail STR/DEX saves, attacks have advantage',
  },
  unconscious: {
    name: 'Unconscious',
    nameIt: 'Privo di sensi',
    icon: '💤',
    iconSvg: 'unconscious',
    description: 'Incapacitated, drop items, fall prone, auto-fail STR/DEX saves, hits within 5ft are crits',
  },
} as const

// Exhaustion levels
export const EXHAUSTION_EFFECTS = [
  null, // Level 0 - no effect
  'Disadvantage on ability checks',
  'Speed halved',
  'Disadvantage on attacks and saves',
  'HP maximum halved',
  'Speed reduced to 0',
  'Death',
] as const

// XP thresholds by level (for encounter difficulty)
export const XP_THRESHOLDS = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
} as const

// CR to XP mapping
export const CR_XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
}

// Multiplier based on number of monsters
export const ENCOUNTER_MULTIPLIERS = [
  { count: 1, multiplier: 1 },
  { count: 2, multiplier: 1.5 },
  { count: 3, multiplier: 2 },
  { count: 7, multiplier: 2.5 },
  { count: 11, multiplier: 3 },
  { count: 15, multiplier: 4 },
] as const

/**
 * Calculate encounter difficulty
 */
export function calculateEncounterDifficulty(
  monsterCRs: string[],
  partyLevels: number[]
): { difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly' | 'Trivial'; adjustedXP: number; thresholds: { easy: number; medium: number; hard: number; deadly: number } } {
  // Calculate total XP from monsters
  const totalXP = monsterCRs.reduce((sum, cr) => sum + (CR_XP[cr] || 0), 0)

  // Get multiplier based on monster count
  const monsterCount = monsterCRs.length
  let multiplier = 1
  for (const tier of ENCOUNTER_MULTIPLIERS) {
    if (monsterCount >= tier.count) {
      multiplier = tier.multiplier
    }
  }

  // Adjust for party size
  if (partyLevels.length < 3) multiplier += 0.5
  if (partyLevels.length > 5) multiplier -= 0.5

  const adjustedXP = Math.round(totalXP * multiplier)

  // Calculate party thresholds
  const thresholds = partyLevels.reduce(
    (acc, level) => {
      const levelThresholds = XP_THRESHOLDS[level as keyof typeof XP_THRESHOLDS] || XP_THRESHOLDS[1]
      return {
        easy: acc.easy + levelThresholds.easy,
        medium: acc.medium + levelThresholds.medium,
        hard: acc.hard + levelThresholds.hard,
        deadly: acc.deadly + levelThresholds.deadly,
      }
    },
    { easy: 0, medium: 0, hard: 0, deadly: 0 }
  )

  // Determine difficulty
  let difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly' | 'Trivial' = 'Trivial'
  if (adjustedXP >= thresholds.deadly) difficulty = 'Deadly'
  else if (adjustedXP >= thresholds.hard) difficulty = 'Hard'
  else if (adjustedXP >= thresholds.medium) difficulty = 'Medium'
  else if (adjustedXP >= thresholds.easy) difficulty = 'Easy'

  return { difficulty, adjustedXP, thresholds }
}

/**
 * Roll dice (e.g., "2d6+3")
 */
export function rollDice(notation: string): { total: number; rolls: number[]; modifier: number } {
  const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/i)
  if (!match) return { total: 0, rolls: [], modifier: 0 }

  const count = parseInt(match[1] || '1')
  const sides = parseInt(match[2])
  const modifier = parseInt(match[3] || '0')

  const rolls: number[] = []
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }

  const total = rolls.reduce((a, b) => a + b, 0) + modifier
  return { total, rolls, modifier }
}

/**
 * Roll initiative (d20 + modifier)
 */
export function rollInitiative(modifier: number = 0): number {
  return rollDice(`1d20+${modifier}`).total
}

/**
 * Calculate ability modifier from score
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Format modifier with + or - sign
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// D&D Classes with colors and icons
// icon = nome file SVG in /public/icons/classes/
export const DND_CLASSES = {
  barbarian: { name: 'Barbarian', color: '#E7623E', icon: 'barbarian' },
  bard: { name: 'Bard', color: '#AB6DAC', icon: 'bard' },
  cleric: { name: 'Cleric', color: '#91A1B2', icon: 'cleric' },
  druid: { name: 'Druid', color: '#7A853B', icon: 'druid' },
  fighter: { name: 'Fighter', color: '#7F513E', icon: 'fighter' },
  monk: { name: 'Monk', color: '#51A5C5', icon: 'monk' },
  paladin: { name: 'Paladin', color: '#B59E54', icon: 'paladin' },
  ranger: { name: 'Ranger', color: '#507F62', icon: 'ranger' },
  rogue: { name: 'Rogue', color: '#555752', icon: 'rogue' },
  sorcerer: { name: 'Sorcerer', color: '#992E2E', icon: 'sorcerer' },
  warlock: { name: 'Warlock', color: '#7B469B', icon: 'warlock' },
  wizard: { name: 'Wizard', color: '#2A50A1', icon: 'wizard' },
  artificer: { name: 'Artificer', color: '#C47135', icon: 'artificer' },
} as const

export type DndClass = keyof typeof DND_CLASSES

// D&D Races Interface
export interface DndRace {
  name: string           // Nome italiano
  nameEn: string         // Nome inglese (per compatibilità)
  size: 'Piccola' | 'Media' | 'Grande'
  speed: number          // Velocità base in ft
  asi: {                 // Ability Score Increases strutturati
    str?: number
    dex?: number
    con?: number
    int?: number
    wis?: number
    cha?: number
  }
  asiChoice?: {          // Per razze con scelta (es. Mezzelfo)
    count: number        // Quanti bonus scegliere
    bonus: number        // Valore del bonus
    exclude?: ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[] // Caratteristiche escluse
  }
  traits: string[]       // Tratti principali (breve lista in italiano)
  languages: string[]    // Linguaggi
  darkvision?: number    // Distanza scurovisione in ft (se presente)
}

// D&D 5e Races - SRD + PHB con traduzione italiana
export const DND_RACES: Record<string, DndRace> = {
  // === RAZZE PHB CORE ===
  human: {
    name: 'Umano',
    nameEn: 'Human',
    size: 'Media',
    speed: 30,
    asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: ['Versatile', 'Linguaggio extra'],
    languages: ['Comune', '+1 a scelta']
  },

  // Elfi
  'high-elf': {
    name: 'Alto Elfo',
    nameEn: 'High Elf',
    size: 'Media',
    speed: 30,
    asi: { dex: 2, int: 1 },
    traits: ['Scurovisione', 'Sensi Acuti', 'Ascendenza Fatata', 'Trance', 'Trucchetto da mago'],
    languages: ['Comune', 'Elfico', '+1 a scelta'],
    darkvision: 60
  },
  'wood-elf': {
    name: 'Elfo dei Boschi',
    nameEn: 'Wood Elf',
    size: 'Media',
    speed: 35,
    asi: { dex: 2, wis: 1 },
    traits: ['Scurovisione', 'Sensi Acuti', 'Ascendenza Fatata', 'Trance', 'Maschera della Selva'],
    languages: ['Comune', 'Elfico'],
    darkvision: 60
  },
  'dark-elf': {
    name: 'Elfo Oscuro (Drow)',
    nameEn: 'Dark Elf (Drow)',
    size: 'Media',
    speed: 30,
    asi: { dex: 2, cha: 1 },
    traits: ['Scurovisione Superiore', 'Sensibilità alla Luce Solare', 'Magia Drow', 'Addestramento Drow'],
    languages: ['Comune', 'Elfico'],
    darkvision: 120
  },

  // Nani
  'hill-dwarf': {
    name: 'Nano delle Colline',
    nameEn: 'Hill Dwarf',
    size: 'Media',
    speed: 25,
    asi: { con: 2, wis: 1 },
    traits: ['Scurovisione', 'Resilienza Nanica', 'Addestramento Nanico', 'Durevolezza Nanica'],
    languages: ['Comune', 'Nanico'],
    darkvision: 60
  },
  'mountain-dwarf': {
    name: 'Nano delle Montagne',
    nameEn: 'Mountain Dwarf',
    size: 'Media',
    speed: 25,
    asi: { con: 2, str: 2 },
    traits: ['Scurovisione', 'Resilienza Nanica', 'Addestramento Nanico', 'Addestramento Armature'],
    languages: ['Comune', 'Nanico'],
    darkvision: 60
  },

  // Halfling
  'lightfoot-halfling': {
    name: 'Halfling Piedelesto',
    nameEn: 'Lightfoot Halfling',
    size: 'Piccola',
    speed: 25,
    asi: { dex: 2, cha: 1 },
    traits: ['Fortunato', 'Coraggioso', 'Agilità Halfling', 'Furtività Innata'],
    languages: ['Comune', 'Halfling']
  },
  'stout-halfling': {
    name: 'Halfling Tozzo',
    nameEn: 'Stout Halfling',
    size: 'Piccola',
    speed: 25,
    asi: { dex: 2, con: 1 },
    traits: ['Fortunato', 'Coraggioso', 'Agilità Halfling', 'Resilienza Tozza'],
    languages: ['Comune', 'Halfling']
  },

  // Gnomi
  'forest-gnome': {
    name: 'Gnomo delle Foreste',
    nameEn: 'Forest Gnome',
    size: 'Piccola',
    speed: 25,
    asi: { int: 2, dex: 1 },
    traits: ['Scurovisione', 'Astuzia Gnomesca', 'Illusionista Nato', 'Parlare con Piccole Bestie'],
    languages: ['Comune', 'Gnomesco'],
    darkvision: 60
  },
  'rock-gnome': {
    name: 'Gnomo delle Rocce',
    nameEn: 'Rock Gnome',
    size: 'Piccola',
    speed: 25,
    asi: { int: 2, con: 1 },
    traits: ['Scurovisione', 'Astuzia Gnomesca', 'Sapere Artigianale', 'Inventore'],
    languages: ['Comune', 'Gnomesco'],
    darkvision: 60
  },

  dragonborn: {
    name: 'Dragonide',
    nameEn: 'Dragonborn',
    size: 'Media',
    speed: 30,
    asi: { str: 2, cha: 1 },
    traits: ['Discendenza Draconica', 'Soffio del Drago', 'Resistenza ai Danni'],
    languages: ['Comune', 'Draconico']
  },

  'half-elf': {
    name: 'Mezzelfo',
    nameEn: 'Half-Elf',
    size: 'Media',
    speed: 30,
    asi: { cha: 2 },
    asiChoice: { count: 2, bonus: 1, exclude: ['cha'] },
    traits: ['Scurovisione', 'Ascendenza Fatata', 'Versatilità nelle Abilità'],
    languages: ['Comune', 'Elfico', '+1 a scelta'],
    darkvision: 60
  },

  'half-orc': {
    name: 'Mezzorco',
    nameEn: 'Half-Orc',
    size: 'Media',
    speed: 30,
    asi: { str: 2, con: 1 },
    traits: ['Scurovisione', 'Minaccioso', 'Resistenza Implacabile', 'Attacchi Selvaggi'],
    languages: ['Comune', 'Orchesco'],
    darkvision: 60
  },

  tiefling: {
    name: 'Tiefling',
    nameEn: 'Tiefling',
    size: 'Media',
    speed: 30,
    asi: { cha: 2, int: 1 },
    traits: ['Scurovisione', 'Resistenza Infernale', 'Eredità Infernale'],
    languages: ['Comune', 'Infernale'],
    darkvision: 60
  },

  // === RAZZE AGGIUNTIVE ===
  aarakocra: {
    name: 'Aarakocra',
    nameEn: 'Aarakocra',
    size: 'Media',
    speed: 25,
    asi: { dex: 2, wis: 1 },
    traits: ['Volo (50 ft)', 'Artigli'],
    languages: ['Comune', 'Aarakocra', 'Auran']
  },

  aasimar: {
    name: 'Aasimar',
    nameEn: 'Aasimar',
    size: 'Media',
    speed: 30,
    asi: { cha: 2, wis: 1 },
    traits: ['Scurovisione', 'Resistenza Celestiale', 'Mani Guaritrici', 'Portatore di Luce'],
    languages: ['Comune', 'Celestiale'],
    darkvision: 60
  },

  firbolg: {
    name: 'Firbolg',
    nameEn: 'Firbolg',
    size: 'Media',
    speed: 30,
    asi: { wis: 2, str: 1 },
    traits: ['Magia Firbolg', 'Passo Nascosto', 'Discorso Bestiale e Fogliare', 'Corporatura Potente'],
    languages: ['Comune', 'Elfico', 'Gigante']
  },

  // Genasi
  'air-genasi': {
    name: 'Genasi dell\'Aria',
    nameEn: 'Air Genasi',
    size: 'Media',
    speed: 30,
    asi: { con: 2, dex: 1 },
    traits: ['Trattenere il Respiro Indefinito', 'Unisci il Vento'],
    languages: ['Comune', 'Primordiale']
  },
  'earth-genasi': {
    name: 'Genasi della Terra',
    nameEn: 'Earth Genasi',
    size: 'Media',
    speed: 30,
    asi: { con: 2, str: 1 },
    traits: ['Camminare sulla Terra', 'Unisci la Pietra'],
    languages: ['Comune', 'Primordiale']
  },
  'fire-genasi': {
    name: 'Genasi del Fuoco',
    nameEn: 'Fire Genasi',
    size: 'Media',
    speed: 30,
    asi: { con: 2, int: 1 },
    traits: ['Scurovisione', 'Resistenza al Fuoco', 'Raggiungi la Fiamma'],
    languages: ['Comune', 'Primordiale'],
    darkvision: 60
  },
  'water-genasi': {
    name: 'Genasi dell\'Acqua',
    nameEn: 'Water Genasi',
    size: 'Media',
    speed: 30,
    asi: { con: 2, wis: 1 },
    traits: ['Anfibio', 'Nuoto (30 ft)', 'Resistenza Acida', 'Invoca l\'Onda'],
    languages: ['Comune', 'Primordiale']
  },

  goliath: {
    name: 'Goliath',
    nameEn: 'Goliath',
    size: 'Media',
    speed: 30,
    asi: { str: 2, con: 1 },
    traits: ['Nato nelle Montagne', 'Resistenza di Pietra', 'Corporatura Potente', 'Atleta Nato'],
    languages: ['Comune', 'Gigante']
  },

  kenku: {
    name: 'Kenku',
    nameEn: 'Kenku',
    size: 'Media',
    speed: 30,
    asi: { dex: 2, wis: 1 },
    traits: ['Falsario Esperto', 'Formazione Kenku', 'Mimica'],
    languages: ['Comune', 'Auran']
  },

  lizardfolk: {
    name: 'Uomo Lucertola',
    nameEn: 'Lizardfolk',
    size: 'Media',
    speed: 30,
    asi: { con: 2, wis: 1 },
    traits: ['Morso', 'Artigiano Astuto', 'Trattenere il Respiro', 'Cacciatore Naturale', 'Armatura Naturale', 'Fauci Affamate'],
    languages: ['Comune', 'Draconico']
  },

  tabaxi: {
    name: 'Tabaxi',
    nameEn: 'Tabaxi',
    size: 'Media',
    speed: 30,
    asi: { dex: 2, cha: 1 },
    traits: ['Scurovisione', 'Agilità Felina', 'Artigli del Gatto', 'Talento Felino'],
    languages: ['Comune', '+1 a scelta'],
    darkvision: 60
  },

  tortle: {
    name: 'Tortle',
    nameEn: 'Tortle',
    size: 'Media',
    speed: 30,
    asi: { str: 2, wis: 1 },
    traits: ['Artigli', 'Trattenere il Respiro', 'Armatura Naturale (CA 17)', 'Difesa del Guscio', 'Intuito del Sopravvissuto'],
    languages: ['Comune', 'Aquan']
  },

  triton: {
    name: 'Tritone',
    nameEn: 'Triton',
    size: 'Media',
    speed: 30,
    asi: { str: 1, con: 1, cha: 1 },
    traits: ['Anfibio', 'Nuoto (30 ft)', 'Controllo Aria e Acqua', 'Emissario del Mare', 'Guardiano delle Profondità'],
    languages: ['Comune', 'Primordiale']
  },

  'yuan-ti': {
    name: 'Yuan-ti Sangue Puro',
    nameEn: 'Yuan-ti Pureblood',
    size: 'Media',
    speed: 30,
    asi: { cha: 2, int: 1 },
    traits: ['Scurovisione', 'Magia Innata', 'Resistenza Magica', 'Immunità al Veleno'],
    languages: ['Comune', 'Abissale', 'Draconico'],
    darkvision: 60
  },

  // Razze "mostruose"
  bugbear: {
    name: 'Bugbear',
    nameEn: 'Bugbear',
    size: 'Media',
    speed: 30,
    asi: { str: 2, dex: 1 },
    traits: ['Scurovisione', 'Braccia Lunghe', 'Corporatura Potente', 'Furtivo', 'Attacco a Sorpresa'],
    languages: ['Comune', 'Goblin'],
    darkvision: 60
  },

  goblin: {
    name: 'Goblin',
    nameEn: 'Goblin',
    size: 'Piccola',
    speed: 30,
    asi: { dex: 2, con: 1 },
    traits: ['Scurovisione', 'Furia del Piccolo', 'Fuga Agile'],
    languages: ['Comune', 'Goblin'],
    darkvision: 60
  },

  hobgoblin: {
    name: 'Hobgoblin',
    nameEn: 'Hobgoblin',
    size: 'Media',
    speed: 30,
    asi: { con: 2, int: 1 },
    traits: ['Scurovisione', 'Addestramento Marziale', 'Salvare la Faccia'],
    languages: ['Comune', 'Goblin'],
    darkvision: 60
  },

  kobold: {
    name: 'Coboldo',
    nameEn: 'Kobold',
    size: 'Piccola',
    speed: 30,
    asi: { dex: 2 },
    traits: ['Scurovisione', 'Tattiche di Branco', 'Sensibilità alla Luce Solare'],
    languages: ['Comune', 'Draconico'],
    darkvision: 60
  },

  orc: {
    name: 'Orco',
    nameEn: 'Orc',
    size: 'Media',
    speed: 30,
    asi: { str: 2, con: 1 },
    traits: ['Scurovisione', 'Aggressivo', 'Resistenza Implacabile', 'Corporatura Potente'],
    languages: ['Comune', 'Orchesco'],
    darkvision: 60
  },
} as const

export type DndRaceKey = keyof typeof DND_RACES

// Class Resource Templates - defines default resources by class and level

type AbilityScores = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

export function getClassResources(
  characterClass: string | null,
  level: number,
  abilityScores: AbilityScores
): ClassResource[] {
  if (!characterClass) return []

  const classKey = characterClass.toLowerCase()
  const chaMod = Math.floor((abilityScores.cha - 10) / 2)

  switch (classKey) {
    case 'barbarian':
      return [{
        id: 'rage',
        name: 'Rage',
        max: level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2,
        current: level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2,
        recharge: 'long',
        class: 'barbarian'
      }]

    case 'bard':
      return [{
        id: 'bardic_inspiration',
        name: 'Ispirazione Bardica',
        max: Math.max(1, chaMod),
        current: Math.max(1, chaMod),
        recharge: level >= 5 ? 'short' : 'long',
        class: 'bard'
      }]

    case 'cleric':
      return [{
        id: 'channel_divinity',
        name: 'Incanalare Divinità',
        max: level >= 18 ? 3 : level >= 6 ? 2 : 1,
        current: level >= 18 ? 3 : level >= 6 ? 2 : 1,
        recharge: 'short',
        class: 'cleric'
      }]

    case 'druid':
      return [{
        id: 'wild_shape',
        name: 'Forma Selvatica',
        max: 2,
        current: 2,
        recharge: 'short',
        class: 'druid'
      }]

    case 'fighter': {
      const resources: ClassResource[] = [{
        id: 'second_wind',
        name: 'Secondo Vento',
        max: 1,
        current: 1,
        recharge: 'short',
        class: 'fighter'
      }]
      if (level >= 2) {
        resources.push({
          id: 'action_surge',
          name: 'Furia d\'Azione',
          max: level >= 17 ? 2 : 1,
          current: level >= 17 ? 2 : 1,
          recharge: 'short',
          class: 'fighter'
        })
      }
      if (level >= 9) {
        resources.push({
          id: 'indomitable',
          name: 'Indomabile',
          max: level >= 17 ? 3 : level >= 13 ? 2 : 1,
          current: level >= 17 ? 3 : level >= 13 ? 2 : 1,
          recharge: 'long',
          class: 'fighter'
        })
      }
      return resources
    }

    case 'monk':
      return [{
        id: 'ki',
        name: 'Punti Ki',
        max: level,
        current: level,
        recharge: 'short',
        class: 'monk'
      }]

    case 'paladin': {
      const resources: ClassResource[] = [{
        id: 'lay_on_hands',
        name: 'Imposizione delle Mani',
        max: level * 5,
        current: level * 5,
        recharge: 'long',
        class: 'paladin',
        description: 'Pool di HP curativi'
      }]
      if (level >= 3) {
        resources.push({
          id: 'channel_divinity',
          name: 'Incanalare Divinità',
          max: 1,
          current: 1,
          recharge: 'short',
          class: 'paladin'
        })
      }
      return resources
    }

    case 'ranger':
      // Rangers have passive abilities at level 1
      return [{
        id: 'favored_enemy',
        name: 'Nemico Prescelto',
        max: 0,
        current: 0,
        recharge: 'passive',
        class: 'ranger',
        description: 'Vantaggio su Sopravvivenza per tracciare. Conosci un linguaggio dei tuoi nemici.'
      }, {
        id: 'natural_explorer',
        name: 'Esploratore Nato',
        max: 0,
        current: 0,
        recharge: 'passive',
        class: 'ranger',
        description: 'Nel terreno favorito: viaggi veloci, foraggiamento doppio, non puoi perderti.'
      }]

    case 'rogue': {
      // Rogues have passive abilities
      const resources: ClassResource[] = [{
        id: 'sneak_attack',
        name: 'Attacco Furtivo',
        max: 0,
        current: 0,
        recharge: 'passive',
        class: 'rogue',
        description: `+${Math.ceil(level / 2)}d6 danni (1×/turno) con vantaggio o alleato in mischia col bersaglio`
      }]
      if (level >= 2) {
        resources.push({
          id: 'cunning_action',
          name: 'Azione Astuta',
          max: 0,
          current: 0,
          recharge: 'passive',
          class: 'rogue',
          description: 'Bonus action: Scatto, Disimpegno o Nascondersi'
        })
      }
      return resources
    }

    case 'sorcerer':
      return [{
        id: 'sorcery_points',
        name: 'Punti Stregoneria',
        max: level,
        current: level,
        recharge: 'long',
        class: 'sorcerer'
      }]

    case 'warlock': {
      const resources: ClassResource[] = [{
        id: 'pact_slots',
        name: 'Slot del Patto',
        max: level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1,
        current: level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1,
        recharge: 'short',
        class: 'warlock'
      }]
      // Mystic Arcanum (one-use high level spells)
      if (level >= 11) {
        resources.push({
          id: 'mystic_arcanum_6',
          name: 'Arcanum Mistico (6°)',
          max: 1,
          current: 1,
          recharge: 'long',
          class: 'warlock'
        })
      }
      if (level >= 13) {
        resources.push({
          id: 'mystic_arcanum_7',
          name: 'Arcanum Mistico (7°)',
          max: 1,
          current: 1,
          recharge: 'long',
          class: 'warlock'
        })
      }
      if (level >= 15) {
        resources.push({
          id: 'mystic_arcanum_8',
          name: 'Arcanum Mistico (8°)',
          max: 1,
          current: 1,
          recharge: 'long',
          class: 'warlock'
        })
      }
      if (level >= 17) {
        resources.push({
          id: 'mystic_arcanum_9',
          name: 'Arcanum Mistico (9°)',
          max: 1,
          current: 1,
          recharge: 'long',
          class: 'warlock'
        })
      }
      return resources
    }

    case 'wizard':
      return [{
        id: 'arcane_recovery',
        name: 'Recupero Arcano',
        max: 1,
        current: 1,
        recharge: 'long',
        class: 'wizard',
        description: `Recupera fino a ${Math.ceil(level / 2)} livelli di slot`
      }]

    case 'artificer':
      return [{
        id: 'flash_of_genius',
        name: 'Lampo di Genio',
        max: level >= 7 ? Math.max(1, Math.floor((abilityScores.int - 10) / 2)) : 0,
        current: level >= 7 ? Math.max(1, Math.floor((abilityScores.int - 10) / 2)) : 0,
        recharge: 'long',
        class: 'artificer'
      }]

    default:
      return []
  }
}
