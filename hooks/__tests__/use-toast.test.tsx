import { renderHook, act } from '@testing-library/react'
import { useToast } from '../use-toast'

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('应该初始化空的toast列表', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toasts).toEqual([])
  })

  it('应该添加toast消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast({
        type: 'success',
        message: 'Test message'
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Test message'
    })
    expect(result.current.toasts[0].id).toBeDefined()
  })

  it('应该添加带标题的toast消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast({
        type: 'error',
        title: 'Error Title',
        message: 'Error message'
      })
    })

    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Error Title',
      message: 'Error message'
    })
  })

  it('应该自动隐藏toast消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast({
        type: 'info',
        message: 'Auto hide message',
        duration: 1000
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('应该不自动隐藏duration为0的toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast({
        type: 'error',
        message: 'Persistent message',
        duration: 0
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(result.current.toasts).toHaveLength(1)
  })

  it('应该手动隐藏toast消息', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string
    act(() => {
      toastId = result.current.showToast({
        type: 'warning',
        message: 'Manual hide message'
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.hideToast(toastId!)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('应该清除所有toast消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast({ type: 'success', message: 'Message 1' })
      result.current.showToast({ type: 'error', message: 'Message 2' })
      result.current.showToast({ type: 'info', message: 'Message 3' })
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.clearAllToasts()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('应该使用便捷方法显示成功消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showSuccess('Success message', 'Success Title')
    })

    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Success Title',
      message: 'Success message'
    })
  })

  it('应该使用便捷方法显示错误消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showError('Error message', 'Error Title')
    })

    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Error Title',
      message: 'Error message',
      duration: 0 // 错误消息不自动消失
    })
  })

  it('应该使用便捷方法显示警告消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showWarning('Warning message')
    })

    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      message: 'Warning message'
    })
  })

  it('应该使用便捷方法显示信息消息', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showInfo('Info message')
    })

    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message'
    })
  })

  it('应该支持带操作的toast消息', () => {
    const { result } = renderHook(() => useToast())

    const mockAction = {
      label: 'Undo',
      onClick: jest.fn()
    }

    act(() => {
      result.current.showToast({
        type: 'info',
        message: 'Action message',
        action: mockAction
      })
    })

    expect(result.current.toasts[0].action).toEqual(mockAction)
  })
})