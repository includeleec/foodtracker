'use client'

import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface UseToastReturn {
  toasts: ToastMessage[]
  showToast: (toast: Omit<ToastMessage, 'id'>) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
  showSuccess: (message: string, title?: string) => string
  showError: (message: string, title?: string) => string
  showWarning: (message: string, title?: string) => string
  showInfo: (message: string, title?: string) => string
}

let toastId = 0

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++toastId}`
    const newToast: ToastMessage = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // 自动隐藏
    if (toast.duration !== 0) {
      setTimeout(() => {
        hideToast(id)
      }, toast.duration || 5000)
    }
    
    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const showSuccess = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', message, title })
  }, [showToast])

  const showError = useCallback((message: string, title?: string) => {
    return showToast({ type: 'error', message, title, duration: 0 }) // 错误消息不自动消失
  }, [showToast])

  const showWarning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', message, title })
  }, [showToast])

  const showInfo = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', message, title })
  }, [showToast])

  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}