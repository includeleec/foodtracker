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
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* 顶部导航栏 - 新设计 */}
      <header className="bg-surface shadow-sm border-b border-gray-200/50 sticky top-0 z-30 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-button flex items-center justify-center">
                <span className="text-white font-bold text-sm">🍽️</span>
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">
                每日食物记录
              </h1>
            </div>
            
            {/* 桌面端用户信息和退出按钮 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-background rounded-button">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">欢迎回来</div>
                  <div className="text-sm font-medium text-foreground max-w-32 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="rounded-button"
              >
                👋 退出登录
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

      {/* 桌面端主导航 - 新设计 */}
      <nav className="hidden md:block bg-surface border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-button transition-all duration-200 animate-spring
                  ${item.current
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-gray-600 hover:text-foreground hover:bg-gray-100 active:scale-95'
                  }
                `}
              >
                <span className="mr-2 text-base">{item.icon}</span>
                {item.name}
                {item.current && (
                  <div className="ml-2 w-2 h-2 bg-primary-foreground rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 移动端底部导航 - 使用新设计 */}
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