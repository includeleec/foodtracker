'use client'

import { useState, useCallback } from 'react'

export interface ConfirmationOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  isLoading: boolean
}

export interface UseConfirmationReturn {
  confirmation: ConfirmationState
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>
  hideConfirmation: () => void
  confirmAction: () => Promise<void>
  cancelAction: () => void
}

export function useConfirmation(): UseConfirmationReturn {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    message: ''
  })

  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({
        ...options,
        isOpen: true,
        isLoading: false
      })
      setResolvePromise(() => resolve)
    })
  }, [])

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false, isLoading: false }))
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const confirmAction = useCallback(async () => {
    if (!confirmation.onConfirm) {
      if (resolvePromise) {
        resolvePromise(true)
        setResolvePromise(null)
      }
      hideConfirmation()
      return
    }

    setConfirmation(prev => ({ ...prev, isLoading: true }))

    try {
      await confirmation.onConfirm()
      if (resolvePromise) {
        resolvePromise(true)
        setResolvePromise(null)
      }
    } catch (error) {
      console.error('Confirmation action failed:', error)
      if (resolvePromise) {
        resolvePromise(false)
        setResolvePromise(null)
      }
    } finally {
      hideConfirmation()
    }
  }, [confirmation.onConfirm, resolvePromise, hideConfirmation])

  const cancelAction = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel()
    }
    hideConfirmation()
  }, [confirmation.onCancel, hideConfirmation])

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    confirmAction,
    cancelAction
  }
}