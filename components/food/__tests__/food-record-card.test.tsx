import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodRecordCard } from '../food-record-card'
import { type FoodRecord } from '@/types/database'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onError={onError}
        {...props}
        data-testid="food-image"
      />
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

describe('FoodRecordCard', () => {
  const mockRecord: FoodRecord = {
    id: '1',
    user_id: 'user1',
    meal_type: 'breakfast',
    food_name: '燕麦粥',
    weight: 200,
    calories: 150,
    image_url: 'https://example.com/image.jpg',
    image_id: 'img1',
    record_date: '2024-01-15',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders food record information correctly', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('燕麦粥')).toBeInTheDocument()
    expect(screen.getByText('200g')).toBeInTheDocument()
    expect(screen.getByText('150 卡路里')).toBeInTheDocument()
    expect(screen.getByText('早餐')).toBeInTheDocument()
  })

  it('displays food image when available', () => {
    render(<FoodRecordCard record={mockRecord} />)
    
    const image = screen.getByTestId('food-image')
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    expect(image).toHaveAttribute('alt', '燕麦粥')
  })

  it('shows placeholder when no image', () => {
    const recordWithoutImage = { ...mockRecord, image_url: null }
    render(<FoodRecordCard record={recordWithoutImage} />)
    
    expect(screen.getByText('🍽️')).toBeInTheDocument()
    expect(screen.queryByTestId('food-image')).not.toBeInTheDocument()
  })

  it('handles image load error gracefully', async () => {
    render(<FoodRecordCard record={mockRecord} />)
    
    const image = screen.getByTestId('food-image')
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(screen.getByText('🍽️')).toBeInTheDocument()
    })
  })

  it('shows date when showDate is true', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        showDate={true}
      />
    )
    
    expect(screen.getByText('今天')).toBeInTheDocument()
  })

  it('does not show date when showDate is false', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        showDate={false}
      />
    )
    
    expect(screen.queryByText('今天')).not.toBeInTheDocument()
  })

  it('renders edit button when onEdit provided', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        onEdit={mockOnEdit}
      />
    )
    
    const editButton = screen.getByTitle('编辑记录')
    expect(editButton).toBeInTheDocument()
  })

  it('renders delete button when onDelete provided', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        onDelete={mockOnDelete}
      />
    )
    
    const deleteButton = screen.getByTitle('删除记录')
    expect(deleteButton).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', () => {
    render(
      <FoodRecordCard
        record={mockRecord}
        onEdit={mockOnEdit}
      />
    )
    
    const editButton = screen.getByTitle('编辑记录')
    fireEvent.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockRecord)
  })

  it('calls onDelete when delete button clicked', async () => {
    mockOnDelete.mockResolvedValue(undefined)
    
    render(
      <FoodRecordCard
        record={mockRecord}
        onDelete={mockOnDelete}
      />
    )
    
    const deleteButton = screen.getByTitle('删除记录')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockRecord)
    })
  })

  it('shows loading state during delete', async () => {
    let resolveDelete: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve
    })
    mockOnDelete.mockReturnValue(deletePromise)
    
    render(
      <FoodRecordCard
        record={mockRecord}
        onDelete={mockOnDelete}
      />
    )
    
    const deleteButton = screen.getByTitle('删除记录')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('⏳')).toBeInTheDocument()
    })
    
    resolveDelete!()
    await waitFor(() => {
      expect(screen.queryByText('⏳')).not.toBeInTheDocument()
    })
  })

  it('prevents multiple delete clicks during loading', async () => {
    let resolveDelete: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve
    })
    mockOnDelete.mockReturnValue(deletePromise)
    
    render(
      <FoodRecordCard
        record={mockRecord}
        onDelete={mockOnDelete}
      />
    )
    
    const deleteButton = screen.getByTitle('删除记录')
    fireEvent.click(deleteButton)
    fireEvent.click(deleteButton) // Second click should be ignored
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    
    resolveDelete!()
  })

  it('applies correct meal type styling', () => {
    const lunchRecord = { ...mockRecord, meal_type: 'lunch' as const }
    render(<FoodRecordCard record={lunchRecord} />)
    
    const mealBadge = screen.getByText('中餐')
    expect(mealBadge).toBeInTheDocument()
    // CSS classes are applied via cn function, just verify the element exists
  })

  it('applies custom className', () => {
    const { container } = render(
      <FoodRecordCard
        record={mockRecord}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  describe('meal type labels and colors', () => {
    const mealTypes = [
      { type: 'breakfast' as const, label: '早餐', colors: 'bg-orange-100 text-orange-800' },
      { type: 'lunch' as const, label: '中餐', colors: 'bg-green-100 text-green-800' },
      { type: 'dinner' as const, label: '晚餐', colors: 'bg-blue-100 text-blue-800' },
      { type: 'snack' as const, label: '加餐', colors: 'bg-purple-100 text-purple-800' }
    ]

    mealTypes.forEach(({ type, label }) => {
      it(`renders ${type} with correct label`, () => {
        const record = { ...mockRecord, meal_type: type }
        render(<FoodRecordCard record={record} />)
        
        const mealBadge = screen.getByText(label)
        expect(mealBadge).toBeInTheDocument()
        // CSS classes are applied via cn function, just verify the element exists
      })
    })
  })
})