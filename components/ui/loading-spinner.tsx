'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  color?: 'blue' | 'gray' | 'white'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorClasses = {
  blue: 'border-blue-600',
  gray: 'border-gray-600',
  white: 'border-white'
}

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  color = 'blue'
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-b-2',
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label={text || '加载中'}
      />
      {text && (
        <p className={cn(
          'mt-2 text-gray-600',
          size === 'sm' ? 'text-xs' : size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// 页面级加载组件
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// 内容区域加载组件
export function ContentLoading({ text = '加载中...', className }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}

// 按钮内加载组件
export function ButtonLoading({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LoadingSpinner size="sm" color="white" className="mr-2" />
      {text && <span>{text}</span>}
    </div>
  )
}