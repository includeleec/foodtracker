'use client'

import { useState, useEffect } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  effectiveType?: string
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? 
          ['slow-2g', '2g'].includes(connection.effectiveType) : false,
        effectiveType: connection?.effectiveType
      })
    }

    const handleOnline = () => {
      updateNetworkStatus()
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }))
    }

    // 初始化网络状态
    updateNetworkStatus()

    // 监听网络状态变化
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听连接变化（如果支持）
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return networkStatus
}