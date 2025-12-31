'use client'

import { StoryNote, Monster } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameIcon } from '@/components/icons/GameIcon'

interface NPCMonstersSectionProps {
  npcNotes: StoryNote[]
  encounterMonsters: Monster[]
  allMonsters: Monster[]
}

export function NPCMonstersSection({
  npcNotes,
  encounterMonsters,
  allMonsters
}: NPCMonstersSectionProps) {
  // Get unique monsters (not duplicates from multiple encounters)
  const uniqueEncounterMonsters = encounterMonsters.filter(
    (m, index, arr) => arr.findIndex(x => x.id === m.id) === index
  )

  // Get NPC monsters linked via monster_id in notes
  const npcMonsterIds = npcNotes
    .filter(n => n.monster_id)
    .map(n => n.monster_id!)
  const npcMonsters = allMonsters.filter(m => npcMonsterIds.includes(m.id))

  const hasContent = npcNotes.length > 0 || uniqueEncounterMonsters.length > 0

  if (!hasContent) {
    return null // Don't show section if no NPCs or monsters
  }

  return (
    <Card className="bg-[var(--parchment)] border-[var(--ink-faded)]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display text-[var(--ink)] flex items-center gap-2">
          <GameIcon name="masks" category="ui" size={20} className="text-[var(--teal)]" />
          PNG e Mostri
          <span className="text-sm font-normal text-[var(--ink-light)]">
            (riferimento rapido)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* NPCs Column */}
          {npcNotes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[var(--teal)] flex items-center gap-2">
                <GameIcon name="masks" category="ui" size={14} />
                PNG ({npcNotes.length})
              </h4>
              <div className="space-y-1">
                {npcNotes.map(note => {
                  const linkedMonster = npcMonsters.find(m => m.id === note.monster_id)
                  return (
                    <div
                      key={note.id}
                      className="flex items-center gap-2 p-2 bg-[var(--paper)] rounded border border-[var(--ink-faded)]/10"
                    >
                      <GameIcon name="masks" category="ui" size={16} className="text-[var(--ink-light)]" />
                      <span className="flex-1 text-sm text-[var(--ink)] truncate">
                        {note.title}
                      </span>
                      {linkedMonster && (
                        <Badge variant="outline" className="text-xs">
                          CR {linkedMonster.cr}
                        </Badge>
                      )}
                      {note.is_revealed && (
                        <Badge className="text-xs bg-green-100 text-green-700">
                          Rivelato
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Monsters Column */}
          {uniqueEncounterMonsters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[var(--coral)] flex items-center gap-2">
                <GameIcon name="skull" category="ui" size={14} />
                Mostri ({uniqueEncounterMonsters.length})
              </h4>
              <div className="space-y-1">
                {uniqueEncounterMonsters.map(monster => (
                  <div
                    key={monster.id}
                    className="flex items-center gap-2 p-2 bg-[var(--paper)] rounded border border-[var(--ink-faded)]/10"
                  >
                    <GameIcon name="skull" category="ui" size={16} className="text-[var(--ink-light)]" />
                    <span className="flex-1 text-sm text-[var(--ink)] truncate">
                      {monster.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      CR {monster.cr}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      HP {monster.max_hp}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
