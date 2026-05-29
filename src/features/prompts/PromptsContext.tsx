import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import Fuse from 'fuse.js'
import type { Prompt } from '@/domain/promptSchema'
import { promptRepository } from '@/infrastructure/promptRepository'

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

export interface PromptsState {
  prompts: Prompt[]
  selectedPromptId: string | null
  editorMode: 'create' | 'edit' | null
}

type Action =
  | { type: 'LOAD'; prompts: Prompt[] }
  | { type: 'ADD'; prompt: Prompt }
  | { type: 'UPDATE'; prompt: Prompt }
  | { type: 'REMOVE'; id: string }
  | { type: 'SELECT'; id: string | null }
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT' }
  | { type: 'CLOSE_EDITOR' }

const initialState: PromptsState = {
  prompts: [],
  selectedPromptId: null,
  editorMode: null,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function promptsReducer(state: PromptsState, action: Action): PromptsState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, prompts: action.prompts }

    case 'ADD':
      return { ...state, prompts: [action.prompt, ...state.prompts] }

    case 'UPDATE':
      return {
        ...state,
        prompts: state.prompts.map((p) =>
          p.id === action.prompt.id ? action.prompt : p,
        ),
      }

    case 'REMOVE':
      return {
        ...state,
        prompts: state.prompts.filter((p) => p.id !== action.id),
        selectedPromptId:
          state.selectedPromptId === action.id ? null : state.selectedPromptId,
      }

    case 'SELECT':
      return { ...state, selectedPromptId: action.id }

    case 'OPEN_CREATE':
      return { ...state, editorMode: 'create' }

    case 'OPEN_EDIT':
      return { ...state, editorMode: 'edit' }

    case 'CLOSE_EDITOR':
      return { ...state, editorMode: null }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PromptsContextValue {
  state: PromptsState
  dispatch: React.Dispatch<Action>
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredPrompts: Prompt[]
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
}

const PromptsContext = createContext<PromptsContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PromptsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(promptsReducer, initialState)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('promptViewMode') as 'grid' | 'list') ?? 'grid',
  )

  useEffect(() => {
    localStorage.setItem('promptViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    promptRepository
      .getAll()
      .then((prompts) => dispatch({ type: 'LOAD', prompts }))
      .catch(console.error)
  }, [])

  const fuse = useMemo(
    () =>
      new Fuse(state.prompts, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'description', weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [state.prompts],
  )

  const filteredPrompts = useMemo(() => {
    if (searchQuery.length <= 2) return state.prompts
    return fuse.search(searchQuery).map((r) => r.item)
  }, [searchQuery, fuse, state.prompts])

  return (
    <PromptsContext.Provider value={{ state, dispatch, searchQuery, setSearchQuery, filteredPrompts, viewMode, setViewMode }}>
      {children}
    </PromptsContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrompts(): PromptsContextValue {
  const ctx = useContext(PromptsContext)
  if (!ctx) {
    throw new Error('usePrompts must be used within a PromptsProvider')
  }
  return ctx
}
