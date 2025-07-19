import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { AuthService } from '../auth'

// Mock AuthService
jest.mock('../auth', () => ({
  AuthService: {
    getCurrentUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
  },
}))

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div data-testid="user-email">{user?.email || 'No user'}</div>
      <button onClick={signOut} data-testid="sign-out-btn">
        Sign Out
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide initial loading state', () => {
    mockAuthService.getCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should provide user when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('should provide null user when not authenticated', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
    })
  })

  it('should handle sign out', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser as any)
    mockAuthService.signOut.mockResolvedValue({ success: true })
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    await act(async () => {
      screen.getByTestId('sign-out-btn').click()
    })

    expect(mockAuthService.signOut).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    let authCallback: (user: any) => void

    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      } as any
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
    })

    // Simulate auth state change
    act(() => {
      authCallback!(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})