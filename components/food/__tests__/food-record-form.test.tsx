import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FoodRecordForm } from '../food-record-form'
import { useAuth } from '@/lib/auth-context'
import type { FoodRecordFormData, FoodRecord } from '@/types/database'

// Mock dependencies
jest.mock('@/lib/auth-context')
jest.mock('@/lib/image-utils', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  validateImageFile: jest.fn(),
  createImagePreview: jest.fn(() => 'blob:preview-url'),
  revokeImagePreview: jest.fn(),
  ImageUploadError: class extends Error {}
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('FoodRecordForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()
  const user = userEvent.setup()

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    access_token: 'mock-token'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    })
  })

  describe('渲染测试', () => {
    it('应该渲染所有必需的表单字段', () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('餐次类型')).toBeInTheDocument()
      expect(screen.getByLabelText(/食物名称/)).toBeInTheDocument()
      expect(screen.getByLabelText(/重量/)).toBeInTheDocument()
      expect(screen.getByLabelText(/卡路里/)).toBeInTheDocument()
      expect(screen.getByLabelText(/记录日期/)).toBeInTheDocument()
      expect(screen.getByText('食物图片')).toBeInTheDocument()
    })

    it('应该渲染所有餐次类型选项', () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('早餐')).toBeInTheDocument()
      expect(screen.getByText('中餐')).toBeInTheDocument()
      expect(screen.getByText('晚餐')).toBeInTheDocument()
      expect(screen.getByText('加餐')).toBeInTheDocument()
    })

    it('应该显示默认的今日日期', () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)
      
      const dateInput = screen.getByLabelText(/记录日期/) as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput.value).toBe(today)
    })

    it('应该渲染提交和重置按钮', () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: '添加记录' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument()
    })
  })

  describe('初始数据测试', () => {
    const initialData: Partial<FoodRecord> = {
      id: 'record-1',
      meal_type: 'breakfast',
      food_name: '燕麦粥',
      weight: 200,
      calories: 150,
      record_date: '2024-01-15',
      image_url: 'https://example.com/image.jpg',
      image_id: 'image-1'
    }

    it('应该使用初始数据填充表单', () => {
      render(
        <FoodRecordForm 
          onSubmit={mockOnSubmit} 
          initialData={initialData}
          isEditing={true}
        />
      )

      expect(screen.getByDisplayValue('燕麦粥')).toBeInTheDocument()
      expect(screen.getByDisplayValue('200')).toBeInTheDocument()
      expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
      
      // 检查早餐按钮是否被选中
      const breakfastButton = screen.getByText('早餐')
      expect(breakfastButton).toHaveClass('bg-blue-600')
    })

    it('编辑模式下应该显示更新按钮', () => {
      render(
        <FoodRecordForm 
          onSubmit={mockOnSubmit} 
          initialData={initialData}
          isEditing={true}
        />
      )

      expect(screen.getByRole('button', { name: '更新记录' })).toBeInTheDocument()
    })
  })

  describe('表单交互测试', () => {
    it('应该能够选择餐次类型', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      const lunchButton = screen.getByText('中餐')
      await user.click(lunchButton)

      expect(lunchButton).toHaveClass('bg-blue-600')
    })

    it('应该能够输入食物名称', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      const foodNameInput = screen.getByLabelText(/食物名称/)
      await user.type(foodNameInput, '苹果')

      expect(foodNameInput).toHaveValue('苹果')
    })

    it('应该能够输入重量和卡路里', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      const weightInput = screen.getByLabelText(/重量/)
      const caloriesInput = screen.getByLabelText(/卡路里/)

      await user.type(weightInput, '150')
      await user.type(caloriesInput, '80')

      expect(weightInput).toHaveValue(150)
      expect(caloriesInput).toHaveValue(80)
    })

    it('应该能够更改记录日期', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      const dateInput = screen.getByLabelText(/记录日期/)
      await user.clear(dateInput)
      await user.type(dateInput, '2024-01-15')

      expect(dateInput).toHaveValue('2024-01-15')
    })
  })

  describe('表单验证测试', () => {
    it('应该显示必填字段验证错误', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请选择餐次类型')).toBeInTheDocument()
        expect(screen.getByText('请输入食物名称')).toBeInTheDocument()
        expect(screen.getByText('请输入食物重量')).toBeInTheDocument()
        expect(screen.getByText('请输入卡路里')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('应该验证数值范围', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 选择餐次类型
      await user.click(screen.getByText('早餐'))
      
      // 输入食物名称
      await user.type(screen.getByLabelText(/食物名称/), '测试食物')
      
      // 输入无效的重量和卡路里 - 使用更明显的无效值
      const weightInput = screen.getByLabelText(/重量/)
      const caloriesInput = screen.getByLabelText(/卡路里/)
      
      await user.clear(weightInput)
      await user.type(weightInput, '0.05') // 小于最小值 0.1
      
      await user.clear(caloriesInput)
      await user.type(caloriesInput, '0') // 小于最小值 1

      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      // 验证表单没有提交（等待一段时间确保没有调用）
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('输入有效数据时应该清除验证错误', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 先触发验证错误
      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请选择餐次类型')).toBeInTheDocument()
      })

      // 然后输入有效数据
      await user.click(screen.getByText('早餐'))

      await waitFor(() => {
        expect(screen.queryByText('请选择餐次类型')).not.toBeInTheDocument()
      })
    })
  })

  describe('表单提交测试', () => {
    const validFormData = {
      meal_type: 'breakfast' as const,
      food_name: '燕麦粥',
      weight: 200,
      calories: 150,
      record_date: '2024-01-15'
    }

    it('应该提交有效的表单数据', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 填写表单
      await user.click(screen.getByText('早餐'))
      await user.type(screen.getByLabelText(/食物名称/), validFormData.food_name)
      await user.type(screen.getByLabelText(/重量/), validFormData.weight.toString())
      await user.type(screen.getByLabelText(/卡路里/), validFormData.calories.toString())
      
      const dateInput = screen.getByLabelText(/记录日期/)
      await user.clear(dateInput)
      await user.type(dateInput, validFormData.record_date)

      // 提交表单
      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          meal_type: validFormData.meal_type,
          food_name: validFormData.food_name,
          weight: validFormData.weight,
          calories: validFormData.calories,
          record_date: validFormData.record_date,
          image_url: undefined,
          image_id: undefined
        })
      })
    })

    it('提交成功后应该显示成功消息', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 填写并提交表单
      await user.click(screen.getByText('早餐'))
      await user.type(screen.getByLabelText(/食物名称/), validFormData.food_name)
      await user.type(screen.getByLabelText(/重量/), validFormData.weight.toString())
      await user.type(screen.getByLabelText(/卡路里/), validFormData.calories.toString())

      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('添加成功！')).toBeInTheDocument()
      })
    })

    it('提交失败后应该显示错误消息', async () => {
      const errorMessage = '网络错误'
      mockOnSubmit.mockRejectedValue(new Error(errorMessage))
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 填写并提交表单
      await user.click(screen.getByText('早餐'))
      await user.type(screen.getByLabelText(/食物名称/), validFormData.food_name)
      await user.type(screen.getByLabelText(/重量/), validFormData.weight.toString())
      await user.type(screen.getByLabelText(/卡路里/), validFormData.calories.toString())

      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('提交过程中应该禁用表单', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 填写表单
      await user.click(screen.getByText('早餐'))
      await user.type(screen.getByLabelText(/食物名称/), validFormData.food_name)
      await user.type(screen.getByLabelText(/重量/), validFormData.weight.toString())
      await user.type(screen.getByLabelText(/卡路里/), validFormData.calories.toString())

      // 提交表单
      const submitButton = screen.getByRole('button', { name: '添加记录' })
      await user.click(submitButton)

      // 检查按钮状态
      await waitFor(() => {
        expect(screen.getByText('添加中...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // 完成提交
      resolveSubmit!()
      await waitFor(() => {
        expect(screen.getByText('添加记录')).toBeInTheDocument()
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('取消和重置测试', () => {
    it('应该调用 onCancel 回调', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: '取消' })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('没有 onCancel 时应该重置表单', async () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} />)

      // 填写表单
      await user.click(screen.getByText('早餐'))
      await user.type(screen.getByLabelText(/食物名称/), '测试食物')

      // 点击重置
      const resetButton = screen.getByRole('button', { name: '重置' })
      await user.click(resetButton)

      // 检查表单是否被重置
      expect(screen.getByLabelText(/食物名称/)).toHaveValue('')
      expect(screen.getByText('早餐')).not.toHaveClass('bg-blue-600')
    })
  })

  describe('禁用状态测试', () => {
    it('禁用时应该禁用所有表单控件', () => {
      render(<FoodRecordForm onSubmit={mockOnSubmit} disabled={true} />)

      expect(screen.getByLabelText(/食物名称/)).toBeDisabled()
      expect(screen.getByLabelText(/重量/)).toBeDisabled()
      expect(screen.getByLabelText(/卡路里/)).toBeDisabled()
      expect(screen.getByLabelText(/记录日期/)).toBeDisabled()
      expect(screen.getByRole('button', { name: '添加记录' })).toBeDisabled()
      expect(screen.getByRole('button', { name: '重置' })).toBeDisabled()
    })
  })
})