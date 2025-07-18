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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 今日记录卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📝</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        今日记录
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        记录今天的饮食
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Button
                    onClick={() => router.push('/dashboard/today')}
                    className="w-full"
                  >
                    开始记录
                  </Button>
                </div>
              </div>
            </div>

            {/* 历史记录卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        历史记录
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        查看过往记录
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    即将推出
                  </Button>
                </div>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        数据统计
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        饮食分析报告
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    即将推出
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速开始指南 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              快速开始
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  1
                </span>
                <span>点击"开始记录"按钮，添加您的第一条食物记录</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  2
                </span>
                <span>选择餐次类型（早餐、中餐、晚餐、加餐）</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  3
                </span>
                <span>填写食物名称、重量、卡路里，可选择上传食物图片</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  4
                </span>
                <span>保存记录，系统会自动计算当日总卡路里</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}