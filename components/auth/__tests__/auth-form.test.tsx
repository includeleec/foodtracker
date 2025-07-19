import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthForm } from '../auth-form'
import { AuthService } from '@/lib/auth'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock AuthService
jest.mock('@/lib/auth', () => ({
  AuthService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
  },
}))

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Mode', () => {
    it('renders login form correctly', () => {
      render(<AuthForm mode="login" />)
      
      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
      expect(screen.getByLabelText('密码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByText('没有账号？点击注册')).toBeInTheDocument()
    })

    it('does not show confirm password field in login mode', () => {
      render(<AuthForm mode="login" />)
      
      expect(screen.queryByLabelText('确认密码')).not.toBeInTheDocument()
    })

    it('calls signIn when form is submitted', async () => {
      const mockOnSuccess = jest.fn()
      mockAuthService.signIn.mockResolvedValue({ success: true })

      render(<AuthForm mode="login" onSuccess={mockOnSuccess} />)
      
      fireEvent.change(screen.getByLabelText('邮箱'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('shows error message when login fails', async () => {
      mockAuthService.signIn.mockResolvedValue({
        success: false,
        error: { message: '邮箱或密码错误' }
      })

      render(<AuthForm mode="login" />)
      
      fireEvent.change(screen.getByLabelText('邮箱'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: 'wrongpassword' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument()
      })
    })
  })

  describe('Register Mode', () => {
    it('renders register form correctly', () => {
      render(<AuthForm mode="register" />)
      
      expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument()
      expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
      expect(screen.getByLabelText('密码')).toBeInTheDocument()
      expect(screen.getByLabelText('确认密码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument()
      expect(screen.getByText('已有账号？点击登录')).toBeInTheDocument()
    })

    it('shows error when passwords do not match', async () => {
      render(<AuthForm mode="register" />)
      
      fireEvent.change(screen.getByLabelText('邮箱'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByLabelText('确认密码'), {
        target: { value: 'differentpassword' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: '注册' }))

      await waitFor(() => {
        expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
      })
    })

    it('calls signUp when form is submitted with matching passwords', async () => {
      mockAuthService.signUp.mockResolvedValue({ success: true })

      render(<AuthForm mode="register" />)
      
      fireEvent.change(screen.getByLabelText('邮箱'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByLabelText('确认密码'), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: '注册' }))

      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      render(<AuthForm mode="login" />)
      
      // Only fill password, leave email empty
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: 'password123' }
      })
      
      // Submit the form
      const form = screen.getByRole('button', { name: '登录' }).closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('请填写所有必填字段')).toBeInTheDocument()
      })
    })

    it('shows error when password is too short', async () => {
      render(<AuthForm mode="login" />)
      
      fireEvent.change(screen.getByLabelText('邮箱'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText('密码'), {
        target: { value: '123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: '登录' }))

      await waitFor(() => {
        expect(screen.getByText('密码至少需要6个字符')).toBeInTheDocument()
      })
    })
  })

  describe('Mode Switching', () => {
    it('calls onModeChange when mode switch button is clicked', () => {
      const mockOnModeChange = jest.fn()
      
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)
      
      fireEvent.click(screen.getByText('没有账号？点击注册'))
      
      expect(mockOnModeChange).toHaveBeenCalledWith('register')
    })
  })
})