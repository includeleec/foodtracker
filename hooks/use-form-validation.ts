'use client'

import { useState, useCallback, useEffect } from 'react'
import { ValidationError, FormValidationResult } from '@/types/database'

export interface UseFormValidationOptions<T> {
  validator: (data: T) => FormValidationResult
  validateOnChange?: boolean
  validateOnBlur?: boolean
  debounceMs?: number
}

export interface FormFieldState {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface UseFormValidationReturn<T> {
  values: T
  errors: Record<keyof T, string | null>
  touched: Record<keyof T, boolean>
  dirty: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
  setValue: (field: keyof T, value: any) => void
  setFieldTouched: (field: keyof T, touched?: boolean) => void
  setFieldError: (field: keyof T, error: string | null) => void
  validateField: (field: keyof T) => Promise<boolean>
  validateForm: () => Promise<boolean>
  resetForm: (newValues?: Partial<T>) => void
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [dirty, setDirty] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 防抖验证
  const [debounceTimeouts, setDebounceTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    const result = options.validator(values)
    const fieldError = result.errors.find(err => err.field === field)
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldError?.message || null
    }))

    return !fieldError
  }, [values, options.validator])

  const validateForm = useCallback(async (): Promise<boolean> => {
    const result = options.validator(values)
    
    const newErrors = {} as Record<keyof T, string | null>
    Object.keys(values).forEach(key => {
      const fieldError = result.errors.find(err => err.field === key)
      newErrors[key as keyof T] = fieldError?.message || null
    })
    
    setErrors(newErrors)
    return result.isValid
  }, [values, options.validator])

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setDirty(prev => ({ ...prev, [field]: true }))

    // 实时验证
    if (options.validateOnChange) {
      if (options.debounceMs && options.debounceMs > 0) {
        // 清除之前的防抖定时器
        if (debounceTimeouts[field as string]) {
          clearTimeout(debounceTimeouts[field as string])
        }

        // 设置新的防抖定时器
        const timeout = setTimeout(() => {
          validateField(field)
        }, options.debounceMs)

        setDebounceTimeouts(prev => ({
          ...prev,
          [field as string]: timeout
        }))
      } else {
        validateField(field)
      }
    }
  }, [options.validateOnChange, options.debounceMs, debounceTimeouts, validateField])

  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
    
    // 失焦验证
    if (isTouched && options.validateOnBlur) {
      validateField(field)
    }
  }, [options.validateOnBlur, validateField])

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const resetForm = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues
    setValues(resetValues)
    setErrors({} as Record<keyof T, string | null>)
    setTouched({} as Record<keyof T, boolean>)
    setDirty({} as Record<keyof T, boolean>)
    setIsSubmitting(false)
    
    // 清除所有防抖定时器
    Object.values(debounceTimeouts).forEach(timeout => clearTimeout(timeout))
    setDebounceTimeouts({})
  }, [initialValues, debounceTimeouts])

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      setIsSubmitting(true)
      
      try {
        // 标记所有字段为已触摸
        const allTouched = {} as Record<keyof T, boolean>
        Object.keys(values).forEach(key => {
          allTouched[key as keyof T] = true
        })
        setTouched(allTouched)

        // 验证表单
        const isValid = await validateForm()
        
        if (isValid) {
          await onSubmit(values)
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateForm])

  // 计算是否有效
  const isValid = Object.values(errors).every(error => !error)

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [debounceTimeouts])

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    setValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    handleSubmit
  }
}