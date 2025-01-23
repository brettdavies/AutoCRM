import { create } from 'zustand'
import logger from '@/shared/utils/logger.utils'

interface BaseState {
  isLoading: boolean
  error: Error | null
}

interface BaseActions {
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  reset: () => void
}

export const createBaseStore = <T extends BaseState, A extends BaseActions>(
  name: string,
  initialState: Omit<T, keyof BaseState>,
  createActions: (set: any, get: any) => Omit<A, keyof BaseActions>
) => {
  const storeLogger = logger.child({ store: name })

  return create<T & A>((set, get) => ({
    // Base state
    isLoading: false,
    error: null,
    ...initialState,

    // Base actions
    setLoading: (loading) => {
      storeLogger.debug('Setting loading state', { loading })
      set({ isLoading: loading })
    },
    setError: (error) => {
      storeLogger.error('Setting error state', { error })
      set({ error })
    },
    reset: () => {
      storeLogger.info('Resetting store state')
      set({ ...initialState, isLoading: false, error: null })
    },

    // Custom actions
    ...createActions(set, get)
  }))
} 