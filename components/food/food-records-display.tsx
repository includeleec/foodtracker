'use client'

import React, { useState } from 'react'
import { MealSection } from './meal-section'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { type FoodRecord, type MealType, type DailyRecords } from '@/types/database'
import { formatRelativeDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface FoodRecordsDisplayProps {
  records: FoodRecord[]
  date?: string
  onEditRecord?: (record: FoodRecord) => void
  onDeleteRecord?: (record: FoodRecord) => Promise<void>
  showDate?: boolean
  className?: string
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function FoodRecordsDisplay({
  records,
  date,
  onEditRecord,
  onDeleteRecord,
  showDate = false,
  className
}: FoodRecordsDisplayProps) {
  console.log('🔄 FoodRecordsDisplay 重新渲染:', {
    functionString: onDeleteRecord?.toString().substring(0, 200),
    date,
    recordsCount: records.length,
    componentId: Math.random().toString(36).substring(7)
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    record: FoodRecord | null
    isLoading: boolean
  }>({
    isOpen: false,
    record: null,
    isLoading: false
  })

  // 按餐次分组记录
  const groupedRecords = records.reduce((groups, record) => {
    if (!groups[record.meal_type]) {
      groups[record.meal_type] = []
    }
    groups[record.meal_type].push(record)
    return groups
  }, {} as Record<MealType, FoodRecord[]>)

  // 计算总卡路里
  const totalCalories = records.reduce((sum, record) => sum + (record.calories || 0), 0)

  // 处理删除确认
  const handleDeleteClick = (record: FoodRecord) => {
    console.log('🗑️ 删除按钮被点击:', record.id, record.food_name)
    console.log('🗑️ onDeleteRecord 函数存在:', !!onDeleteRecord)
    setDeleteDialog({
      isOpen: true,
      record,
      isLoading: false
    })
  }

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    console.log('✅ 确认删除按钮被点击')
    console.log('✅ 删除记录:', deleteDialog.record?.id, deleteDialog.record?.food_name)
    console.log('✅ onDeleteRecord 函数:', onDeleteRecord)
    
    if (!deleteDialog.record || !onDeleteRecord) {
      console.log('❌ 删除条件不满足:', { 
        hasRecord: !!deleteDialog.record, 
        hasDeleteFunction: !!onDeleteRecord 
      })
      return
    }

    setDeleteDialog(prev => ({ ...prev, isLoading: true }))

    try {
      console.log('🚀 开始调用删除函数...')
      await onDeleteRecord(deleteDialog.record)
      setDeleteDialog({
        isOpen: false,
        record: null,
        isLoading: false
      })
      console.log('删除确认对话框：记录删除成功', deleteDialog.record.id)
    } catch (error) {
      console.error('删除确认对话框：删除失败', error, {
        recordId: deleteDialog.record.id,
        foodName: deleteDialog.record.food_name,
        mealType: deleteDialog.record.meal_type,
        timestamp: new Date().toISOString()
      })
      // 错误处理由父组件负责，但确保对话框状态恢复
      setDeleteDialog(prev => ({ ...prev, isLoading: false }))
    }
  }

  // 关闭删除对话框
  const handleDeleteCancel = () => {
    console.log('❌ 取消删除按钮被点击')
    console.log('❌ 当前删除对话框状态:', deleteDialog)
    console.log('❌ 是否正在加载:', deleteDialog.isLoading)
    
    if (!deleteDialog.isLoading) {
      setDeleteDialog({
        isOpen: false,
        record: null,
        isLoading: false
      })
    }
  }

  const hasRecords = records.length > 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* 日期和总计信息 */}
      {(date || hasRecords) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {date && (
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  {formatRelativeDate(date)}
                </h2>
              )}
              {hasRecords && (
                <p className="text-sm text-gray-600">
                  共 {records.length} 项记录
                </p>
              )}
            </div>
            
            {hasRecords && (
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {totalCalories}
                </div>
                <div className="text-sm text-gray-600">
                  总卡路里
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 餐次记录 */}
      {hasRecords ? (
        <div className="space-y-6">
          {MEAL_ORDER.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              records={groupedRecords[mealType] || []}
              onEditRecord={onEditRecord}
              onDeleteRecord={onDeleteRecord ? handleDeleteClick : undefined}
              showDate={showDate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {date ? `${formatRelativeDate(date)}暂无记录` : '暂无食物记录'}
          </h3>
          <p className="text-gray-600">
            开始记录您的饮食，追踪健康生活
          </p>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onCancel={() => {
          console.log('📤 FoodRecordsDisplay - onCancel 被调用')
          handleDeleteCancel()
        }}
        onConfirm={() => {
          console.log('📤 FoodRecordsDisplay - onConfirm 被调用')
          handleDeleteConfirm()
        }}
        title="删除食物记录"
        message={`确定要删除"${deleteDialog.record?.food_name}"的记录吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        isLoading={deleteDialog.isLoading}
      />
    </div>
  )
}