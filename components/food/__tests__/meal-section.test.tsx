import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MealSection } from '../meal-section'
import { type FoodRecord, type MealType } from '@/types/database'
import { it } from 'node:test'
import { it } from 'node:test'
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
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock FoodRecordCard component
jest.mock('../food-record-card', () => {
  return {
    FoodRecordCard: ({ record, onEdit, onDelete, showDate }: any) => (
      <div data-testid={`food-record-${record.id}`}>
        <span>{record.food_name}</span>
        <span>{record.calories} 卡路里</span>
        {onEdit && (
          <button onClick={() => onEdit(record)}>编辑</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(record)}>删除</button>
        )}
        {showDate && <span>显示日期</span>}
      </div>
    )
  }
})

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('MealSection', () => {
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

  it('renders meal section with correct title and icon', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
      />
    )

    expect(screen.getByText('早餐')).toBeInTheDocument()
    expect(screen.getByText('🌅')).toBeInTheDocument()
  })

  it('displays total calories when records exist', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
      />
    )

    expect(screen.getByText('总计: 250 卡路里')).toBeInTheDocument()
  })

  it('shows record count when records exist', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
      />
    )

    expect(screen.getByText('(2 项)')).toBeInTheDocument()
  })

  it('renders all food records', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
      />
    )

    expect(screen.getByTestId('food-record-1')).toBeInTheDocument()
    expect(screen.getByTestId('food-record-2')).toBeInTheDocument()
    expect(screen.getByText('燕麦粥')).toBeInTheDocument()
    expect(screen.getByText('牛奶')).toBeInTheDocument()
  })

  it('shows empty state when no records', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={[]}
      />
    )

    expect(screen.getByText('🍽️')).toBeInTheDocument()
    expect(screen.getByText('暂无早餐记录')).toBeInTheDocument()
    expect(screen.getByText('点击上方添加按钮开始记录')).toBeInTheDocument()
  })

  it('does not show total calories when no records', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={[]}
      />
    )

    expect(screen.queryByText(/总计.*卡路里/)).not.toBeInTheDocument()
  })

  it('passes onEditRecord to FoodRecordCard', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
        onEditRecord={mockOnEdit}
      />
    )

    const editButton = screen.getAllByText('编辑')[0]
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockRecords[0])
  })

  it('passes onDeleteRecord to FoodRecordCard', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
        onDeleteRecord={mockOnDelete}
      />
    )

    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(mockRecords[0])
  })

  it('passes showDate to FoodRecordCard', () => {
    render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
        showDate={true}
      />
    )

    expect(screen.getAllByText('显示日期')).toHaveLength(2)
  })

  it('applies custom className', () => {
    const { container } = render(
      <MealSection
        mealType="breakfast"
        records={mockRecords}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  describe('meal type configurations', () => {
    const mealConfigs = [
      {
        type: 'breakfast' as MealType,
        label: '早餐',
        icon: '🌅',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800'
      },
      {
        type: 'lunch' as MealType,
        label: '中餐',
        icon: '☀️',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      },
      {
        type: 'dinner' as MealType,
        label: '晚餐',
        icon: '🌙',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      },
      {
        type: 'snack' as MealType,
        label: '加餐',
        icon: '🍎',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800'
      }
    ]

    mealConfigs.forEach(({ type, label, icon }) => {
      it(`renders ${type} with correct configuration`, () => {
        render(
          <MealSection
            mealType={type}
            records={[]}
          />
        )

        expect(screen.getByText(label)).toBeInTheDocument()
        expect(screen.getByText(icon)).toBeInTheDocument()
        expect(screen.getByText(`暂无${label}记录`)).toBeInTheDocument()
        // CSS classes are applied via cn function, just verify the elements exist
      })
    })
  })

  it('calculates total calories correctly', () => {
    const recordsWithDifferentCalories = [
      { ...mockRecords[0], calories: 100 },
      { ...mockRecords[1], calories: 200 },
      { ...mockRecords[0], id: '3', calories: 50 }
    ]

    render(
      <MealSection
        mealType="breakfast"
        records={recordsWithDifferentCalories}
      />
    )

    expect(screen.getByText('总计: 350 卡路里')).toBeInTheDocument()
  })

  it('handles zero calories correctly', () => {
    const recordsWithZeroCalories = [
      { ...mockRecords[0], calories: 0 }
    ]

    render(
      <MealSection
        mealType="breakfast"
        records={recordsWithZeroCalories}
      />
    )

    expect(screen.getByText('总计: 0 卡路里')).toBeInTheDocument()
  })
})