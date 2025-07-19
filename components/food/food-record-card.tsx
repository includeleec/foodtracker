'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FoodImage } from '@/components/ui/optimized-image'
import { type FoodRecord } from '@/types/database'
import { formatRelativeDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface FoodRecordCardProps {
  record: FoodRecord
  onEdit?: (record: FoodRecord) => void
  onDelete?: (record: FoodRecord) => void
  showDate?: boolean
  className?: string
}

const MEAL_TYPE_LABELS = {
  breakfast: '早餐',
  lunch: '中餐', 
  dinner: '晚餐',
  snack: '加餐'
} as const

export function FoodRecordCard({
  record,
  onEdit,
  onDelete,
  showDate = false,
  className
}: FoodRecordCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(record)
    }
  }

  const handleDelete = async () => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(record)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={cn(
      'relative bg-white rounded-xl border border-gray-200 overflow-hidden',
      'shadow-sm hover:shadow-md transition-all duration-200',
      'group',
      className
    )}>
      {/* 移动端优化布局 */}
      <div className="block md:flex md:gap-4 p-4">
        {/* 餐次标签 - 移动端置顶 */}
        <div className="flex items-center justify-between mb-3 md:hidden">
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
            {
              'bg-orange-100 text-orange-800': record.meal_type === 'breakfast',
              'bg-green-100 text-green-800': record.meal_type === 'lunch', 
              'bg-blue-100 text-blue-800': record.meal_type === 'dinner',
              'bg-purple-100 text-purple-800': record.meal_type === 'snack',
            }
          )}>
            {MEAL_TYPE_LABELS[record.meal_type]}
          </span>
          {showDate && (
            <span className="text-xs text-gray-500">
              {formatRelativeDate(record.record_date)}
            </span>
          )}
        </div>

        {/* 食物图片 - 移动端全宽 */}
        <div className="w-full md:w-20 md:flex-shrink-0 mb-4 md:mb-0">
          {record.image_url ? (
            <div className="w-full h-48 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 relative">
              <img
                src={record.image_url}
                alt={record.food_name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="w-full h-48 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-4xl md:text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* 食物信息 - 移动端垂直布局 */}
        <div className="flex-1 space-y-3">
          {/* 桌面端餐次标签 */}
          <div className="hidden md:flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              {
                'bg-orange-100 text-orange-800': record.meal_type === 'breakfast',
                'bg-green-100 text-green-800': record.meal_type === 'lunch',
                'bg-blue-100 text-blue-800': record.meal_type === 'dinner', 
                'bg-purple-100 text-purple-800': record.meal_type === 'snack',
              }
            )}>
              {MEAL_TYPE_LABELS[record.meal_type]}
            </span>
            {showDate && (
              <span className="text-xs text-gray-500">
                {formatRelativeDate(record.record_date)}
              </span>
            )}
          </div>

          {/* 食物名称 */}
          <h3 className="text-lg md:text-base font-semibold text-gray-900 leading-tight">
            {record.food_name}
          </h3>

          {/* 营养信息 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-600">
                <span className="text-gray-400">⚖️</span>
                {record.weight}g
              </span>
              <span className="flex items-center gap-1 font-medium text-orange-600">
                <span>🔥</span>
                {record.calories} 卡路里
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 浮动操作按钮 - 右上角 */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 transition-opacity duration-200">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className={cn(
                'h-8 w-8 p-0 rounded-full',
                'bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200',
                'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
                'transition-all duration-200'
              )}
              title="编辑记录"
            >
              <span className="sr-only">编辑</span>
              <span className="text-sm">✏️</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                'h-8 w-8 p-0 rounded-full',
                'bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200',
                'text-gray-600 hover:text-red-600 hover:bg-red-50',
                'transition-all duration-200',
                isDeleting && 'opacity-50 cursor-not-allowed'
              )}
              title="删除记录"
            >
              <span className="sr-only">删除</span>
              <span className="text-sm">{isDeleting ? '⏳' : '🗑️'}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}