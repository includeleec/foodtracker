import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import TodayPage from '../page'
import { getCurrentDate } from '@/lib/date-utils'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user1', email: 'test@example.com' },
    signOut: jest.fn()
  })),
}))

jest.mock('@/lib/date-utils', () => ({
  getCurrentDate: jest.fn(),
  formatRelativeDate: jest.fn(),
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

const mockFoodRecord = {
  id: 'record-123',
  user_id: 'user-123',
  meal_type: 'breakfast' as const,
  food_name: '燕麦粥',
  weight: 200,
  calories: 150,
  image_url: null,
  image_id: null,
  record_date: '2024-01-15',
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-01-15T08:00:00Z',
}

describe('TodayPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getCurrentDate as jest.Mock).mockReturnValue('2024-01-15')
    ;(require('@/lib/date-utils').formatRelativeDate as jest.Mock).mockReturnValue('今天')
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Authentication', () => {
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
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
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
    })
  })

  describe('Data Loading', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })
    })

    it('should fetch today records on mount', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockFoodRecord],
        }),
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/food-records?date=2024-01-15', {
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        })
      })
    })

    it('should display loading state while fetching data', () => {
      ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<TodayPage />)

      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should display error message when fetch fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: '获取记录失败',
        }),
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('获取记录失败')).toBeInTheDocument()
      })

      expect(screen.getByText('重试')).toBeInTheDocument()
    })

    it('should retry fetching data when retry button is clicked', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: '获取记录失败',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('获取记录失败')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('重试'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Total Calories Display', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })
    })

    it('should display zero calories when no records', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('总卡路里')).toBeInTheDocument()
      })
    })

    it('should calculate and display total calories correctly', async () => {
      const records = [
        { ...mockFoodRecord, calories: 150 },
        { ...mockFoodRecord, id: 'record-456', calories: 200 },
        { ...mockFoodRecord, id: 'record-789', calories: 100 },
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: records,
        }),
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('450')).toBeInTheDocument()
        expect(screen.getByText('总卡路里')).toBeInTheDocument()
      })
    })

    it('should update total calories when records change', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ ...mockFoodRecord, calories: 150 }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockFoodRecord, id: 'new-record', calories: 200 },
          }),
        })

      render(<TodayPage />)

      // Initial total
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })

      // Show form and submit new record
      fireEvent.click(screen.getByText('➕ 添加食物记录'))

      // Fill form (simplified - actual form interaction would be more complex)
      const formData = {
        meal_type: 'lunch',
        food_name: '米饭',
        weight: 150,
        calories: 200,
        record_date: '2024-01-15',
      }

      // Mock form submission
      fireEvent.click(screen.getByText('添加记录'))

      await waitFor(() => {
        expect(screen.getByText('350')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Form Interactions', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      })
    })

    it('should show add form when add button is clicked', async () => {
      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('➕ 添加食物记录')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('➕ 添加食物记录'))

      expect(screen.getByText('添加食物记录')).toBeInTheDocument()
      expect(screen.getByText('餐次类型')).toBeInTheDocument()
    })

    it('should hide add button when form is shown', async () => {
      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('➕ 添加食物记录')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('➕ 添加食物记录'))

      expect(screen.queryByText('➕ 添加食物记录')).not.toBeInTheDocument()
    })

    it('should show edit form when edit button is clicked', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [mockFoodRecord],
        }),
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('燕麦粥')).toBeInTheDocument()
      })

      // Find and click edit button (assuming it exists in the record display)
      const editButtons = screen.getAllByText('编辑')
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0])
        expect(screen.getByText('编辑食物记录')).toBeInTheDocument()
      }
    })
  })

  describe('Record Management', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })
    })

    it('should create new record successfully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockFoodRecord,
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('➕ 添加食物记录')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('➕ 添加食物记录'))

      // Simulate form submission
      fireEvent.click(screen.getByText('添加记录'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/food-records', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      }, { timeout: 2000 })
    })

    it('should update existing record successfully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockFoodRecord],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockFoodRecord, food_name: '更新的燕麦粥' },
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('燕麦粥')).toBeInTheDocument()
      })

      // Simulate edit action
      const editButtons = screen.getAllByText('编辑')
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0])
        fireEvent.click(screen.getByText('更新记录'))

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(`/api/food-records/${mockFoodRecord.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            },
            body: expect.any(String),
          })
        }, { timeout: 2000 })
      }
    })

    it('should delete record successfully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockFoodRecord],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('燕麦粥')).toBeInTheDocument()
      })

      // Simulate delete action (this would typically involve a confirmation dialog)
      const deleteButtons = screen.getAllByText('删除')
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0])

        // Confirm deletion if confirmation dialog appears
        const confirmButtons = screen.getAllByText('删除')
        if (confirmButtons.length > 1) {
          fireEvent.click(confirmButtons[1])
        }

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(`/api/food-records/${mockFoodRecord.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            },
          })
        }, { timeout: 2000 })
      }
    })
  })

  describe('Real-time Updates', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })
    })

    it('should update records list after creating new record', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockFoodRecord,
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('今天暂无记录')).toBeInTheDocument()
      })

      // Add new record
      fireEvent.click(screen.getByText('➕ 添加食物记录'))
      fireEvent.click(screen.getByText('添加记录'))

      await waitFor(() => {
        expect(screen.getByText('燕麦粥')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should update records list after deleting record', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockFoodRecord],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('燕麦粥')).toBeInTheDocument()
      })

      // Delete record - look for delete button by title attribute
      const deleteButton = screen.getByTitle('删除记录')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText('燕麦粥')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })
    })

    it('should handle create record error', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            success: false,
            error: '创建记录失败',
          }),
        })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('➕ 添加食物记录')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('➕ 添加食物记录'))
      
      // Fill form with valid data to avoid validation errors
      fireEvent.click(screen.getByText('早餐'))
      fireEvent.change(screen.getByLabelText(/食物名称/), { target: { value: '测试食物' } })
      fireEvent.change(screen.getByLabelText(/重量/), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/卡路里/), { target: { value: '200' } })
      
      fireEvent.click(screen.getByText('添加记录'))

      await waitFor(() => {
        expect(screen.getByText('创建记录失败')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should handle network errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      })

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      })
    })

    it('should render properly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<TodayPage />)

      await waitFor(() => {
        expect(screen.getByText('今天的记录')).toBeInTheDocument()
      })

      // Check that responsive classes are applied
      const addButton = screen.getByText('➕ 添加食物记录')
      expect(addButton).toHaveClass('w-full', 'sm:w-auto')
    })
  })
})