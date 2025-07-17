'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              每日食物记录
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                欢迎，{user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                欢迎使用每日食物记录应用
              </h2>
              <p className="text-gray-600 mb-6">
                开始记录您的日常饮食吧！
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  功能正在开发中...
                </p>
                <p className="text-sm text-gray-500">
                  • 今日记录
                </p>
                <p className="text-sm text-gray-500">
                  • 历史记录
                </p>
                <p className="text-sm text-gray-500">
                  • 日历视图
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}