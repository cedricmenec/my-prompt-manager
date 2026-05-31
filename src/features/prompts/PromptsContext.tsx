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
// Filter type
// ---------------------------------------------------------------------------

export type PromptFilter =
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'uncollected' }
  | { type: 'tag'; value: string }

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

export interface PromptsState {
  prompts: Prompt[]
  selectedPromptId: string | null
  viewMode: 'read' | 'edit' | null
  initialType?: 'text' | 'image'
}

type Action =
  | { type: 'LOAD'; prompts: Prompt[] }
  | { type: 'ADD'; prompt: Prompt }
  | { type: 'UPDATE'; prompt: Prompt }
  | { type: 'REMOVE'; id: string }
  | { type: 'SELECT'; id: string | null }
  | { type: 'DESELECT' }
  | { type: 'OPEN_CREATE'; initialType?: 'text' | 'image' }
  | { type: 'OPEN_EDIT' }
  | { type: 'CLOSE_EDITOR' }

const initialState: PromptsState = {
  prompts: [],
  selectedPromptId: null,
  viewMode: null,
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
      return { ...state, selectedPromptId: action.id, viewMode: 'read' }

    case 'DESELECT':
      return { ...state, selectedPromptId: null, viewMode: null }

    case 'OPEN_CREATE': {
      const { initialType: _prev, ...rest } = state
      return {
        ...rest,
        selectedPromptId: null,
        viewMode: 'edit',
        ...(action.initialType !== undefined ? { initialType: action.initialType } : {}),
      }
    }

    case 'OPEN_EDIT':
      return { ...state, viewMode: 'edit' }

    case 'CLOSE_EDITOR': {
      const { initialType: _discarded, ...rest } = state
      return { ...rest, viewMode: null }
    }

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
  activeFilter: PromptFilter
  setActiveFilter: (filter: PromptFilter) => void
  filteredPrompts: Prompt[]
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  appView: 'prompts' | 'gallery'
  setAppView: (view: 'prompts' | 'gallery') => void
}

const PromptsContext = createContext<PromptsContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PromptsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(promptsReducer, initialState)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<PromptFilter>({ type: 'all' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem('promptViewMode') as 'grid' | 'list') ?? 'grid',
  )
  const [appView, setAppViewRaw] = useState<'prompts' | 'gallery'>(
    () => (localStorage.getItem('promptAppView') as 'prompts' | 'gallery') ?? 'prompts',
  )

  const setAppView = (view: 'prompts' | 'gallery') => {
    if (view === 'gallery') {
      setActiveFilter({ type: 'all' })
      setSearchQuery('')
    }
    setAppViewRaw(view)
  }

  useEffect(() => {
    localStorage.setItem('promptViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem('promptAppView', appView)
  }, [appView])


  useEffect(() => {
    promptRepository
      .getAll()
      .then((prompts) => dispatch({ type: 'LOAD', prompts }))
      .catch(console.error)
  }, [])

  const filteredPrompts = useMemo(() => {
    // Step 1: apply category filter
    let base = state.prompts
    if (activeFilter.type === 'favorites') {
      base = base.filter((p) => p.isFavorite)
    } else if (activeFilter.type === 'uncollected') {
      base = base.filter((p) => !p.tags || p.tags.length === 0)
    } else if (activeFilter.type === 'tag') {
      const tag = activeFilter.value
      base = base.filter((p) => p.tags?.includes(tag))
    }

    // Step 2: apply search query within the filtered base
    if (searchQuery.length <= 2) return base
    const fuse = new Fuse(base, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    })
    return fuse.search(searchQuery).map((r) => r.item)
  }, [searchQuery, state.prompts, activeFilter])

  return (
    <PromptsContext.Provider value={{ state, dispatch, searchQuery, setSearchQuery, activeFilter, setActiveFilter, filteredPrompts, viewMode, setViewMode, appView, setAppView }}>
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
