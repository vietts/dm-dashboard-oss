/**
 * Class Resources Seed Data
 *
 * Contiene le risorse tracciabili per ogni classe D&D 5e.
 * Queste risorse vengono popolate nel campo `class_resources` (JSON)
 * della tabella dnd_characters.
 */

export interface ClassResourceSeed {
  id: string
  name: string
  current: number
  max: number
  recharge: 'short' | 'long' | 'passive'
  description: string
}

/**
 * Interfaccia per i punteggi di abilità necessari per calcolare alcune risorse
 */
export interface AbilityScores {
  str?: number | null
  dex?: number | null
  con?: number | null
  int?: number | null
  wis?: number | null
  cha?: number | null
}

/**
 * Calcola il modificatore da un punteggio di abilità
 */
function getModifier(score: number | null | undefined): number {
  if (!score) return 0
  return Math.floor((score - 10) / 2)
}

// ============================================================================
// ROGUE (Ladro)
// ============================================================================

export function getRogueResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  // Il Ladro a livello 2 non ha risorse tracciabili separate
  // Attacco Furtivo è gestito come azione con recharge "turn"
  // Azione Scaltra è illimitata
  return []
}

// ============================================================================
// FIGHTER (Guerriero)
// ============================================================================

export function getFighterResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  // Il Guerriero a livello 2 ha Recuperare Energie e Azione Impetuosa
  // Ma sono entrambe gestite come azioni in dnd_character_actions
  // quindi non serve duplicarle qui
  return []
}

// ============================================================================
// PALADIN (Paladino)
// ============================================================================

export function getPaladinResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  return [
    {
      id: 'lay-on-hands',
      name: 'Imposizione delle Mani (Pool PF)',
      current: level * 5,
      max: level * 5,
      recharge: 'long',
      description: 'Azione Bonus: tocchi una creatura e curi PF attingendo da questa riserva. Puoi anche spendere 5 PF per curare una malattia o un veleno.',
    },
  ]
}

// ============================================================================
// WIZARD (Mago)
// ============================================================================

export function getWizardResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  // Recupero Arcano: recupera slot con livelli totali = metà livello mago (arrotondato per eccesso)
  const recoverySlotLevels = Math.ceil(level / 2)

  return [
    {
      id: 'arcane-recovery',
      name: 'Recupero Arcano',
      current: 1,
      max: 1,
      recharge: 'long',
      description: `Una volta per riposo lungo, durante un riposo breve puoi recuperare slot incantesimo spesi. Gli slot possono avere un livello combinato pari a ${recoverySlotLevels} (metà del tuo livello da mago, arrotondato per eccesso). Non puoi recuperare slot di livello 6° o superiore.`,
    },
  ]
}

// ============================================================================
// WARLOCK
// ============================================================================

export function getWarlockResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  // IMPORTANTE: Gli slot patto del Warlock sono gestiti separatamente
  // (recharge su riposo breve, non lungo)
  // Scaltrezza Magica è in dnd_character_actions

  return [
    {
      id: 'eldritch-versatility',
      name: 'Scaltrezza Magica',
      current: 1,
      max: 1,
      recharge: 'long',
      description: 'Azione Bonus: recuperi 1 slot incantesimo speso (il livello è uguale al tuo livello slot patto). Puoi usare questa abilità 1 volta per riposo lungo.',
    },
  ]

  // Nota: Le Suppliche Occulte (Eldritch Invocations) sono permanenti
  // e salvate in character.eldritch_invocations (JSON array)
}

// ============================================================================
// RANGER
// ============================================================================

export function getRangerResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  // Il Ranger a livello 2 non ha risorse tracciabili separate
  // Marchio del Cacciatore usa slot incantesimo (gestiti in spell system)
  return []
}

// ============================================================================
// BARD (Bardo)
// ============================================================================

export function getBardResources(level: number, abilities: AbilityScores): ClassResourceSeed[] {
  const charismaMod = Math.max(1, getModifier(abilities.cha))  // Minimo 1

  return [
    {
      id: 'bardic-inspiration',
      name: 'Ispirazione Bardica',
      current: charismaMod,
      max: charismaMod,
      recharge: 'long',
      description: `Azione Bonus: un alleato entro 18m che può sentirti ottiene un d6 Ispirazione Bardica da aggiungere a un tiro per colpire, salvezza o prova di caratteristica entro 10 minuti. Puoi usare questa abilità ${charismaMod} volte (= mod. Carisma). Recupera dopo riposo lungo.`,
    },
  ]
}

// ============================================================================
// FUNZIONI DI LOOKUP
// ============================================================================

/**
 * Ottiene le risorse per una specifica classe e livello.
 *
 * @param className - Nome della classe (case-insensitive)
 * @param level - Livello del personaggio
 * @param abilities - Punteggi di abilità del personaggio
 * @returns Array di risorse da salvare in class_resources
 */
export function getClassResources(
  className: string,
  level: number,
  abilities: AbilityScores = {}
): ClassResourceSeed[] {
  const normalizedClass = className.toLowerCase().trim()

  if (level < 1) return []

  // Map class names (supporta varianti italiane/inglesi)
  if (normalizedClass.includes('rogue') || normalizedClass.includes('ladro')) {
    return getRogueResources(level, abilities)
  }

  if (normalizedClass.includes('fighter') || normalizedClass.includes('guerriero')) {
    return getFighterResources(level, abilities)
  }

  if (normalizedClass.includes('paladin')) {
    return getPaladinResources(level, abilities)
  }

  if (normalizedClass.includes('wizard') || normalizedClass.includes('mago')) {
    return getWizardResources(level, abilities)
  }

  if (normalizedClass.includes('warlock') || normalizedClass.includes('stregone')) {
    return getWarlockResources(level, abilities)
  }

  if (normalizedClass.includes('ranger')) {
    return getRangerResources(level, abilities)
  }

  if (normalizedClass.includes('bard') || normalizedClass.includes('bardo')) {
    return getBardResources(level, abilities)
  }

  // Classe non riconosciuta
  console.warn(`Class "${className}" non riconosciuta in getClassResources`)
  return []
}

/**
 * Aggiorna i valori max delle risorse in base al livello/abilità attuali.
 * Utile quando il personaggio sale di livello o aumenta le caratteristiche.
 *
 * @param currentResources - Risorse attuali del personaggio
 * @param className - Classe del personaggio
 * @param level - Livello attuale
 * @param abilities - Punteggi di abilità attuali
 * @returns Risorse aggiornate con nuovi valori max
 */
export function updateResourceMaxValues(
  currentResources: ClassResourceSeed[],
  className: string,
  level: number,
  abilities: AbilityScores
): ClassResourceSeed[] {
  const freshResources = getClassResources(className, level, abilities)

  // Merge: mantieni current values, aggiorna max
  return currentResources.map((current) => {
    const fresh = freshResources.find((r) => r.id === current.id)
    if (!fresh) return current  // Risorsa rimossa (non dovrebbe succedere)

    return {
      ...current,
      max: fresh.max,  // Aggiorna max
      description: fresh.description,  // Aggiorna descrizione (se cambiata)
    }
  })
}
