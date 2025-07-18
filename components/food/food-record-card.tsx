'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
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
      'bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex gap-4">
        {/* 食物图片 */}
        <div className="flex-shrink-0">
          {record.image_url && !imageError ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={record.image_url}
                alt={record.food_name}
                fill
                className="object-cover"
                onError={handleImageError}
                sizes="64px"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* 食物信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* 餐次标签 */}
              <div className="flex items-center gap-2 mb-1">
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
              <h3 className="font-medium text-gray-900 truncate mb-1">
                {record.food_name}
              </h3>

              {/* 重量和卡路里 */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{record.weight}g</span>
                <span className="font-medium text-orange-600">
                  {record.calories} 卡路里
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1 ml-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    title="编辑记录"
                  >
                    <span className="sr-only">编辑</span>
                    ✏️
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                    title="删除记录"
                  >
                    <span className="sr-only">删除</span>
                    {isDeleting ? '⏳' : '🗑️'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}