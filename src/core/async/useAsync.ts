import { useState, useCallback } from 'react'
import { useLogger } from '@/hooks/useLogger'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const logger = useLogger('useAsync')

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })

    try {
      const data = await asyncFunction()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      logger.error('Async operation failed', { error })
      setState({ data: null, loading: false, error: error as Error })
      throw error
    }
  }, [asyncFunction])

  return { ...state, execute }
} 