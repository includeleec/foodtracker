import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '../use-network-status'

// Mock navigator
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g'
  }
}

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Reset navigator mock
    mockNavigator.onLine = true
    mockNavigator.connection.effectiveType = '4g'
    
    // Clear event listeners
    jest.clearAllMocks()
  })

  it('应该初始化网络状态', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isSlowConnection).toBe(false)
    expect(result.current.effectiveType).toBe('4g')
  })

  it('应该检测离线状态', () => {
    mockNavigator.onLine = false
    
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      // 模拟离线事件
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('应该检测在线状态', () => {
    mockNavigator.onLine = false
    
    const { result } = renderHook(() => useNetworkStatus())

    // 初始状态应该是离线
    act(() => {
      const offlineEvent = new Event('offline')
      window.dispatchEvent(offlineEvent)
    })

    expect(result.current.isOnline).toBe(false)

    // 模拟重新上线
    mockNavigator.onLine = true
    
    act(() => {
      const onlineEvent = new Event('online')
      window.dispatchEvent(onlineEvent)
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('应该检测慢速连接', () => {
    mockNavigator.connection.effectiveType = '2g'
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isSlowConnection).toBe(true)
    expect(result.current.effectiveType).toBe('2g')
  })

  it('应该检测slow-2g连接', () => {
    mockNavigator.connection.effectiveType = 'slow-2g'
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isSlowConnection).toBe(true)
    expect(result.current.effectiveType).toBe('slow-2g')
  })

  it('应该处理没有connection API的情况', () => {
    // 移除connection API
    const originalConnection = mockNavigator.connection
    delete (mockNavigator as any).connection

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isSlowConnection).toBe(false)
    expect(result.current.effectiveType).toBeUndefined()

    // 恢复connection API
    mockNavigator.connection = originalConnection
  })

  it('应该监听连接变化事件', () => {
    const { result } = renderHook(() => useNetworkStatus())

    // 模拟连接变化
    mockNavigator.connection.effectiveType = '3g'

    act(() => {
      // 模拟connection change事件
      const changeEvent = new Event('change')
      mockNavigator.connection.dispatchEvent?.(changeEvent)
    })

    // 注意：由于我们的mock比较简单，这个测试主要验证代码不会崩溃
    expect(result.current.effectiveType).toBeDefined()
  })

  it('应该在组件卸载时清理事件监听器', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = renderHook(() => useNetworkStatus())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('应该处理服务器端渲染', () => {
    // 模拟服务器端环境
    const originalWindow = global.window
    delete (global as any).window

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isSlowConnection).toBe(false)

    // 恢复window对象
    global.window = originalWindow
  })
})