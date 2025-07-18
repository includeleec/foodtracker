import { renderHook, act } from '@testing-library/react'
import { useConfirmation } from '../use-confirmation'

describe('useConfirmation', () => {
  it('应该初始化关闭状态', () => {
    const { result } = renderHook(() => useConfirmation())

    expect(result.current.confirmation.isOpen).toBe(false)
    expect(result.current.confirmation.isLoading).toBe(false)
  })

  it('应该显示确认对话框', async () => {
    const { result } = renderHook(() => useConfirmation())

    let confirmationPromise: Promise<boolean>
    act(() => {
      confirmationPromise = result.current.showConfirmation({
        title: 'Confirm Action',
        message: 'Are you sure?',
        confirmText: 'Yes',
        cancelText: 'No'
      })
    })

    expect(result.current.confirmation.isOpen).toBe(true)
    expect(result.current.confirmation.title).toBe('Confirm Action')
    expect(result.current.confirmation.message).toBe('Are you sure?')
    expect(result.current.confirmation.confirmText).toBe('Yes')
    expect(result.current.confirmation.cancelText).toBe('No')

    // 确认操作
    act(() => {
      result.current.confirmAction()
    })

    const confirmed = await confirmationPromise!
    expect(confirmed).toBe(true)
    expect(result.current.confirmation.isOpen).toBe(false)
  })

  it('应该取消确认对话框', async () => {
    const { result } = renderHook(() => useConfirmation())

    let confirmationPromise: Promise<boolean>
    act(() => {
      confirmationPromise = result.current.showConfirmation({
        message: 'Are you sure?'
      })
    })

    expect(result.current.confirmation.isOpen).toBe(true)

    // 取消操作
    act(() => {
      result.current.cancelAction()
    })

    const confirmed = await confirmationPromise!
    expect(confirmed).toBe(false)
    expect(result.current.confirmation.isOpen).toBe(false)
  })

  it('应该执行确认回调', async () => {
    const { result } = renderHook(() => useConfirmation())
    const mockOnConfirm = jest.fn().mockResolvedValue(undefined)

    let confirmationPromise: Promise<boolean>
    act(() => {
      confirmationPromise = result.current.showConfirmation({
        message: 'Are you sure?',
        onConfirm: mockOnConfirm
      })
    })

    // 确认操作
    await act(async () => {
      await result.current.confirmAction()
    })

    expect(mockOnConfirm).toHaveBeenCalled()
    const confirmed = await confirmationPromise!
    expect(confirmed).toBe(true)
  })

  it('应该执行取消回调', () => {
    const { result } = renderHook(() => useConfirmation())
    const mockOnCancel = jest.fn()

    act(() => {
      result.current.showConfirmation({
        message: 'Are you sure?',
        onCancel: mockOnCancel
      })
    })

    act(() => {
      result.current.cancelAction()
    })

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('应该处理确认回调中的错误', async () => {
    const { result } = renderHook(() => useConfirmation())
    const mockOnConfirm = jest.fn().mockRejectedValue(new Error('Confirmation failed'))

    // Mock console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    let confirmationPromise: Promise<boolean>
    act(() => {
      confirmationPromise = result.current.showConfirmation({
        message: 'Are you sure?',
        onConfirm: mockOnConfirm
      })
    })

    // 确认操作
    await act(async () => {
      await result.current.confirmAction()
    })

    expect(mockOnConfirm).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('Confirmation action failed:', expect.any(Error))
    
    const confirmed = await confirmationPromise!
    expect(confirmed).toBe(false)

    consoleSpy.mockRestore()
  })

  it('应该显示加载状态', async () => {
    const { result } = renderHook(() => useConfirmation())
    const mockOnConfirm = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    act(() => {
      result.current.showConfirmation({
        message: 'Are you sure?',
        onConfirm: mockOnConfirm
      })
    })

    // 开始确认操作
    const confirmPromise = act(async () => {
      await result.current.confirmAction()
    })

    // 检查加载状态
    expect(result.current.confirmation.isLoading).toBe(true)

    // 等待完成
    await confirmPromise

    expect(result.current.confirmation.isLoading).toBe(false)
  })

  it('应该手动隐藏确认对话框', async () => {
    const { result } = renderHook(() => useConfirmation())

    let confirmationPromise: Promise<boolean>
    act(() => {
      confirmationPromise = result.current.showConfirmation({
        message: 'Are you sure?'
      })
    })

    expect(result.current.confirmation.isOpen).toBe(true)

    act(() => {
      result.current.hideConfirmation()
    })

    expect(result.current.confirmation.isOpen).toBe(false)
    const confirmed = await confirmationPromise!
    expect(confirmed).toBe(false)
  })

  it('应该支持不同类型的确认对话框', () => {
    const { result } = renderHook(() => useConfirmation())

    act(() => {
      result.current.showConfirmation({
        message: 'Delete item?',
        type: 'danger'
      })
    })

    expect(result.current.confirmation.type).toBe('danger')
  })
})