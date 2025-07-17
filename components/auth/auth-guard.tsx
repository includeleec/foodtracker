'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export function AuthGuard({ 
  children, 
  redirectTo = '/auth/login',
  requireAuth = true 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 检查当前用户状态
    const checkUser = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)

      // 如果需要认证但用户未登录，重定向到登录页
      if (requireAuth && !currentUser) {
        router.push(redirectTo)
        return
      }

      // 如果不需要认证但用户已登录，重定向到主页
      if (!requireAuth && currentUser) {
        router.push('/')
        return
      }
    }

    checkUser()

    // 监听认证状态变化
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user)
      
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [requireAuth, redirectTo, router])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果需要认证但用户未登录，不渲染内容
  if (requireAuth && !user) {
    return null
  }

  // 如果不需要认证但用户已登录，不渲染内容
  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}