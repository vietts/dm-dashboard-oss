'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/types/database'
import { GameIcon } from '@/components/icons/GameIcon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dnd_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
    } else {
      setCampaigns(data || [])
    }
    setLoading(false)
  }

  async function createCampaign() {
    if (!newCampaign.name.trim()) return

    setCreating(true)
    const { data, error } = await supabase
      .from('dnd_campaigns')
      .insert([{ name: newCampaign.name, description: newCampaign.description || null }])
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
    } else if (data) {
      setCampaigns([data, ...campaigns])
      setNewCampaign({ name: '', description: '' })
      setIsDialogOpen(false)
    }
    setCreating(false)
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 md:mb-12 text-center">
        <div className="map-border-simple inline-block px-8 py-6 md:px-12 md:py-8 mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--coral)] mb-2">
            DM Dashboard
          </h1>
          <p className="text-lg md:text-xl text-[var(--ink-light)]">
            Strumenti per Dungeon Master - D&D 5e
          </p>
        </div>
        <div className="fantasy-divider mt-4">
          <span><GameIcon name="combat" category="ui" size={20} className="text-[var(--coral)]" /></span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Campaigns Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--ink)]">Le Tue Campagne</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary min-h-[44px]">
                  + Nuova Campagna
                </Button>
              </DialogTrigger>
              <DialogContent className="parchment-card">
                <DialogHeader>
                  <DialogTitle>Crea Nuova Campagna</DialogTitle>
                  <DialogDescription>
                    Inizia una nuova avventura per i tuoi giocatori
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome della Campagna</Label>
                    <Input
                      id="name"
                      placeholder="es. La Maledizione di Strahd"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione (opzionale)</Label>
                    <Textarea
                      id="description"
                      placeholder="Una breve descrizione dell'avventura..."
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="btn-secondary min-h-[44px]">
                    Annulla
                  </Button>
                  <Button
                    onClick={createCampaign}
                    disabled={!newCampaign.name.trim() || creating}
                    className="btn-primary min-h-[44px]"
                  >
                    {creating ? 'Creazione...' : 'Crea Campagna'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin"><GameIcon name="d20" category="ui" size={48} className="text-[var(--teal)]" /></div>
              <p className="mt-4 text-muted-foreground">Caricamento campagne...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="parchment-card text-center py-12 px-6">
              <CardContent>
                <div className="mb-4"><GameIcon name="scroll" category="ui" size={64} className="text-[var(--teal)]" /></div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Nessuna campagna ancora</h3>
                <p className="text-[var(--ink-light)] mb-6">
                  Crea la tua prima campagna per iniziare l&apos;avventura!
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="btn-primary min-h-[44px]"
                >
                  + Crea Prima Campagna
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 card-stagger">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <Card className="parchment-card hover:shadow-lg transition-all cursor-pointer h-full hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[var(--coral)] text-xl">{campaign.name}</CardTitle>
                      <CardDescription className="text-[var(--teal)] font-medium">
                        Atto {campaign.current_act}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[var(--ink-light)] line-clamp-3">
                        {campaign.description || 'Nessuna descrizione'}
                      </p>
                      <p className="text-xs text-[var(--ink-faded)] mt-4">
                        Creata il {new Date(campaign.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        {campaigns.length > 0 && (
          <section className="mt-8 md:mt-12">
            <div className="fantasy-divider">
              <span><GameIcon name="book" category="ui" size={20} className="text-[var(--coral)]" /></span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-center mt-6 mb-6 text-[var(--ink)]">Accesso Rapido</h2>
            <p className="text-center text-sm text-[var(--ink-light)] mb-4">
              Vai direttamente a <span className="font-semibold text-[var(--teal)]">{campaigns[0].name}</span>
            </p>
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
              <Link href={`/campaigns/${campaigns[0].id}?tab=combat`}>
                <Card className="parchment-card text-center p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer min-h-[120px] flex flex-col justify-center items-center">
                  <div className="mb-2"><GameIcon name="combat" category="ui" size={40} className="text-[var(--coral)]" /></div>
                  <h3 className="font-semibold text-[var(--ink)] text-sm md:text-base">Combattimento</h3>
                  <p className="text-xs md:text-sm text-[var(--ink-faded)]">Initiative Tracker</p>
                </Card>
              </Link>
              <Link href={`/campaigns/${campaigns[0].id}?tab=bestiary`}>
                <Card className="parchment-card text-center p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer min-h-[120px] flex flex-col justify-center items-center">
                  <div className="mb-2"><GameIcon name="dragon" category="ui" size={40} className="text-[var(--teal)]" /></div>
                  <h3 className="font-semibold text-[var(--ink)] text-sm md:text-base">Bestiario</h3>
                  <p className="text-xs md:text-sm text-[var(--ink-faded)]">Mostri e creature</p>
                </Card>
              </Link>
              <Link href={`/campaigns/${campaigns[0].id}?tab=notes`}>
                <Card className="parchment-card text-center p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer min-h-[120px] flex flex-col justify-center items-center">
                  <div className="mb-2"><GameIcon name="book" category="ui" size={40} className="text-[var(--teal-dark)]" /></div>
                  <h3 className="font-semibold text-[var(--ink)] text-sm md:text-base">Note</h3>
                  <p className="text-xs md:text-sm text-[var(--ink-faded)]">Storia e PNG</p>
                </Card>
              </Link>
              <Link href={`/campaigns/${campaigns[0].id}?tab=party`}>
                <Card className="parchment-card text-center p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer min-h-[120px] flex flex-col justify-center items-center">
                  <div className="mb-2"><GameIcon name="masks" category="ui" size={40} className="text-[var(--coral-dark)]" /></div>
                  <h3 className="font-semibold text-[var(--ink)] text-sm md:text-base">Personaggi</h3>
                  <p className="text-xs md:text-sm text-[var(--ink-faded)]">Party e schede</p>
                </Card>
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 md:mt-16 pt-6 md:pt-8 border-t-2 border-[var(--teal)]/30 text-center text-sm text-[var(--ink-faded)]">
        <p className="mb-2 flex items-center justify-center gap-1">
          DM Dashboard - Fatto con <GameIcon name="heart" category="ui" size={16} className="text-[var(--coral)]" /> per Dungeon Master
        </p>
        <p className="text-xs">
          Icone di{' '}
          <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--teal)]">
            game-icons.net
          </a>
          {' '}(CC BY 3.0)
        </p>
      </footer>
    </main>
  )
}
