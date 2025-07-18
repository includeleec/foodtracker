'use client'

import { useState, useCallback } from 'react'
import { withRetry, RetryConfig } from '@/lib/retry-utils'

export interface UseRetryState {
  isLoading: boolean
  error: Error | null
  attempt: number
}

export interface UseRetryOptions extends Partial<RetryConfig> {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onRetry?: (attempt: number) => void
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const [state, setState] = useState<UseRetryState>({
    isLoading: false,
    error: null,
    attempt: 0
  })

  const execute = useCallback(async (): Promise<T | undefined> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, attempt: 0 }))

    try {
      const result = await withRetry(async () => {
        setState(prev => ({ ...prev, attempt: prev.attempt + 1 }))
        options.onRetry?.(state.attempt + 1)
        return await fn()
      }, options)

      setState(prev => ({ ...prev, isLoading: false, error: null }))
      options.onSuccess?.()
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState(prev => ({ ...prev, isLoading: false, error: err }))
      options.onError?.(err)
      throw err
    }
  }, [fn, options, state.attempt])

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, attempt: 0 })
  }, [])

  return {
    ...state,
    execute,
    reset,
    retry: execute
  }
}