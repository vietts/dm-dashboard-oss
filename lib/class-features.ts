/**
 * D&D 5e Class Features Data
 * Dati statici per le feature di classe dal livello 1 al 5
 * Usati dal sistema di Level Up
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ClassFeature {
  id: string
  name: string
  nameEn: string
  level: number
  description: string
  requiresChoice?: boolean
  choiceType?: 'subclass' | 'fighting_style' | 'invocation' | 'spell' | 'skill' | 'expertise'
  choices?: FeatureChoice[]
  grantsResource?: ResourceGrant
}

export interface FeatureChoice {
  id: string
  name: string
  description: string
}

export interface ResourceGrant {
  resourceId: string
  name: string
  max: number
  recharge: 'short' | 'long'
}

export interface SpellProgression {
  cantripsKnown: number
  spellsKnown: number | null // null for prepared casters
  slots: Record<number, number> // spell level -> number of slots
}

// =============================================================================
// HIT DICE
// =============================================================================

export const CLASS_HIT_DICE: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
  artificer: 8,
}

export function getHitDieAverage(hitDie: number): number {
  return Math.ceil(hitDie / 2) + 1 // d10 -> 6, d8 -> 5, d12 -> 7, d6 -> 4
}

// =============================================================================
// FIGHTING STYLES (shared by Fighter, Paladin, Ranger)
// =============================================================================

export const FIGHTING_STYLES: FeatureChoice[] = [
  {
    id: 'archery',
    name: 'Tiro con Arco',
    description: '+2 ai tiri per colpire con armi a distanza',
  },
  {
    id: 'defense',
    name: 'Difesa',
    description: '+1 alla CA quando indossi un\'armatura',
  },
  {
    id: 'dueling',
    name: 'Duellare',
    description: '+2 ai danni in mischia con un\'arma a una mano e mano libera',
  },
  {
    id: 'great_weapon',
    name: 'Armi a Due Mani',
    description: 'Ritira 1 e 2 sui dadi danno con armi a due mani',
  },
  {
    id: 'protection',
    name: 'Protezione',
    description: 'Imponi svantaggio agli attacchi contro alleati adiacenti (richiede scudo)',
  },
  {
    id: 'two_weapon',
    name: 'Combattere con Due Armi',
    description: 'Aggiungi modificatore caratteristica ai danni dell\'arma secondaria',
  },
]

// =============================================================================
// ELDRITCH INVOCATIONS (Warlock)
// =============================================================================

export const ELDRITCH_INVOCATIONS: FeatureChoice[] = [
  {
    id: 'agonizing_blast',
    name: 'Deflagrazione Agonizzante',
    description: 'Aggiungi mod. CAR ai danni di Eldritch Blast',
  },
  {
    id: 'armor_of_shadows',
    name: 'Armatura d\'Ombre',
    description: 'Lancia Armatura Magica a volontà senza slot',
  },
  {
    id: 'beast_speech',
    name: 'Linguaggio delle Bestie',
    description: 'Lancia Parlare con gli Animali a volontà',
  },
  {
    id: 'beguiling_influence',
    name: 'Influenza Ammaliante',
    description: 'Competenza in Inganno e Persuasione',
  },
  {
    id: 'devils_sight',
    name: 'Vista del Diavolo',
    description: 'Vedi normalmente nell\'oscurità magica e non, 36 metri',
  },
  {
    id: 'eldritch_sight',
    name: 'Vista Mistica',
    description: 'Lancia Individuazione del Magico a volontà',
  },
  {
    id: 'eyes_of_the_rune_keeper',
    name: 'Occhi del Custode delle Rune',
    description: 'Leggi qualsiasi linguaggio scritto',
  },
  {
    id: 'fiendish_vigor',
    name: 'Vigore Immondo',
    description: 'Lancia Vita Falsa su te stesso a volontà (1° livello)',
  },
  {
    id: 'gaze_of_two_minds',
    name: 'Sguardo Bifronte',
    description: 'Usa i sensi di un umanoide consenziente toccato',
  },
  {
    id: 'mask_of_many_faces',
    name: 'Maschera dai Mille Volti',
    description: 'Lancia Camuffare Sé Stesso a volontà',
  },
  {
    id: 'misty_visions',
    name: 'Visioni Nebbiose',
    description: 'Lancia Immagine Silenziosa a volontà',
  },
  {
    id: 'repelling_blast',
    name: 'Deflagrazione Repulsiva',
    description: 'Eldritch Blast spinge il bersaglio di 3 metri',
  },
  {
    id: 'thief_of_five_fates',
    name: 'Ladro dei Cinque Destini',
    description: 'Lancia Anatema una volta per riposo lungo (usa slot)',
  },
  {
    id: 'voice_of_the_chain_master',
    name: 'Voce del Maestro della Catena',
    description: 'Comunica telepaticamente col famiglio e usa i suoi sensi',
  },
]

// =============================================================================
// ARCANE TRADITIONS (Wizard)
// =============================================================================

export const ARCANE_TRADITIONS: FeatureChoice[] = [
  {
    id: 'abjuration',
    name: 'Scuola di Abiurazione',
    description: 'Specializzazione in magie protettive e di difesa',
  },
  {
    id: 'conjuration',
    name: 'Scuola di Evocazione',
    description: 'Specializzazione nell\'evocare creature e oggetti',
  },
  {
    id: 'divination',
    name: 'Scuola di Divinazione',
    description: 'Specializzazione nel prevedere il futuro e ottenere informazioni',
  },
  {
    id: 'enchantment',
    name: 'Scuola di Ammaliamento',
    description: 'Specializzazione nel controllare le menti',
  },
  {
    id: 'evocation',
    name: 'Scuola di Invocazione',
    description: 'Specializzazione in magie di danno elementale',
  },
  {
    id: 'illusion',
    name: 'Scuola di Illusione',
    description: 'Specializzazione nel creare illusioni',
  },
  {
    id: 'necromancy',
    name: 'Scuola di Necromanzia',
    description: 'Specializzazione nel manipolare le forze della vita e della morte',
  },
  {
    id: 'transmutation',
    name: 'Scuola di Trasmutazione',
    description: 'Specializzazione nel trasformare materia ed energia',
  },
]

// =============================================================================
// CLASS FEATURES BY CLASS
// =============================================================================

export const CLASS_FEATURES: Record<string, ClassFeature[]> = {
  // =========================================================================
  // FIGHTER / GUERRIERO
  // =========================================================================
  fighter: [
    {
      id: 'fighting_style_fighter',
      name: 'Stile di Combattimento',
      nameEn: 'Fighting Style',
      level: 1,
      description: 'Scegli uno stile di combattimento',
      requiresChoice: true,
      choiceType: 'fighting_style',
      choices: FIGHTING_STYLES,
    },
    {
      id: 'second_wind',
      name: 'Secondo Vento',
      nameEn: 'Second Wind',
      level: 1,
      description: 'Recupera 1d10 + livello PF come azione bonus',
      grantsResource: {
        resourceId: 'second_wind',
        name: 'Secondo Vento',
        max: 1,
        recharge: 'short',
      },
    },
    {
      id: 'action_surge',
      name: 'Furia d\'Azione',
      nameEn: 'Action Surge',
      level: 2,
      description: 'Un\'azione extra nel tuo turno (1 uso per riposo breve)',
      grantsResource: {
        resourceId: 'action_surge',
        name: 'Furia d\'Azione',
        max: 1,
        recharge: 'short',
      },
    },
    {
      id: 'martial_archetype',
      name: 'Archetipo Marziale',
      nameEn: 'Martial Archetype',
      level: 3,
      description: 'Scegli la tua sottoclasse',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'champion', name: 'Campione', description: 'Critico migliorato (19-20) e atletismo superiore' },
        { id: 'battle_master', name: 'Maestro di Battaglia', description: 'Manovre tattiche in combattimento (4 dadi superiorità d8)' },
        { id: 'eldritch_knight', name: 'Cavaliere Mistico', description: 'Incantesimi da mago (abiurazione e invocazione)' },
      ],
    },
    {
      id: 'ability_score_improvement_fighter_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'extra_attack_fighter',
      name: 'Attacco Extra',
      nameEn: 'Extra Attack',
      level: 5,
      description: 'Attacca due volte quando usi l\'azione Attacco',
    },
  ],

  // =========================================================================
  // ROGUE / LADRO
  // =========================================================================
  rogue: [
    {
      id: 'expertise_rogue_1',
      name: 'Competenza',
      nameEn: 'Expertise',
      level: 1,
      description: 'Raddoppia il bonus competenza in 2 abilità',
      requiresChoice: true,
      choiceType: 'expertise',
    },
    {
      id: 'sneak_attack',
      name: 'Attacco Furtivo',
      nameEn: 'Sneak Attack',
      level: 1,
      description: '1d6 danni extra con vantaggio o alleato adiacente (aumenta ogni 2 livelli)',
    },
    {
      id: 'thieves_cant',
      name: 'Gergo dei Ladri',
      nameEn: 'Thieves\' Cant',
      level: 1,
      description: 'Linguaggio segreto dei ladri',
    },
    {
      id: 'cunning_action',
      name: 'Azione Scaltra',
      nameEn: 'Cunning Action',
      level: 2,
      description: 'Azione bonus per Scatto, Disimpegno o Nascondersi',
    },
    {
      id: 'roguish_archetype',
      name: 'Archetipo del Ladro',
      nameEn: 'Roguish Archetype',
      level: 3,
      description: 'Scegli la tua sottoclasse',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'thief', name: 'Furfante', description: 'Mani leste, scalata veloce, furtività superiore' },
        { id: 'assassin', name: 'Assassino', description: 'Bonus all\'iniziativa, colpo assassino, identità false' },
        { id: 'arcane_trickster', name: 'Mistificatore Arcano', description: 'Incantesimi da mago (illusione e ammaliamento)' },
      ],
    },
    {
      id: 'ability_score_improvement_rogue_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'uncanny_dodge',
      name: 'Schivata Prodigiosa',
      nameEn: 'Uncanny Dodge',
      level: 5,
      description: 'Dimezza i danni di un attacco che vedi come reazione',
    },
  ],

  // =========================================================================
  // BARD / BARDO
  // =========================================================================
  bard: [
    {
      id: 'bardic_inspiration',
      name: 'Ispirazione Bardica',
      nameEn: 'Bardic Inspiration',
      level: 1,
      description: 'Dona un d6 a un alleato (CAR volte per riposo lungo)',
      grantsResource: {
        resourceId: 'bardic_inspiration',
        name: 'Ispirazione Bardica',
        max: 3, // Will be calculated based on CHA
        recharge: 'long',
      },
    },
    {
      id: 'jack_of_all_trades',
      name: 'Factotum',
      nameEn: 'Jack of All Trades',
      level: 2,
      description: '+metà bonus competenza a prove senza competenza',
    },
    {
      id: 'song_of_rest',
      name: 'Canto del Riposo',
      nameEn: 'Song of Rest',
      level: 2,
      description: 'Gli alleati recuperano 1d6 PF extra durante riposo breve',
    },
    {
      id: 'bard_college',
      name: 'Collegio Bardico',
      nameEn: 'Bard College',
      level: 3,
      description: 'Scegli la tua sottoclasse',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'lore', name: 'Collegio della Sapienza', description: 'Competenze extra, Parole Taglienti' },
        { id: 'valor', name: 'Collegio del Valore', description: 'Competenza armature medie e scudi, Ispirazione in combattimento' },
      ],
    },
    {
      id: 'expertise_bard_3',
      name: 'Competenza',
      nameEn: 'Expertise',
      level: 3,
      description: 'Raddoppia il bonus competenza in 2 abilità',
      requiresChoice: true,
      choiceType: 'expertise',
    },
    {
      id: 'ability_score_improvement_bard_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'font_of_inspiration',
      name: 'Fonte d\'Ispirazione',
      nameEn: 'Font of Inspiration',
      level: 5,
      description: 'Ispirazione Bardica si ricarica anche con riposo breve',
    },
  ],

  // =========================================================================
  // WARLOCK
  // =========================================================================
  warlock: [
    {
      id: 'otherworldly_patron',
      name: 'Patrono Ultraterreno',
      nameEn: 'Otherworldly Patron',
      level: 1,
      description: 'Scegli il tuo patrono (scelto alla creazione)',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'archfey', name: 'L\'Archifata', description: 'Poteri di charme, paura e illusione' },
        { id: 'fiend', name: 'L\'Immondo', description: 'PF temporanei quando uccidi, resistenze e fortuna oscura' },
        { id: 'great_old_one', name: 'Il Grande Antico', description: 'Telepatia, terrore e follia' },
      ],
    },
    {
      id: 'pact_magic',
      name: 'Magia del Patto',
      nameEn: 'Pact Magic',
      level: 1,
      description: 'Slot incantesimo che si ricaricano con riposo breve',
    },
    {
      id: 'eldritch_invocations',
      name: 'Invocazioni Occulte',
      nameEn: 'Eldritch Invocations',
      level: 2,
      description: 'Scegli 2 invocazioni occulte',
      requiresChoice: true,
      choiceType: 'invocation',
      choices: ELDRITCH_INVOCATIONS,
    },
    {
      id: 'pact_boon',
      name: 'Dono del Patto',
      nameEn: 'Pact Boon',
      level: 3,
      description: 'Scegli il tuo dono del patto',
      requiresChoice: true,
      choiceType: 'subclass', // Using subclass type for pact boon
      choices: [
        { id: 'pact_chain', name: 'Patto della Catena', description: 'Famiglio potenziato (imp, pseudodrago, quasit, sprite)' },
        { id: 'pact_blade', name: 'Patto della Lama', description: 'Arma del patto evocabile' },
        { id: 'pact_tome', name: 'Patto del Tomo', description: '3 trucchetti da qualsiasi lista' },
      ],
    },
    {
      id: 'ability_score_improvement_warlock_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'eldritch_invocations_3',
      name: 'Invocazione Aggiuntiva',
      nameEn: 'Additional Invocation',
      level: 5,
      description: 'Impara una terza invocazione occulta',
      requiresChoice: true,
      choiceType: 'invocation',
      choices: ELDRITCH_INVOCATIONS,
    },
  ],

  // =========================================================================
  // WIZARD / MAGO
  // =========================================================================
  wizard: [
    {
      id: 'arcane_recovery',
      name: 'Recupero Arcano',
      nameEn: 'Arcane Recovery',
      level: 1,
      description: 'Recupera slot incantesimo durante riposo breve (livello/2 arrotondato)',
      grantsResource: {
        resourceId: 'arcane_recovery',
        name: 'Recupero Arcano',
        max: 1,
        recharge: 'long',
      },
    },
    {
      id: 'spellcasting_wizard',
      name: 'Incantesimi',
      nameEn: 'Spellcasting',
      level: 1,
      description: 'Libro degli incantesimi, preparazione giornaliera',
    },
    {
      id: 'arcane_tradition',
      name: 'Tradizione Arcana',
      nameEn: 'Arcane Tradition',
      level: 2,
      description: 'Scegli la tua scuola di specializzazione',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: ARCANE_TRADITIONS,
    },
    {
      id: 'ability_score_improvement_wizard_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
  ],

  // =========================================================================
  // RANGER
  // =========================================================================
  ranger: [
    {
      id: 'favored_enemy',
      name: 'Nemico Prescelto',
      nameEn: 'Favored Enemy',
      level: 1,
      description: 'Vantaggio a tracciare e informazioni su un tipo di nemico',
    },
    {
      id: 'natural_explorer',
      name: 'Esploratore Nato',
      nameEn: 'Natural Explorer',
      level: 1,
      description: 'Benefici in un tipo di terreno prescelto',
    },
    {
      id: 'fighting_style_ranger',
      name: 'Stile di Combattimento',
      nameEn: 'Fighting Style',
      level: 2,
      description: 'Scegli uno stile di combattimento',
      requiresChoice: true,
      choiceType: 'fighting_style',
      choices: [
        FIGHTING_STYLES[0], // Archery
        FIGHTING_STYLES[1], // Defense
        FIGHTING_STYLES[2], // Dueling
        FIGHTING_STYLES[5], // Two-Weapon Fighting
      ],
    },
    {
      id: 'spellcasting_ranger',
      name: 'Incantesimi',
      nameEn: 'Spellcasting',
      level: 2,
      description: 'Accesso agli incantesimi da ranger',
    },
    {
      id: 'ranger_archetype',
      name: 'Archetipo del Ranger',
      nameEn: 'Ranger Archetype',
      level: 3,
      description: 'Scegli la tua sottoclasse',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'hunter', name: 'Cacciatore', description: 'Tecniche di caccia contro prede specifiche' },
        { id: 'beast_master', name: 'Signore delle Bestie', description: 'Compagno animale in combattimento' },
      ],
    },
    {
      id: 'primeval_awareness',
      name: 'Consapevolezza Primordiale',
      nameEn: 'Primeval Awareness',
      level: 3,
      description: 'Percepisci nemici prescelti entro 1 miglio (o 6 nel terreno)',
    },
    {
      id: 'ability_score_improvement_ranger_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'extra_attack_ranger',
      name: 'Attacco Extra',
      nameEn: 'Extra Attack',
      level: 5,
      description: 'Attacca due volte quando usi l\'azione Attacco',
    },
  ],

  // =========================================================================
  // PALADIN / PALADINO
  // =========================================================================
  paladin: [
    {
      id: 'divine_sense',
      name: 'Percezione del Divino',
      nameEn: 'Divine Sense',
      level: 1,
      description: 'Percepisci celestiali, immondi e non morti',
      grantsResource: {
        resourceId: 'divine_sense',
        name: 'Percezione del Divino',
        max: 4, // 1 + CHA modifier, will be calculated
        recharge: 'long',
      },
    },
    {
      id: 'lay_on_hands',
      name: 'Imposizione delle Mani',
      nameEn: 'Lay on Hands',
      level: 1,
      description: 'Riserva di punti ferita curativi (livello x 5)',
      grantsResource: {
        resourceId: 'lay_on_hands',
        name: 'Imposizione delle Mani',
        max: 5, // level * 5, will be calculated
        recharge: 'long',
      },
    },
    {
      id: 'fighting_style_paladin',
      name: 'Stile di Combattimento',
      nameEn: 'Fighting Style',
      level: 2,
      description: 'Scegli uno stile di combattimento',
      requiresChoice: true,
      choiceType: 'fighting_style',
      choices: [
        FIGHTING_STYLES[1], // Defense
        FIGHTING_STYLES[2], // Dueling
        FIGHTING_STYLES[3], // Great Weapon
        FIGHTING_STYLES[4], // Protection
      ],
    },
    {
      id: 'spellcasting_paladin',
      name: 'Incantesimi',
      nameEn: 'Spellcasting',
      level: 2,
      description: 'Accesso agli incantesimi da paladino',
    },
    {
      id: 'divine_smite',
      name: 'Punizione Divina',
      nameEn: 'Divine Smite',
      level: 2,
      description: 'Spendi slot per +2d8 danni radiosi a un colpo (+1d8 per slot sopra il 1°)',
    },
    {
      id: 'divine_health',
      name: 'Salute Divina',
      nameEn: 'Divine Health',
      level: 3,
      description: 'Immune alle malattie',
    },
    {
      id: 'sacred_oath',
      name: 'Giuramento Sacro',
      nameEn: 'Sacred Oath',
      level: 3,
      description: 'Scegli il tuo giuramento',
      requiresChoice: true,
      choiceType: 'subclass',
      choices: [
        { id: 'devotion', name: 'Giuramento di Devozione', description: 'Arma sacra, protezione dai mali' },
        { id: 'ancients', name: 'Giuramento degli Antichi', description: 'Vincolo con la natura, resistenza agli incantesimi' },
        { id: 'vengeance', name: 'Giuramento di Vendetta', description: 'Voto contro un nemico, cacciatore implacabile' },
      ],
    },
    {
      id: 'ability_score_improvement_paladin_4',
      name: 'Aumento Caratteristica',
      nameEn: 'Ability Score Improvement',
      level: 4,
      description: '+2 a una caratteristica o +1 a due, oppure un talento',
    },
    {
      id: 'extra_attack_paladin',
      name: 'Attacco Extra',
      nameEn: 'Extra Attack',
      level: 5,
      description: 'Attacca due volte quando usi l\'azione Attacco',
    },
  ],
}

// =============================================================================
// SPELL SLOT PROGRESSION
// =============================================================================

export const SPELL_SLOT_PROGRESSION: Record<string, Record<number, SpellProgression>> = {
  // Full casters (Wizard, Bard, Cleric, Druid, Sorcerer)
  wizard: {
    1: { cantripsKnown: 3, spellsKnown: null, slots: { 1: 2 } },
    2: { cantripsKnown: 3, spellsKnown: null, slots: { 1: 3 } },
    3: { cantripsKnown: 3, spellsKnown: null, slots: { 1: 4, 2: 2 } },
    4: { cantripsKnown: 4, spellsKnown: null, slots: { 1: 4, 2: 3 } },
    5: { cantripsKnown: 4, spellsKnown: null, slots: { 1: 4, 2: 3, 3: 2 } },
  },
  bard: {
    1: { cantripsKnown: 2, spellsKnown: 4, slots: { 1: 2 } },
    2: { cantripsKnown: 2, spellsKnown: 5, slots: { 1: 3 } },
    3: { cantripsKnown: 2, spellsKnown: 6, slots: { 1: 4, 2: 2 } },
    4: { cantripsKnown: 3, spellsKnown: 7, slots: { 1: 4, 2: 3 } },
    5: { cantripsKnown: 3, spellsKnown: 8, slots: { 1: 4, 2: 3, 3: 2 } },
  },
  // Half casters (Paladin, Ranger)
  paladin: {
    1: { cantripsKnown: 0, spellsKnown: null, slots: {} },
    2: { cantripsKnown: 0, spellsKnown: null, slots: { 1: 2 } },
    3: { cantripsKnown: 0, spellsKnown: null, slots: { 1: 3 } },
    4: { cantripsKnown: 0, spellsKnown: null, slots: { 1: 3 } },
    5: { cantripsKnown: 0, spellsKnown: null, slots: { 1: 4, 2: 2 } },
  },
  ranger: {
    1: { cantripsKnown: 0, spellsKnown: 0, slots: {} },
    2: { cantripsKnown: 0, spellsKnown: 2, slots: { 1: 2 } },
    3: { cantripsKnown: 0, spellsKnown: 3, slots: { 1: 3 } },
    4: { cantripsKnown: 0, spellsKnown: 3, slots: { 1: 3 } },
    5: { cantripsKnown: 0, spellsKnown: 4, slots: { 1: 4, 2: 2 } },
  },
  // Warlock (Pact Magic - different system)
  warlock: {
    1: { cantripsKnown: 2, spellsKnown: 2, slots: { 1: 1 } },
    2: { cantripsKnown: 2, spellsKnown: 3, slots: { 1: 2 } },
    3: { cantripsKnown: 2, spellsKnown: 4, slots: { 2: 2 } }, // Slots upgrade to level 2
    4: { cantripsKnown: 3, spellsKnown: 5, slots: { 2: 2 } },
    5: { cantripsKnown: 3, spellsKnown: 6, slots: { 3: 2 } }, // Slots upgrade to level 3
  },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get features gained at a specific level for a class
 */
export function getFeaturesAtLevel(className: string, level: number): ClassFeature[] {
  const classKey = className.toLowerCase()
  const features = CLASS_FEATURES[classKey] || []
  return features.filter(f => f.level === level)
}

/**
 * Get all features from level 1 up to and including the target level
 */
export function getAllFeaturesUpToLevel(className: string, level: number): ClassFeature[] {
  const classKey = className.toLowerCase()
  const features = CLASS_FEATURES[classKey] || []
  return features.filter(f => f.level <= level)
}

/**
 * Check if a class is a spellcaster at a given level
 */
export function isSpellcasterAtLevel(className: string, level: number): boolean {
  const classKey = className.toLowerCase()
  const progression = SPELL_SLOT_PROGRESSION[classKey]
  if (!progression) return false
  const levelData = progression[level]
  if (!levelData) return false
  return Object.keys(levelData.slots).length > 0
}

/**
 * Get new spells known when leveling up
 */
export function getNewSpellsKnown(className: string, fromLevel: number, toLevel: number): number {
  const classKey = className.toLowerCase()
  const progression = SPELL_SLOT_PROGRESSION[classKey]
  if (!progression) return 0

  const fromData = progression[fromLevel]
  const toData = progression[toLevel]

  if (!fromData || !toData) return 0
  if (fromData.spellsKnown === null || toData.spellsKnown === null) {
    // Prepared caster (wizard, paladin, cleric, druid)
    // Wizard gets 2 spells per level in spellbook
    if (classKey === 'wizard') return 2
    return 0 // Prepared casters don't "learn" new spells
  }

  return toData.spellsKnown - fromData.spellsKnown
}

/**
 * Get hit die for a class
 */
export function getHitDie(className: string): number {
  const classKey = className.toLowerCase()
  return CLASS_HIT_DICE[classKey] || 8
}

/**
 * Normalize class name for lookup (handles Italian names)
 */
export function normalizeClassName(className: string): string {
  const mapping: Record<string, string> = {
    'guerriero': 'fighter',
    'ladro': 'rogue',
    'bardo': 'bard',
    'mago': 'wizard',
    'paladino': 'paladin',
    'ranger': 'ranger',
    'warlock': 'warlock',
    'stregone': 'sorcerer',
    'chierico': 'cleric',
    'druido': 'druid',
    'barbaro': 'barbarian',
    'monaco': 'monk',
  }
  const lower = className.toLowerCase()
  return mapping[lower] || lower
}
