'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const toastIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
}

export function Toast({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  className,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // 等待动画完成
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
    >
      <div className={cn(
        'border rounded-lg p-4 shadow-lg',
        toastStyles[type]
      )}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3 text-lg">
            {toastIcons[type]}
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-medium mb-1">{title}</h4>
            )}
            <p className="text-sm">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-3 text-lg hover:opacity-70 transition-opacity"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast 容器组件
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  )
}

// 简化的成功提示组件
export function SuccessToast({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Toast type="success" message={message} onClose={onClose} />
}

// 简化的错误提示组件
export function ErrorToast({ message, onClose }: { message: string; onClose?: () => void }) {
  return <Toast type="error" message={message} onClose={onClose} />
}