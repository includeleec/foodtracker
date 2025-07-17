import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'
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
      <button onClick={() => onModeChange('register')} data-testid="mode-change-btn">
        Change Mode
      </button>
    </div>
  ),
}))

const mockPush = jest.fn()
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('LoginPage', () => {
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

    render(<LoginPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should show login form if user is not logged in', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<LoginPage />)

    await waitFor(() => {
      expect(screen.getByTestId('auth-form')).toBeInTheDocument()
      expect(screen.getByTestId('mode')).toHaveTextContent('login')
    })

    expect(screen.getByText('每日食物记录')).toBeInTheDocument()
    expect(screen.getByText('登录您的账户开始记录饮食')).toBeInTheDocument()
  })

  it('should redirect to dashboard on successful login', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<LoginPage />)

    await waitFor(() => {
      expect(screen.getByTestId('success-btn')).toBeInTheDocument()
    })

    screen.getByTestId('success-btn').click()

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to register page when mode changes', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null)

    render(<LoginPage />)

    await waitFor(() => {
      expect(screen.getByTestId('mode-change-btn')).toBeInTheDocument()
    })

    screen.getByTestId('mode-change-btn').click()

    expect(mockPush).toHaveBeenCalledWith('/auth/register')
  })

  it('should show loading state initially', () => {
    mockAuthService.getCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<LoginPage />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})