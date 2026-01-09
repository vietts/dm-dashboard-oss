/**
 * Class Actions Seed Data
 *
 * Contiene le azioni specifiche per ogni classe D&D 5e.
 * Queste azioni vengono popolate nella tabella dnd_character_actions
 * quando un personaggio viene creato o sale di livello.
 */

export interface ClassActionSeed {
  name: string
  description: string
  action_type: 'action' | 'bonus_action' | 'reaction' | 'other'
  attack_type?: 'melee' | 'ranged' | 'spell' | null
  range_value?: string | null
  hit_bonus?: number | null
  damage_dice?: string | null
  damage_type?: string | null
  limited_uses?: number | null
  uses_remaining?: number | null
  recharge_on?: 'short_rest' | 'long_rest' | 'dawn' | 'turn' | null
  source: string
  sort_order?: number
}

// ============================================================================
// ROGUE (Ladro)
// ============================================================================

export const ROGUE_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Azione Scaltra',
    description: 'Puoi usare un\'azione bonus per eseguire Scatto, Disimpegno o Nascondersi.',
    action_type: 'bonus_action',
    limited_uses: null,  // Illimitato
    recharge_on: null,
    source: 'Rogue Lv.2',
    sort_order: 1,
  },
  {
    name: 'Attacco Furtivo',
    description: '+1d6 danni (1 volta per turno). Richiede vantaggio al tiro per colpire OPPURE un alleato del bersaglio entro 1,5m da esso (e senza svantaggio al tiro).',
    action_type: 'action',
    damage_dice: '1d6',
    damage_type: 'dello stesso tipo dell\'arma',
    limited_uses: 1,
    uses_remaining: 1,
    recharge_on: 'turn',  // Si resetta ogni turno
    source: 'Rogue Lv.1',
    sort_order: 2,
  },
]

// ============================================================================
// FIGHTER (Guerriero)
// ============================================================================

export const FIGHTER_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Recuperare Energie',
    description: 'Azione Bonus: recuperi 1d10 + livello PF. Puoi usare questa abilità una volta per riposo breve o lungo.',
    action_type: 'bonus_action',
    limited_uses: 1,
    uses_remaining: 1,
    recharge_on: 'short_rest',
    source: 'Fighter Lv.1',
    sort_order: 1,
  },
  {
    name: 'Azione Impetuosa',
    description: 'Nel tuo turno, puoi eseguire 1 azione aggiuntiva (oltre alla normale azione e possibile azione bonus). Questa azione può essere usata solo per: Attacco (1 attacco con arma), Scatto, Disimpegno, Nascondersi o Utilizzo. Puoi usarla 1 volta per riposo breve/lungo.',
    action_type: 'action',
    limited_uses: 1,
    uses_remaining: 1,
    recharge_on: 'short_rest',
    source: 'Fighter Lv.2',
    sort_order: 2,
  },
]

// ============================================================================
// PALADIN (Paladino)
// ============================================================================

export const PALADIN_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Imposizione delle Mani',
    description: 'Azione Bonus: tocchi una creatura e curi PF attingendo dalla tua riserva (5 × livello). Vedi la risorsa "Imposizione delle Mani (Pool PF)" nel tracker risorse.',
    action_type: 'bonus_action',
    limited_uses: null,  // I uses sono tracciati nella risorsa class_resources
    recharge_on: null,
    source: 'Paladin Lv.1',
    sort_order: 1,
  },
  {
    name: 'Punizione Divina (bonus)',
    description: 'Quando colpisci una creatura con attacco con arma da mischia, puoi spendere uno slot incantesimo per infliggere 2d8 danni radiosi extra (+1d8 per ogni livello slot oltre il 1°). Hai anche 1 uso gratuito per riposo lungo (non consuma slot).',
    action_type: 'reaction',  // Tecnicamente è "reazione" dopo aver colpito
    damage_dice: '2d8',
    damage_type: 'radiosi',
    limited_uses: 1,  // 1 uso gratuito
    uses_remaining: 1,
    recharge_on: 'long_rest',
    source: 'Paladin Lv.2',
    sort_order: 2,
  },
  {
    name: 'Percezione del Divino',
    description: 'Azione: percepisci la presenza di creature aberranti, celestiali, demoniache, fatate o non-morti entro 18m (anche dietro copertura totale). Conosci il tipo ma non l\'identità. Percepisci anche luoghi/oggetti consacrati o profanati entro 18m.',
    action_type: 'action',
    limited_uses: null,  // Illimitato (al livello 2)
    recharge_on: null,
    source: 'Paladin Lv.1',
    sort_order: 3,
  },
]

// ============================================================================
// WIZARD (Mago)
// ============================================================================

export const WIZARD_ACTIONS: ClassActionSeed[] = [
  // I maghi a livello 2 non hanno azioni bonus o reazioni standard
  // Le reazioni arrivano da incantesimi specifici (es. Scudo, Controincantesimo al Lv.5+)
  // Nessuna azione base da aggiungere qui - le spell actions sono gestite in SpellManager
]

// ============================================================================
// WARLOCK
// ============================================================================

export const WARLOCK_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Scaltrezza Magica',
    description: 'Azione Bonus: recuperi 1 slot incantesimo speso (livello = livello slot patto). Puoi usarla 1 volta per riposo lungo.',
    action_type: 'bonus_action',
    limited_uses: 1,
    uses_remaining: 1,
    recharge_on: 'long_rest',
    source: 'Warlock Lv.2',
    sort_order: 1,
  },
  // Suppliche Occulte (Eldritch Invocations) - alcune possono dare azioni bonus
  // Ma sono specifiche della build e gestite separatamente
]

// ============================================================================
// RANGER
// ============================================================================

export const RANGER_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Marchio del Cacciatore',
    description: 'Azione Bonus: marchi una creatura entro 27m per 1 ora. Quando la colpisci con un\'arma, infliggi 1d6 danni extra. Hai vantaggio alle prove di Saggezza (Percezione o Sopravvivenza) per trovarla. Se cala a 0 PF, puoi usare azione bonus in un turno successivo per marchiare un nuovo bersaglio. Richiede concentrazione e consuma 1 slot incantesimo di 1° livello.',
    action_type: 'bonus_action',
    damage_dice: '1d6',
    damage_type: 'dello stesso tipo dell\'arma',
    limited_uses: null,  // Limitato dagli slot incantesimo
    recharge_on: null,
    source: 'Ranger Lv.2',
    sort_order: 1,
  },
]

// ============================================================================
// BARD (Bardo)
// ============================================================================

export const BARD_ACTIONS: ClassActionSeed[] = [
  {
    name: 'Ispirazione Bardica',
    description: 'Azione Bonus: un alleato entro 18m che può sentirti ottiene 1d6 da aggiungere a 1 tiro (attacco, salvezza o prova) entro 10 minuti. Puoi usarla un numero di volte pari al tuo modificatore di Carisma (minimo 1). Vedi la risorsa nel tracker.',
    action_type: 'bonus_action',
    limited_uses: null,  // Tracciato in class_resources
    recharge_on: null,
    source: 'Bard Lv.1',
    sort_order: 1,
  },
]

// ============================================================================
// FUNZIONE DI LOOKUP
// ============================================================================

/**
 * Ottiene le azioni per una specifica classe e livello.
 *
 * @param className - Nome della classe (case-insensitive)
 * @param level - Livello del personaggio
 * @returns Array di azioni da inserire nel database
 */
export function getClassActions(className: string, level: number): ClassActionSeed[] {
  const normalizedClass = className.toLowerCase().trim()

  // Level 2 actions (base)
  if (level < 1) return []

  // Map class names (supporta varianti italiane/inglesi)
  if (normalizedClass.includes('rogue') || normalizedClass.includes('ladro')) {
    return ROGUE_ACTIONS
  }

  if (normalizedClass.includes('fighter') || normalizedClass.includes('guerriero')) {
    return FIGHTER_ACTIONS
  }

  if (normalizedClass.includes('paladin')) {
    return PALADIN_ACTIONS
  }

  if (normalizedClass.includes('wizard') || normalizedClass.includes('mago')) {
    return WIZARD_ACTIONS
  }

  if (normalizedClass.includes('warlock') || normalizedClass.includes('stregone')) {
    return WARLOCK_ACTIONS
  }

  if (normalizedClass.includes('ranger')) {
    return RANGER_ACTIONS
  }

  if (normalizedClass.includes('bard') || normalizedClass.includes('bardo')) {
    return BARD_ACTIONS
  }

  // Classe non riconosciuta
  console.warn(`Class "${className}" non riconosciuta in getClassActions`)
  return []
}

/**
 * Ottiene tutte le azioni disponibili per una classe (tutte i livelli fino a quello attuale).
 *
 * Per ora supportiamo solo livello 2, ma in futuro questa funzione
 * potrebbe combinare azioni di più livelli.
 */
export function getAllClassActionsUpToLevel(className: string, level: number): ClassActionSeed[] {
  // Per ora ritorniamo semplicemente le azioni del livello corrente
  // In futuro: iterare da 1 a level e accumulare azioni
  return getClassActions(className, level)
}
