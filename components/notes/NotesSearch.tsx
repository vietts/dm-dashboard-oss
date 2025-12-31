'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { GameIcon } from '@/components/icons/GameIcon'
import { X } from 'lucide-react'

interface NotesSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function NotesSearch({ value, onChange, placeholder = 'Cerca note...' }: NotesSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <div className="relative">
      <GameIcon
        name="book"
        category="ui"
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-light)]"
      />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 bg-white border-[var(--border)] focus:border-[var(--teal)] focus:ring-[var(--teal)]/20"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('')
            onChange('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--paper)] text-[var(--ink-light)] hover:text-[var(--ink)]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
