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

// 底部导航栏组件（适用于移动端）
export function BottomNav({ items, className }: { items: NavigationItem[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40',
      className
    )}>
      <div className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}