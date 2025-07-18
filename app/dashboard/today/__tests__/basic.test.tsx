import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import TodayPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/date-utils', () => ({
  getCurrentDate: jest.fn(() => '2024-01-15'),
  formatRelativeDate: jest.fn(() => '今天'),
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  access_token: 'mock-token',
}

describe('TodayPage Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(fetch as jest.Mock).mockClear()
  })

  it('should redirect to login when user is not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(<TodayPage />)

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('should show loading state when auth is loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    })

    render(<TodayPage />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render page when user is authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    })

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    })

    render(<TodayPage />)

    await waitFor(() => {
      expect(screen.getByText('今天的记录')).toBeInTheDocument()
    })

    expect(screen.getByText('➕ 添加食物记录')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // Total calories
    expect(screen.getByText('总卡路里')).toBeInTheDocument()
  })

  it('should display total calories correctly', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    })

    const mockRecords = [
      {
        id: 'record-1',
        user_id: 'user-123',
        meal_type: 'breakfast',
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15',
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
      },
      {
        id: 'record-2',
        user_id: 'user-123',
        meal_type: 'lunch',
        food_name: '米饭',
        weight: 150,
        calories: 200,
        record_date: '2024-01-15',
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      },
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRecords,
      }),
    })

    render(<TodayPage />)

    await waitFor(() => {
      expect(screen.getAllByText('350')).toHaveLength(2) // Total calories appears in header and summary
    })

    expect(screen.getByText('燕麦粥')).toBeInTheDocument()
    expect(screen.getByText('米饭')).toBeInTheDocument()
  })
})