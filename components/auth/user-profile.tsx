'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface UserProfileProps {
  onSignOut?: () => void
}

export function UserProfile({ onSignOut }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 获取当前用户信息
    const getCurrentUser = async () => {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    }

    getCurrentUser()

    // 监听认证状态变化
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const result = await AuthService.signOut()
      if (result.success) {
        onSignOut?.()
      } else {
        alert(result.error?.message || '登出失败')
      }
    } catch (error) {
      alert('登出失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">用户信息</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">邮箱</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">用户ID</label>
          <p className="text-gray-900 font-mono text-sm">{user.id}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">注册时间</label>
          <p className="text-gray-900">
            {user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">邮箱验证状态</label>
          <p className={`${user.email_confirmed_at ? 'text-green-600' : 'text-orange-600'}`}>
            {user.email_confirmed_at ? '已验证' : '未验证'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <Button
          onClick={handleSignOut}
          variant="outline"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '登出中...' : '登出'}
        </Button>
      </div>
    </div>
  )
}