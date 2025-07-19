import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { MobileNav, BottomNav } from '../mobile-nav'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

const mockNavigationItems = [
  { name: '首页', href: '/', icon: '🏠' },
  { name: '记录', href: '/records', icon: '📝' },
  { name: '历史', href: '/history', icon: '📅' },
]

describe('MobileNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('renders menu button', () => {
    render(<MobileNav items={mockNavigationItems} />)
    
    const menuButton = screen.getByLabelText('打开主菜单')
    expect(menuButton).toBeInTheDocument()
  })

  it('opens menu when button is clicked', () => {
    render(<MobileNav items={mockNavigationItems} />)
    
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    expect(screen.getByText('菜单')).toBeInTheDocument()
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('记录')).toBeInTheDocument()
    expect(screen.getByText('历史')).toBeInTheDocument()
  })

  it('closes menu when close button is clicked', () => {
    render(<MobileNav items={mockNavigationItems} />)
    
    // 打开菜单
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    // 关闭菜单
    const closeButton = screen.getByLabelText('关闭菜单')
    fireEvent.click(closeButton)
    
    // 菜单应该关闭（通过transform样式）
    const menuPanel = screen.getByText('菜单').closest('.fixed')
    expect(menuPanel).toHaveClass('translate-x-full')
  })

  it('closes menu when overlay is clicked', () => {
    render(<MobileNav items={mockNavigationItems} />)
    
    // 打开菜单
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    // 点击覆盖层
    const overlay = document.querySelector('.bg-black.bg-opacity-25')
    expect(overlay).toBeInTheDocument()
    fireEvent.click(overlay!)
    
    // 菜单应该关闭
    const menuPanel = screen.getByText('菜单').closest('.fixed')
    expect(menuPanel).toHaveClass('translate-x-full')
  })

  it('displays user email when provided', () => {
    const userEmail = 'test@example.com'
    render(<MobileNav items={mockNavigationItems} userEmail={userEmail} />)
    
    // 打开菜单
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    expect(screen.getByText('当前用户')).toBeInTheDocument()
    expect(screen.getByText(userEmail)).toBeInTheDocument()
  })

  it('displays sign out button when onSignOut is provided', () => {
    const onSignOut = jest.fn()
    render(<MobileNav items={mockNavigationItems} onSignOut={onSignOut} />)
    
    // 打开菜单
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    const signOutButton = screen.getByText('退出登录')
    expect(signOutButton).toBeInTheDocument()
    
    fireEvent.click(signOutButton)
    expect(onSignOut).toHaveBeenCalled()
  })

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/records')
    render(<MobileNav items={mockNavigationItems} />)
    
    // 打开菜单
    const menuButton = screen.getByLabelText('打开主菜单')
    fireEvent.click(menuButton)
    
    const recordsLink = screen.getByText('记录').closest('a')
    expect(recordsLink).toHaveClass('bg-blue-100', 'text-blue-700')
  })
})

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('renders all navigation items', () => {
    render(<BottomNav items={mockNavigationItems} />)
    
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('记录')).toBeInTheDocument()
    expect(screen.getByText('历史')).toBeInTheDocument()
    
    // 检查图标
    expect(screen.getByText('🏠')).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
    expect(screen.getByText('📅')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/records')
    render(<BottomNav items={mockNavigationItems} />)
    
    const recordsLink = screen.getByText('记录').closest('a')
    expect(recordsLink).toHaveClass('text-blue-600', 'bg-blue-50')
  })

  it('applies correct href to navigation links', () => {
    render(<BottomNav items={mockNavigationItems} />)
    
    const homeLink = screen.getByText('首页').closest('a')
    const recordsLink = screen.getByText('记录').closest('a')
    const historyLink = screen.getByText('历史').closest('a')
    
    expect(homeLink).toHaveAttribute('href', '/')
    expect(recordsLink).toHaveAttribute('href', '/records')
    expect(historyLink).toHaveAttribute('href', '/history')
  })
})