import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../use-form-validation'
import { FormValidationResult } from '@/types/database'

// Mock validator function
const mockValidator = jest.fn()

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const initialValues = {
    name: '',
    email: '',
    age: 0
  }

  const validationOptions = {
    validator: mockValidator,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  }

  it('应该初始化表单状态', () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.dirty).toEqual({})
    expect(result.current.isValid).toBe(true)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('应该更新字段值', () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    act(() => {
      result.current.setValue('name', 'John Doe')
    })

    expect(result.current.values.name).toBe('John Doe')
    expect(result.current.dirty.name).toBe(true)
  })

  it('应该在值改变时进行防抖验证', async () => {
    mockValidator.mockReturnValue({ 
      isValid: false, 
      errors: [{ field: 'name', message: 'Name is required' }] 
    })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    act(() => {
      result.current.setValue('name', 'John')
    })

    // 验证还没有被调用（因为防抖）
    expect(mockValidator).not.toHaveBeenCalled()

    // 快进防抖时间
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(mockValidator).toHaveBeenCalledWith({
      ...initialValues,
      name: 'John'
    })
  })

  it('应该在字段失焦时验证', () => {
    mockValidator.mockReturnValue({ 
      isValid: false, 
      errors: [{ field: 'email', message: 'Email is invalid' }] 
    })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    act(() => {
      result.current.setFieldTouched('email', true)
    })

    expect(result.current.touched.email).toBe(true)
    expect(mockValidator).toHaveBeenCalledWith(initialValues)
  })

  it('应该验证整个表单', async () => {
    mockValidator.mockReturnValue({ 
      isValid: false, 
      errors: [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is required' }
      ] 
    })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    let isValid: boolean
    await act(async () => {
      isValid = await result.current.validateForm()
    })

    expect(isValid!).toBe(false)
    expect(result.current.errors.name).toBe('Name is required')
    expect(result.current.errors.email).toBe('Email is required')
  })

  it('应该处理表单提交', async () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const mockSubmit = jest.fn().mockResolvedValue(undefined)
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    const handleSubmit = result.current.handleSubmit(mockSubmit)

    await act(async () => {
      await handleSubmit()
    })

    expect(mockSubmit).toHaveBeenCalledWith(initialValues)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('应该在提交失败时不调用onSubmit', async () => {
    mockValidator.mockReturnValue({ 
      isValid: false, 
      errors: [{ field: 'name', message: 'Name is required' }] 
    })
    
    const mockSubmit = jest.fn()
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    const handleSubmit = result.current.handleSubmit(mockSubmit)

    await act(async () => {
      await handleSubmit()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('应该重置表单', () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    // 修改表单状态
    act(() => {
      result.current.setValue('name', 'John')
      result.current.setFieldTouched('name', true)
      result.current.setFieldError('name', 'Some error')
    })

    // 重置表单
    act(() => {
      result.current.resetForm()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.dirty).toEqual({})
  })

  it('应该用新值重置表单', () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    const newValues = { name: 'Jane', email: 'jane@example.com' }

    act(() => {
      result.current.resetForm(newValues)
    })

    expect(result.current.values).toEqual({
      ...initialValues,
      ...newValues
    })
  })

  it('应该设置字段错误', () => {
    mockValidator.mockReturnValue({ isValid: true, errors: [] })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    act(() => {
      result.current.setFieldError('name', 'Custom error')
    })

    expect(result.current.errors.name).toBe('Custom error')
  })

  it('应该验证单个字段', async () => {
    mockValidator.mockReturnValue({ 
      isValid: false, 
      errors: [{ field: 'name', message: 'Name is required' }] 
    })
    
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationOptions)
    )

    let isValid: boolean
    await act(async () => {
      isValid = await result.current.validateField('name')
    })

    expect(isValid!).toBe(false)
    expect(result.current.errors.name).toBe('Name is required')
  })
})