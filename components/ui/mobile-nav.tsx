'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: string
  current?: boolean
}

interface MobileNavProps {
  items: NavigationItem[]
  userEmail?: string
  onSignOut?: () => void
  className?: string
}

export function MobileNav({ items, userEmail, onSignOut, className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className={cn('md:hidden', className)}>
      {/* 移动端菜单按钮 */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-label="打开主菜单"
      >
        <span className="sr-only">打开主菜单</span>
        {/* 汉堡菜单图标 */}
        <svg
          className={cn('h-6 w-6 transition-transform duration-200', isOpen && 'rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 移动端菜单覆盖层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25"
          onClick={closeMenu}
        />
      )}

      {/* 移动端菜单面板 */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* 菜单头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
            <button
              onClick={closeMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="关闭菜单"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 用户信息 */}
          {userEmail && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">当前用户</div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {userEmail}
              </div>
            </div>
          )}

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 底部操作 */}
          {onSignOut && (
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  onSignOut()
                  closeMenu()
                }}
                variant="outline"
                className="w-full"
              >
                退出登录
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 底部导航栏组件（适用于移动端）- 升级版本
export function BottomNav({ items, className }: { items: NavigationItem[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40 md:hidden',
      // 毛玻璃效果背景
      'backdrop-blur-xl bg-white/80 border-t border-gray-200/50',
      // 支持安全区域
      'pb-safe',
      className
    )}>
      <div className="flex w-full">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                // 触摸友好的尺寸 - 修复：使用flex-1确保均分宽度
                'flex-1 flex flex-col items-center justify-center',
                'touch-comfortable px-2 py-2 text-xs font-medium',
                // 平滑过渡动画
                'transition-all duration-200 animate-spring',
                // 活跃状态样式
                isActive
                  ? 'text-primary scale-105'
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              )}
            >
              <div className="relative">
                {/* 图标 */}
                <span className={cn(
                  'text-xl mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </span>
                
                {/* 活跃指示器 */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                )}
              </div>
              
              {/* 标签文字 - 修复：在小屏幕下使用更小的字体和更紧凑的布局 */}
              <span className={cn(
                'text-center mt-1 transition-colors duration-200 leading-tight',
                // 响应式字体大小：在极小屏幕下使用更小字体
                'text-[10px] xs:text-xs',
                // 确保文字不换行但可以在必要时截断
                'whitespace-nowrap overflow-hidden text-ellipsis w-full px-1',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * 改进的侧边栏导航组件
 */
/**
 * 用户头像组件（移动端）
 */
export function UserAvatar({ 
  email, 
  onSignOut, 
  className 
}: { 
  email?: string; 
  onSignOut?: () => void; 
  className?: string 
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const getInitial = (email?: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const handleAvatarClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmSignOut = () => {
    setShowConfirm(false)
    onSignOut?.()
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <div className={cn('relative', className)}>
      {/* 用户头像按钮 */}
      <button
        onClick={handleAvatarClick}
        className={cn(
          'w-8 h-8 rounded-full bg-primary flex items-center justify-center',
          'text-primary-foreground font-semibold text-sm',
          'hover:bg-primary/90 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'active:scale-95 transition-transform'
        )}
        aria-label="用户菜单"
      >
        {getInitial(email)}
      </button>

      {/* 登出确认弹窗 */}
      {showConfirm && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40 bg-black/25"
            onClick={handleCancel}
          />
          
          {/* 确认弹窗 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-2">
                确认登出
              </div>
              <div className="text-sm text-gray-600 mb-6">
                您确定要登出当前账户吗？
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmSignOut}
                  className="flex-1"
                >
                  确认登出
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function SidebarNav({ items, userEmail, onSignOut, className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className={cn('md:hidden', className)}>
      {/* 菜单触发按钮 - 圆角设计 */}
      <button
        onClick={toggleMenu}
        className={cn(
          'touch-target rounded-button',
          'bg-surface shadow-sm border border-gray-200',
          'text-gray-600 hover:text-primary hover:bg-gray-50',
          'transition-all duration-200 animate-spring',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'active:scale-95'
        )}
        aria-expanded={isOpen}
        aria-label="打开主菜单"
      >
        <span className="sr-only">打开主菜单</span>
        {/* 汉堡菜单图标 */}
        <svg
          className={cn('h-5 w-5 transition-transform duration-300', isOpen && 'rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 覆盖层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* 侧边栏面板 - 超圆角设计 */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw]',
          'bg-surface shadow-2xl',
          // 左侧圆角
          'rounded-l-3xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* 菜单头部 - 渐变背景 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-background">
            <h2 className="text-xl font-semibold text-foreground">菜单</h2>
            <button
              onClick={closeMenu}
              className={cn(
                'touch-target rounded-button',
                'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                'transition-all duration-200 animate-spring',
                'active:scale-95'
              )}
              aria-label="关闭菜单"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 用户信息卡片 */}
          {userEmail && (
            <div className="p-6 border-b border-gray-100">
              <div className={cn(
                'p-4 rounded-card bg-gradient-to-br from-primary/10 to-background',
                'border border-primary/20'
              )}>
                <div className="text-sm text-gray-600 mb-1">当前用户</div>
                <div className="text-base font-medium text-foreground truncate">
                  {userEmail}
                </div>
              </div>
            </div>
          )}

          {/* 导航菜单 */}
          <nav className="flex-1 px-6 py-4 space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-button text-base font-medium',
                    'transition-all duration-200 animate-spring',
                    'touch-comfortable',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:scale-95'
                  )}
                >
                  <span className="mr-4 text-xl">{item.icon}</span>
                  {item.name}
                  
                  {/* 活跃状态右侧指示器 */}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部操作区域 */}
          {onSignOut && (
            <div className="p-6 border-t border-gray-100">
              <Button
                onClick={() => {
                  onSignOut()
                  closeMenu()
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <span className="mr-2">👋</span>
                退出登录
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}