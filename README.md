# DM Dashboard

A comprehensive **Dungeon Master Dashboard** for D&D 5e/2024 campaigns, built with Next.js and Supabase.

Manage your campaigns, characters, encounters, story notes, and narrative branching - all in one place.

## Features

### DM Tools
- **Campaign Management** - Create and manage multiple campaigns with acts/chapters
- **Party Overview** - Quick view of all party members with HP, conditions, and death saves
- **Monster Bestiary** - Import from Open5e API or create custom monsters with spellcasting
- **Monster Editor** - Edit monsters with custom stats, spells, and images
- **Encounter Builder** - Plan encounters with difficulty calculation
- **Combat Tracker** - Initiative order, HP tracking, conditions management
- **Story Notes** - Organize NPCs, locations, lore with tags, images, and stat blocks
- **Narrative Tree** - Visual branching story paths with canvas view and session linking

### Player Dashboard
- **Character Sheet** - Full character management with modern mobile-first design
- **Magic Guide** - Complete D&D 2024 spellcasting rules with class-specific info
- **Spell Manager** - Prepare/unprepare spells with slot tracking and upcasting
- **Actions Panel** - Class actions, bonus actions, reactions with usage tracking
- **Skills Panel** - All skills with ability modifiers and proficiency indicators
- **Class Resources** - Track Ki, Sorcery Points, Channel Divinity, etc.
- **Inventory Manager** - Items with containers, attunement, and equipment slots
- **Rest System** - Short/long rest with automatic resource recovery
- **Educational Tooltips** - Formula breakdowns explaining D&D mechanics

### Shared Features
- **Player Portal** - Players access their character sheet via unique code
- **DM Preview Mode** - DM can view any character as the player sees it
- **Real-time Updates** - Supabase realtime subscriptions
- **Level Up Wizard** - Guided level-up with HP, spells, and class features

## Screenshots

*Coming soon*

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **React**: 19.2
- **Database**: Supabase (PostgreSQL 17)
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Custom SVG game icons (CC BY 3.0)
- **Notifications**: Sonner toasts
- **Monster Data**: Open5e API

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/vietts/dm-dashboard-oss.git
cd dm-dashboard-oss
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Run all migrations in `supabase/migrations/` in order
4. Go to **Settings > API** and copy your keys

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DM_PASSWORD=your-dm-password
AUTH_SECRET=your-random-secret
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - login with your `DM_PASSWORD`.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vietts/dm-dashboard-oss)

1. Click the button above or import from GitHub
2. Add environment variables in Vercel dashboard
3. Deploy!

## Project Structure

```
dm-dashboard/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── player-actions/    # Character actions CRUD
│   │   ├── player-resources/  # Class resources management
│   │   ├── player-rest/       # Rest mechanics
│   │   ├── player-spells/     # Spell management
│   │   ├── monster-image/     # Monster image upload
│   │   └── monster-spells/    # Monster spellcasting
│   ├── campaigns/         # Campaign pages
│   ├── login/             # DM login
│   └── player/            # Player portal
├── components/            # React components
│   ├── icons/            # Game icon component
│   ├── monster/          # Monster editing
│   ├── narrative/        # Narrative tree & canvas
│   ├── notes/            # Story notes components
│   ├── player/           # Player dashboard components
│   │   ├── ActionsPanel.tsx      # Actions management
│   │   ├── CharacterPanel.tsx    # Stats overview
│   │   ├── QuickGuide.tsx        # Rules including Magic Guide
│   │   ├── SkillsPanel.tsx       # Skills with modifiers
│   │   ├── SpellManager.tsx      # Spell preparation
│   │   └── educational/          # Teaching tooltips
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── spell-rules.ts    # D&D 2024 spellcasting rules
│   ├── class-mechanics.ts # Class-specific mechanics
│   ├── skills.ts         # Skill definitions
│   └── supabase.ts       # Database client
├── public/               # Static assets
│   └── icons/            # SVG icons (classes, conditions, ui)
├── supabase/             # Database
│   ├── schema.sql        # Initial schema
│   └── migrations/       # Schema updates
└── types/                # TypeScript types
```

## Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `dnd_campaigns` | Campaigns |
| `dnd_characters` | Party characters |
| `dnd_character_actions` | Class actions (Attack, Cunning Action, etc.) |
| `dnd_character_resources` | Class resources (Ki, Sorcery Points, etc.) |
| `dnd_character_spells` | Prepared/known spells per character |
| `dnd_monsters` | Bestiary |
| `dnd_encounters` | Planned encounters |
| `dnd_story_notes` | NPCs, locations, lore, items |
| `dnd_sessions` | Session logs |
| `dnd_acts` | Campaign acts/chapters |
| `dnd_inventory` | Character inventory |

### Narrative System
| Table | Description |
|-------|-------------|
| `dnd_narrative_nodes` | Story graph nodes |
| `dnd_narrative_edges` | Node connections |
| `dnd_narrative_node_links` | Links to notes/encounters |

### Cache Tables
| Table | Description |
|-------|-------------|
| `open5e_spells` | Cached Open5e spells |
| `open5e_races` | Cached races |
| `open5e_classes` | Cached classes |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key | Yes |
| `DM_PASSWORD` | Password for DM login | Yes |
| `AUTH_SECRET` | Secret for session cookies | Yes |

## D&D 2024 Spell Library

This project includes a complete D&D 2024 spell library with Italian translations (336 spells).

The spell data is also available as a standalone JSON file for other projects:
**[dnd-2024-spells-it.json](https://gist.github.com/vietts/bee17c5aaa7b74f470c8016085864202)**

## Credits

- **Icons**: [Game Icons](https://game-icons.net/) by various artists (CC BY 3.0)
- **Monster Data**: [Open5e API](https://open5e.com/) (OGL content)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Spell Data**: D&D 2024 SRD (Creative Commons Attribution 4.0)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with dice rolls and coffee.
