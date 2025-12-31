// Notes components barrel export
export { NotesLayout } from './NotesLayout'
export { NotesSidebar } from './NotesSidebar'
export { NotesSidebarItem } from './NotesSidebarItem'
export { NoteDetail } from './NoteDetail'
export { NoteEditor } from './NoteEditor'
export { NPCStatBlock } from './NPCStatBlock'
export { NotesSearch } from './NotesSearch'
export { NotesEmptyState } from './NotesEmptyState'

// Context and hooks
export {
  NotesProvider,
  useNotes,
  getNoteTypeConfig,
  NOTE_TYPES,
  type NoteType,
  type NoteTypeValue,
} from './hooks/useNotesContext'
