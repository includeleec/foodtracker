import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodRecordsDisplay } from '../food-records-display'
import { type FoodRecord } from '@/types/database'

// Mock MealSection component
jest.mock('../meal-section', () => {
  return {
    MealSection: ({ mealType, records, onEditRecord, onDeleteRecord, showDate }: any) => (
      <div data-testid={`meal-section-${mealType}`}>
        <h3>{mealType}</h3>
        <div>Records: {records.length}</div>
        {records.map((record: any) => (
          <div key={record.id} data-testid={`record-${record.id}`}>
            <span>{record.food_name}</span>
            {onEditRecord && (
              <button onClick={() => onEditRecord(record)}>编辑</button>
            )}
            {onDeleteRecord && (
              <button onClick={() => onDeleteRecord(record)}>删除</button>
            )}
            {showDate && <span>显示日期</span>}
          </div>
        ))}
      </div>
    )
  }
})

// Mock ConfirmDialog component
jest.mock('@/components/ui/confirm-dialog', () => {
  return {
    ConfirmDialog: ({ isOpen, onClose, onConfirm, title, message, isLoading }: any) => (
      isOpen ? (
        <div data-testid="confirm-dialog">
          <h3>{title}</h3>
          <p>{message}</p>
          <button onClick={onClose} disabled={isLoading}>取消</button>
          <button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? '处理中...' : '确认'}
          </button>
        </div>
      ) : null
    )
  }
})

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  formatRelativeDate: jest.fn((date: string) => {
    if (date === '2024-01-15') return '今天'
    if (date === '2024-01-14') return '昨天'
    return '2024年1月13日'
  })
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('FoodRecordsDisplay', () => {
  const mockRecords: FoodRecord[] = [
    {
      id: '1',
      user_id: 'user1',
      meal_type: 'breakfast',
      food_name: '燕麦粥',
      weight: 200,
      calories: 150,
      image_url: null,
      image_id: null,
      record_date: '2024-01-15',
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      user_id: 'user1',
      meal_type: 'lunch',
      food_name: '米饭',
      weight: 150,
      calories: 200,
      image_url: null,
      image_id: null,
      record_date: '2024-01-15',
      created_at: '2024-01-15T12:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    },
    {
      id: '3',
      user_id: 'user1',
      meal_type: 'breakfast',
      food_name: '牛奶',
      weight: 250,
      calories: 100,
      image_url: null,
      image_id: null,
      record_date: '2024-01-15',
      created_at: '2024-01-15T08:30:00Z',
      updated_at: '2024-01-15T08:30:00Z'
    }
  ]

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state when no records', () => {
    render(<FoodRecordsDisplay records={[]} />)

    expect(screen.getByText('🍽️')).toBeInTheDocument()
    expect(screen.getByText('暂无食物记录')).toBeInTheDocument()
    expect(screen.getByText('开始记录您的饮食，追踪健康生活')).toBeInTheDocument()
  })

  it('renders empty state with date when no records', () => {
    render(<FoodRecordsDisplay records={[]} date="2024-01-15" />)

    expect(screen.getByText('今天暂无记录')).toBeInTheDocument()
  })

  it('displays total calories when records exist', () => {
    render(<FoodRecordsDisplay records={mockRecords} />)

    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('总卡路里')).toBeInTheDocument()
  })

  it('displays record count when records exist', () => {
    render(<FoodRecordsDisplay records={mockRecords} />)

    expect(screen.getByText('共 3 项记录')).toBeInTheDocument()
  })

  it('displays date when provided', () => {
    render(<FoodRecordsDisplay records={mockRecords} date="2024-01-15" />)

    expect(screen.getByText('今天')).toBeInTheDocument()
  })

  it('renders meal sections in correct order', () => {
    render(<FoodRecordsDisplay records={mockRecords} />)

    const mealSections = screen.getAllByTestId(/meal-section-/)
    const mealTypes = mealSections.map(section => 
      section.getAttribute('data-testid')?.replace('meal-section-', '')
    )

    expect(mealTypes).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  })

  it('groups records by meal type correctly', () => {
    render(<FoodRecordsDisplay records={mockRecords} />)

    // Breakfast should have 2 records
    const breakfastSection = screen.getByTestId('meal-section-breakfast')
    expect(breakfastSection).toHaveTextContent('Records: 2')

    // Lunch should have 1 record
    const lunchSection = screen.getByTestId('meal-section-lunch')
    expect(lunchSection).toHaveTextContent('Records: 1')

    // Dinner and snack should have 0 records
    const dinnerSection = screen.getByTestId('meal-section-dinner')
    expect(dinnerSection).toHaveTextContent('Records: 0')

    const snackSection = screen.getByTestId('meal-section-snack')
    expect(snackSection).toHaveTextContent('Records: 0')
  })

  it('passes onEditRecord to meal sections', () => {
    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onEditRecord={mockOnEdit}
      />
    )

    const editButton = screen.getAllByText('编辑')[0]
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecords[0])
  })

  it('handles delete record flow', async () => {
    mockOnDelete.mockResolvedValue(undefined)

    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    // Click delete button
    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    })

    expect(screen.getByText('删除食物记录')).toBeInTheDocument()
    expect(screen.getByText('确定要删除"燕麦粥"的记录吗？此操作无法撤销。')).toBeInTheDocument()

    // Confirm deletion
    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockRecords[0])
    })
  })

  it('cancels delete operation', async () => {
    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    // Click delete button
    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    })

    // Cancel deletion
    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
    })

    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('shows loading state during delete', async () => {
    let resolveDelete: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve
    })
    mockOnDelete.mockReturnValue(deletePromise)

    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    // Click delete and confirm
    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('处理中...')).toBeInTheDocument()
    })

    // Resolve the promise
    resolveDelete!()

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
    })
  })

  it('handles delete error gracefully', async () => {
    mockOnDelete.mockRejectedValue(new Error('Delete failed'))

    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    // Click delete and confirm
    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    // Dialog should remain open after error
    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('passes showDate to meal sections', () => {
    render(
      <FoodRecordsDisplay
        records={mockRecords}
        showDate={true}
      />
    )

    expect(screen.getAllByText('显示日期')).toHaveLength(3) // One for each record
  })

  it('applies custom className', () => {
    const { container } = render(
      <FoodRecordsDisplay
        records={mockRecords}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('calculates total calories correctly', () => {
    const recordsWithDifferentCalories = [
      { ...mockRecords[0], calories: 100 },
      { ...mockRecords[1], calories: 200 },
      { ...mockRecords[2], calories: 50 }
    ]

    render(<FoodRecordsDisplay records={recordsWithDifferentCalories} />)

    expect(screen.getByText('350')).toBeInTheDocument()
  })

  it('handles zero calories correctly', () => {
    const recordsWithZeroCalories = [
      { ...mockRecords[0], calories: 0 }
    ]

    render(<FoodRecordsDisplay records={recordsWithZeroCalories} />)

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('总卡路里')).toBeInTheDocument()
  })

  it('prevents dialog close during loading', async () => {
    let resolveDelete: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve
    })
    mockOnDelete.mockReturnValue(deletePromise)

    render(
      <FoodRecordsDisplay
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    // Start delete process
    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    // Try to cancel during loading - should be disabled
    await waitFor(() => {
      const cancelButton = screen.getByText('取消')
      expect(cancelButton).toBeDisabled()
    })

    resolveDelete!()
  })
})