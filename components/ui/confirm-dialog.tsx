'use client'

import React from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  className?: string
}

export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  isLoading = false,
  className
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel()
    }
  }

  const variantStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const style = variantStyles[type]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className={cn(
        'bg-white rounded-lg shadow-xl max-w-md w-full mx-auto',
        'transform transition-all duration-200 ease-out',
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        className
      )}>
        {/* 对话框内容 */}
        <div className="p-6">
          {/* 图标和标题 */}
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              style.iconBg
            )}>
              <span className={cn('text-lg', style.iconColor)}>
                {style.icon}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 
                id="dialog-title"
                className="text-lg font-medium text-gray-900 mb-2"
              >
                {title}
              </h3>
              <p 
                id="dialog-message"
                className="text-sm text-gray-600 leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col-reverse gap-3 px-6 pb-6 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'w-full sm:w-auto',
              style.confirmButton
            )}
          >
            {isLoading ? (
              <>
                <span className="mr-2">⏳</span>
                处理中...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}