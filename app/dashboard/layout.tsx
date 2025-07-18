'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MobileNav, BottomNav } from '@/components/ui/mobile-nav'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      setSignOutError(null)
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      setSignOutError('退出登录失败，请重试')
    }
  }

  if (loading) {
    return <PageLoading text="加载中..." />
  }

  if (!user) {
    return null
  }

  const navigationItems = [
    {
      name: '仪表板',
      href: '/dashboard',
      icon: '🏠',
      current: pathname === '/dashboard'
    },
    {
      name: '今日记录',
      href: '/dashboard/today',
      icon: '📝',
      current: pathname === '/dashboard/today'
    },
    {
      name: '历史记录',
      href: '/dashboard/history',
      icon: '📅',
      current: pathname === '/dashboard/history'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                每日食物记录
              </h1>
            </div>
            
            {/* 桌面端用户信息和退出按钮 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="hidden lg:block">
                <span className="text-sm text-gray-600">欢迎，</span>
                <span className="text-sm font-medium text-gray-900 max-w-32 truncate inline-block">
                  {user.email}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                退出登录
              </Button>
            </div>

            {/* 移动端菜单按钮 */}
            <MobileNav
              items={navigationItems}
              userEmail={user.email}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </header>

      {/* 桌面端主导航 */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${item.current
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <BottomNav items={navigationItems} />

      {/* 错误提示 */}
      {signOutError && (
        <Toast
          type="error"
          message={signOutError}
          onClose={() => setSignOutError(null)}
        />
      )}
    </div>
  )
}