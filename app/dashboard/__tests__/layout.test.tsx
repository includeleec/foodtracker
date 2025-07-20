import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '../layout'
import { useAuth } from '@/lib/auth-context'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user1', email: 'test@example.com' },
    signOut: jest.fn()
  })),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
    mockUsePathname.mockReturnValue('/dashboard')
  })

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should render dashboard layout when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByText('每日食物记录')).toBeInTheDocument()
    expect(screen.getByText('欢迎，')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('退出登录')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should display navigation items with correct active state', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByText('仪表板')).toBeInTheDocument()
    expect(screen.getByText('今日记录')).toBeInTheDocument()
    expect(screen.getByText('历史记录')).toBeInTheDocument()

    // Check that dashboard is active (current path is /dashboard)
    const dashboardLink = screen.getByText('仪表板').closest('a')
    expect(dashboardLink).toHaveClass('text-blue-600', 'border-blue-500')
  })

  it('should highlight correct navigation item based on pathname', () => {
    mockUsePathname.mockReturnValue('/dashboard/today')
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    const todayLink = screen.getByText('今日记录').closest('a')
    expect(todayLink).toHaveClass('text-blue-600', 'border-blue-500')
  })

  it('should handle sign out correctly', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined)
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    const signOutButton = screen.getByText('退出登录')
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should handle sign out error gracefully', async () => {
    const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    const signOutButton = screen.getByText('退出登录')
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('退出登录失败:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should have correct navigation links', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    const dashboardLink = screen.getByText('仪表板').closest('a')
    const todayLink = screen.getByText('今日记录').closest('a')
    const historyLink = screen.getByText('历史记录').closest('a')

    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(todayLink).toHaveAttribute('href', '/dashboard/today')
    expect(historyLink).toHaveAttribute('href', '/dashboard/history')
  })

  it('should be responsive and hide user email on small screens', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    const userInfoDiv = screen.getByText('欢迎，').parentElement
    expect(userInfoDiv).toHaveClass('hidden', 'sm:block')
  })
})