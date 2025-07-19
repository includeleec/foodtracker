'use client'

import React, { createContext, useContext } from 'react'
import { useConfirmation, UseConfirmationReturn } from '@/hooks/use-confirmation'
import { ConfirmDialog } from './confirm-dialog'

const ConfirmationContext = createContext<UseConfirmationReturn | null>(null)

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const confirmation = useConfirmation()

  return (
    <ConfirmationContext.Provider value={confirmation}>
      {children}
      <ConfirmDialog
        isOpen={confirmation.confirmation.isOpen}
        title={confirmation.confirmation.title}
        message={confirmation.confirmation.message}
        confirmText={confirmation.confirmation.confirmText}
        cancelText={confirmation.confirmation.cancelText}
        type={confirmation.confirmation.type}
        isLoading={confirmation.confirmation.isLoading}
        onConfirm={confirmation.confirmAction}
        onCancel={confirmation.cancelAction}
      />
    </ConfirmationContext.Provider>
  )
}

export function useConfirmationContext(): UseConfirmationReturn {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmationContext must be used within a ConfirmationProvider')
  }
  return context
}