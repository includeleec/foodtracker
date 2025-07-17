import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '../page'
import { AuthService } from '@/lib/auth'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  AuthService: {
    getCurrentUser: jest.fn(),
  },
}))

jest.mock('@/components/auth/auth-form', () => ({
  AuthForm: ({ mode, onSuccess, onModeChange }: any) => (
    <div data-testid="auth-form">
      <span data-testid="mode">{mode}</span>
      <button onClick={onSuccess} data-testid="success-btn">Success</button>
      <button onClick={() => onModeChange('login')} data-testid="mode-change-btn">
        Change Mode
      </button>
    </div>
  ),
}))

const mockPush = jest.fn()
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('RegisterPage', () => {
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
  })

  it('should redirect to dashboard if user is already logged in', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com',
    } as any)

    render(<RegisterPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should show register form if user is not logged in', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByTestId('auth-form')).toBeInTheDocument()
      expect(screen.getByTestId('mode')).toHaveTextContent('register')
    })

    expect(screen.getByText('每日食物记录')).toBeInTheDocument()
    expect(screen.getByText('创建新账户开始记录您的饮食')).toBeInTheDocument()
  })

  it('should handle successful registration', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByTestId('success-btn')).toBeInTheDocument()
    })

    // Registration success should not redirect automatically
    screen.getByTestId('success-btn').click()

    // Should not redirect to dashboard after registration
    expect(mockPush).not.toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to login page when mode changes', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<RegisterPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mode-change-btn')).toBeInTheDocument()
    })

    screen.getByTestId('mode-change-btn').click()

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should show loading state initially', () => {
    mockAuthService.getCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<RegisterPage />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})