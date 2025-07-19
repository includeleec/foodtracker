'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      const user = await AuthService.getCurrentUser()
      if (user) {
        router.push('/dashboard')
        return
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLoginSuccess = () => {
    router.push('/dashboard')
  }

  const handleModeChange = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      router.push('/auth/register')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" role="status" aria-label="加载中"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            每日食物记录
          </h1>
          <p className="text-gray-600">
            登录您的账户开始记录饮食
          </p>
        </div>
        
        <AuthForm
          mode="login"
          onSuccess={handleLoginSuccess}
          onModeChange={handleModeChange}
        />
      </div>
    </div>
  )
}