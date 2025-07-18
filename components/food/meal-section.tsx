'use client'

import React from 'react'
import { FoodRecordCard } from './food-record-card'
import { type FoodRecord, type MealType } from '@/types/database'
import { cn } from '@/lib/utils'

interface MealSectionProps {
  mealType: MealType
  records: FoodRecord[]
  onEditRecord?: (record: FoodRecord) => void
  onDeleteRecord?: (record: FoodRecord) => void
  showDate?: boolean
  className?: string
}

const MEAL_TYPE_CONFIG = {
  breakfast: {
    label: '早餐',
    icon: '🌅',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800'
  },
  lunch: {
    label: '中餐', 
    icon: '☀️',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800'
  },
  dinner: {
    label: '晚餐',
    icon: '🌙',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800'
  },
  snack: {
    label: '加餐',
    icon: '🍎',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800'
  }
} as const

export function MealSection({
  mealType,
  records,
  onEditRecord,
  onDeleteRecord,
  showDate = false,
  className
}: MealSectionProps) {
  const config = MEAL_TYPE_CONFIG[mealType]
  const totalCalories = records.reduce((sum, record) => sum + record.calories, 0)
  const hasRecords = records.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* 餐次标题 */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <h3 className={cn('font-medium text-lg', config.textColor)}>
            {config.label}
          </h3>
          {hasRecords && (
            <span className="text-sm text-gray-500">
              ({records.length} 项)
            </span>
          )}
        </div>
        
        {hasRecords && (
          <div className={cn('text-sm font-medium', config.textColor)}>
            总计: {totalCalories} 卡路里
          </div>
        )}
      </div>

      {/* 食物记录列表 */}
      <div className="space-y-2">
        {hasRecords ? (
          records.map((record) => (
            <FoodRecordCard
              key={record.id}
              record={record}
              onEdit={onEditRecord}
              onDelete={onDeleteRecord}
              showDate={showDate}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🍽️</div>
            <p>暂无{config.label}记录</p>
            <p className="text-sm mt-1">点击上方添加按钮开始记录</p>
          </div>
        )}
      </div>
    </div>
  )
}