import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '../auth-guard'
import { AuthService } from '@/lib/auth'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthService
jest.mock('@/lib/auth', () => ({
  AuthService: {
    getCurrentUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
}

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockAuthService.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    } as any)
  })

  describe('Require Auth (default)', () => {
    it('shows loading state initially', () => {
      mockAuthService.getCurrentUser.mockReturnValue(new Promise(() => {})) // Never resolves
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )
      
      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('renders children when user is authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' } as any
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('uses custom redirect path', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      render(
        <AuthGuard redirectTo="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/custom-login')
      })
    })
  })

  describe('No Auth Required', () => {
    it('renders children when user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Public Content')).toBeInTheDocument()
      })
    })

    it('redirects to home when user is authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' } as any
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('Auth State Changes', () => {
    it('handles auth state changes correctly', async () => {
      let authCallback: (user: any) => void = () => {}
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        } as any
      })

      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
      })

      // Simulate user login
      const mockUser = { id: '123', email: 'test@example.com' } as any
      authCallback(mockUser)

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })
  })
})