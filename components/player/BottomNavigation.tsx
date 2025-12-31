'use client'

import { GameIcon } from '@/components/icons/GameIcon'

export type NavSection = 'character' | 'actions' | 'campaign' | 'info'

interface NavItem {
  id: NavSection
  icon: string
  label: string
}

const navItems: NavItem[] = [
  { id: 'character', icon: 'masks', label: 'Personaggio' },
  { id: 'actions', icon: 'skull', label: 'Azioni' },
  { id: 'campaign', icon: 'scroll', label: 'Campagna' },
  { id: 'info', icon: 'd20', label: 'Info' },
]

interface BottomNavigationProps {
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
}

export default function BottomNavigation({
  activeSection,
  onSectionChange,
}: BottomNavigationProps) {
  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* Fixed Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        role="navigation"
        aria-label="Navigazione principale"
      >
        {/* Parchment-style background with decorative top border */}
        <div className="relative">
          {/* Decorative top edge - like torn parchment */}
          <div
            className="absolute -top-2 left-0 right-0 h-3"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, var(--cream-light) 100%)`,
              maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q5,5 10,8 T20,7 T30,9 T40,6 T50,8 T60,5 T70,9 T80,7 T90,8 T100,10 L100,10 L0,10 Z' fill='white'/%3E%3C/svg%3E")`,
              maskSize: '100px 100%',
              maskRepeat: 'repeat-x',
            }}
          />

          {/* Main navigation bar */}
          <div
            className="bg-gradient-to-t from-[var(--cream)] to-[var(--cream-light)] border-t-2 border-[var(--teal)] shadow-[0_-4px_20px_rgba(42,37,32,0.15)]"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex items-stretch justify-around px-2 py-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`
                      flex flex-col items-center justify-center gap-1
                      flex-1 py-2 px-1 rounded-lg
                      transition-all duration-200 ease-out
                      min-h-[60px] relative
                      ${isActive
                        ? 'text-[var(--cream-light)]'
                        : 'text-[var(--ink-light)] hover:text-[var(--ink)] active:scale-95'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    {/* Active indicator background */}
                    {isActive && (
                      <div
                        className="absolute inset-1 rounded-lg bg-[var(--teal)] shadow-md"
                        style={{
                          boxShadow: '0 2px 8px rgba(61, 124, 113, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                      <GameIcon
                        name={item.icon}
                        category="ui"
                        size={24}
                        className={isActive ? 'text-[var(--cream-light)]' : ''}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        relative z-10 text-[10px] font-medium tracking-wide
                        transition-all duration-200
                        ${isActive ? 'font-semibold' : ''}
                      `}
                    >
                      {item.label}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--coral)] shadow-sm" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
