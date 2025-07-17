import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserProfile } from '../user-profile'
import { AuthService } from '@/lib/auth'

// Mock AuthService
jest.mock('@/lib/auth', () => ({
  AuthService: {
    getCurrentUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
  },
}))

// Mock window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
}

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    } as any)
  })

  it('renders nothing when user is not authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    
    const { container } = render(<UserProfile />)
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('renders user information when user is authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    
    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByText('用户信息')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('123e4567-e89b-12d3-a456-426614174000')).toBeInTheDocument()
      expect(screen.getByText('已验证')).toBeInTheDocument()
    })
  })

  it('shows unverified status when email is not confirmed', async () => {
    const unverifiedUser = { ...mockUser, email_confirmed_at: null }
    mockAuthService.getCurrentUser.mockResolvedValue(unverifiedUser as any)
    
    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByText('未验证')).toBeInTheDocument()
    })
  })

  it('formats creation date correctly', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    
    render(<UserProfile />)

    await waitFor(() => {
      // Check that the date is formatted in Chinese locale
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })

  it('handles sign out successfully', async () => {
    const mockOnSignOut = jest.fn()
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    mockAuthService.signOut.mockResolvedValue({ success: true })
    
    render(<UserProfile onSignOut={mockOnSignOut} />)

    await waitFor(() => {
      expect(screen.getByText('登出')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('登出'))

    await waitFor(() => {
      expect(mockAuthService.signOut).toHaveBeenCalled()
      expect(mockOnSignOut).toHaveBeenCalled()
    })
  })

  it('shows error message when sign out fails', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    mockAuthService.signOut.mockResolvedValue({
      success: false,
      error: { message: '登出失败' }
    })
    
    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByText('登出')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('登出'))

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('登出失败')
    })
  })

  it('shows loading state during sign out', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    mockAuthService.signOut.mockReturnValue(new Promise(() => {})) // Never resolves
    
    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByText('登出')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('登出'))

    await waitFor(() => {
      expect(screen.getByText('登出中...')).toBeInTheDocument()
    })
  })

  it('updates user info when auth state changes', async () => {
    let authCallback: (user: any) => void = () => {}
    
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      } as any
    })

    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    
    render(<UserProfile />)

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    // Simulate user change
    const newUser = { ...mockUser, email: 'new@example.com' }
    authCallback(newUser)

    await waitFor(() => {
      expect(screen.getByText('new@example.com')).toBeInTheDocument()
    })
  })
})