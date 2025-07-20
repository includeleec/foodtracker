import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodRecordForm } from '../food-record-form'
import { AuthProvider } from '@/lib/auth-context'

// Mock dependencies
jest.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com' },
    signOut: jest.fn()
  })
}))

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} data-testid="food-image" />
  }
})

// Mock food record service
const mockCreateRecord = jest.fn()
const mockUpdateRecord = jest.fn()

jest.mock('@/lib/database', () => ({
  FoodRecordService: jest.fn().mockImplementation(() => ({
    createRecord: mockCreateRecord,
    updateRecord: mockUpdateRecord
  }))
}))

describe('FoodRecordForm Integration', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should submit new record successfully', async () => {
    mockCreateRecord.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        meal_type: 'breakfast',
        food_name: '测试食物',
        weight: 200,
        calories: 150
      }
    })

    render(
      <FoodRecordForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/餐次类型/), { target: { value: 'breakfast' } })
    fireEvent.change(screen.getByLabelText(/食物名称/), { target: { value: '测试食物' } })
    fireEvent.change(screen.getByLabelText(/重量/), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText(/卡路里/), { target: { value: '150' } })

    // Submit form
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalledWith('user1', {
        meal_type: 'breakfast',
        food_name: '测试食物',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15',
        image_url: null,
        image_id: null
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should handle form validation errors', async () => {
    render(
      <FoodRecordForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    // Submit empty form
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(screen.getByText(/食物名称不能为空/)).toBeInTheDocument()
    })

    expect(mockCreateRecord).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    mockCreateRecord.mockResolvedValue({
      success: false,
      error: '创建记录失败'
    })

    render(
      <FoodRecordForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/餐次类型/), { target: { value: 'breakfast' } })
    fireEvent.change(screen.getByLabelText(/食物名称/), { target: { value: '测试食物' } })
    fireEvent.change(screen.getByLabelText(/重量/), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText(/卡路里/), { target: { value: '150' } })

    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(screen.getByText(/创建记录失败/)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should update existing record', async () => {
    const existingRecord = {
      id: '1',
      user_id: 'user1',
      meal_type: 'breakfast' as const,
      food_name: '原始食物',
      weight: 100,
      calories: 100,
      record_date: '2024-01-15',
      image_url: null,
      image_id: null,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z'
    }

    mockUpdateRecord.mockResolvedValue({
      success: true,
      data: { ...existingRecord, food_name: '更新的食物' }
    })

    render(
      <FoodRecordForm
        record={existingRecord}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    // Update food name
    fireEvent.change(screen.getByDisplayValue('原始食物'), { target: { value: '更新的食物' } })

    // Submit form
    fireEvent.click(screen.getByText('更新'))

    await waitFor(() => {
      expect(mockUpdateRecord).toHaveBeenCalledWith('user1', '1', {
        meal_type: 'breakfast',
        food_name: '更新的食物',
        weight: 100,
        calories: 100,
        record_date: '2024-01-15',
        image_url: null,
        image_id: null
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should cancel form correctly', () => {
    render(
      <FoodRecordForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    fireEvent.click(screen.getByText('取消'))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockCreateRecord.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
    )

    render(
      <FoodRecordForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        defaultDate="2024-01-15"
      />
    )

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/食物名称/), { target: { value: '测试食物' } })
    fireEvent.click(screen.getByText('保存'))

    // Check loading state
    expect(screen.getByText('保存中...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
})