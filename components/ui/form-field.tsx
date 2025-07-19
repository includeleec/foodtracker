'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label?: string
  error?: string | null
  touched?: boolean
  required?: boolean
  children: React.ReactElement
  className?: string
  helpText?: string
}

export function FormField({ 
  label, 
  error, 
  touched, 
  required, 
  children, 
  className,
  helpText 
}: FormFieldProps) {
  const hasError = touched && error
  const childId = React.isValidElement(children) ? (children.props as any).id || (children.props as any).name : undefined

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label 
          htmlFor={childId}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-red-700' : 'text-gray-700'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {React.cloneElement(children, {
          ...(children.props as any),
          className: cn(
            'border rounded-md shadow-sm w-full px-3 py-2 text-sm',
            hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            (children.props as any).className
          ),
          'aria-invalid': hasError,
          'aria-describedby': hasError ? `${childId}-error` : helpText ? `${childId}-help` : undefined
        } as any)}
        
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {hasError && (
        <p id={`${childId}-error`} className="text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {!hasError && helpText && (
        <p id={`${childId}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}

// 输入框组件
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// 文本域组件
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm',
          'placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

// 选择框组件
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'