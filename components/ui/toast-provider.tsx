'use client'

import React, { createContext, useContext } from 'react'
import { useToast, UseToastReturn } from '@/hooks/use-toast'
import { Toast } from './toast'

const ToastContext = createContext<UseToastReturn | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toast.toasts.map(toastMessage => (
          <div key={toastMessage.id} className="pointer-events-auto">
            <Toast
              type={toastMessage.type}
              title={toastMessage.title}
              message={toastMessage.message}
              onClose={() => toast.hideToast(toastMessage.id)}
              action={toastMessage.action}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext(): UseToastReturn {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}