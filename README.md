# DM Dashboard

A comprehensive **Dungeon Master Dashboard** for D&D 5e campaigns, built with Next.js and Supabase.

Manage your campaigns, characters, encounters, story notes, and narrative branching - all in one place.

## Features

- **Campaign Management** - Create and manage multiple campaigns with acts/chapters
- **Character Sheets** - Full character management with stats, spells, inventory, class features
- **Party Overview** - Quick view of all party members with HP, conditions, and death saves
- **Monster Bestiary** - Import from Open5e API or create custom monsters
- **Encounter Builder** - Plan encounters with difficulty calculation
- **Combat Tracker** - Initiative order, HP tracking, conditions management
- **Story Notes** - Organize NPCs, locations, lore with tags and images
- **Narrative Tree** - Visual branching story paths with session linking
- **Player Portal** - Players can access their character sheet via unique code
- **Real-time Updates** - Supabase realtime subscriptions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Game Icons (CC BY 3.0)
- **Monster Data**: Open5e API

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dm-dashboard.git
cd dm-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Settings > API** and copy your keys

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/dm-dashboard)

1. Click the button above or import from GitHub
2. Add environment variables in Vercel dashboard
3. Deploy!

## Project Structure

```
dm-dashboard/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── campaigns/         # Campaign pages
│   ├── login/             # DM login
│   └── player/            # Player portal
├── components/            # React components
│   ├── icons/            # Game icons
│   ├── narrative/        # Narrative tree components
│   ├── notes/            # Story notes components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and Supabase client
├── public/               # Static assets
│   └── icons/            # SVG icons
├── supabase/             # Database schema
└── types/                # TypeScript types
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key | Yes |
| `DM_PASSWORD` | Password for DM login | Yes |
| `AUTH_SECRET` | Secret for session cookies | Yes |

## Credits

- **Icons**: [Game Icons](https://game-icons.net/) by various artists (CC BY 3.0)
- **Monster Data**: [Open5e API](https://open5e.com/) (OGL content)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with dice rolls and coffee.
