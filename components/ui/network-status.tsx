'use client'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function NetworkStatus({ className }: { className?: string }) {
  const { isOnline, isSlowConnection } = useNetworkStatus()
  const [isMounted, setIsMounted] = useState(false)

  // 防止 SSR 和客户端渲染不一致
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null // SSR 期间不渲染，避免 hydration 不匹配
  }

  if (isOnline && !isSlowConnection) {
    return null // 网络正常时不显示
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 text-center py-2 text-sm font-medium',
      !isOnline 
        ? 'bg-red-500 text-white' 
        : 'bg-yellow-500 text-black',
      className
    )}>
      {!isOnline ? (
        <span>⚠️ 网络连接已断开，请检查您的网络设置</span>
      ) : (
        <span>🐌 网络连接较慢，加载可能需要更长时间</span>
      )}
    </div>
  )
}

// 网络状态指示器组件
export function NetworkIndicator({ className }: { className?: string }) {
  const { isOnline, isSlowConnection } = useNetworkStatus()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="text-xs text-gray-400">检测中</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        isOnline 
          ? isSlowConnection 
            ? 'bg-yellow-500' 
            : 'bg-green-500'
          : 'bg-red-500'
      )} />
      <span className="text-xs text-gray-600">
        {!isOnline ? '离线' : isSlowConnection ? '慢速' : '在线'}
      </span>
    </div>
  )
}