/**
 * 餐次选择器组件 - 基于设计系统的现代化餐次选择界面
 */

'use client'

import React from 'react'
import { mealTypeVariants, mealTypeMap, type MealType } from '@/lib/component-variants'
import { cn } from '@/lib/utils'

interface MealTypeSelectorProps {
  value?: MealType
  onChange?: (mealType: MealType) => void
  disabled?: boolean
  className?: string
  layout?: 'grid' | 'list'
}

export function MealTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  layout = 'grid'
}: MealTypeSelectorProps) {
  const handleSelect = (mealType: MealType) => {
    if (!disabled && onChange) {
      onChange(mealType)
    }
  }

  const mealTypes: Array<{ id: MealType; emoji: string; label: string; description: string }> = [
    { id: 'breakfast', emoji: '🌅', label: '早餐', description: '开启美好一天' },
    { id: 'lunch', emoji: '☀️', label: '中餐', description: '补充午间能量' },
    { id: 'dinner', emoji: '🌙', label: '晚餐', description: '享受晚间时光' },
    { id: 'snack', emoji: '🍎', label: '加餐', description: '随时补充营养' },
  ]

  return (
    <div 
      className={cn(
        'space-y-3',
        layout === 'grid' 
          ? 'grid grid-cols-2 gap-3 space-y-0' 
          : 'space-y-3',
        className
      )}
      role="radiogroup"
      aria-label="选择餐次类型"
    >
      {mealTypes.map((mealType) => {
        const isSelected = value === mealType.id
        
        return (
          <button
            key={mealType.id}
            type="button"
            onClick={() => handleSelect(mealType.id)}
            disabled={disabled}
            className={cn(
              // 基础卡片样式
              'p-4 rounded-card border-2 transition-all duration-200 animate-spring',
              'touch-comfortable text-left',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              
              // 餐次特定颜色
              mealTypeVariants({ type: mealType.id }),
              
              // 选中状态
              isSelected && [
                'ring-2 ring-primary scale-105',
                'shadow-md border-primary'
              ],
              
              // 悬停和激活状态
              !disabled && [
                'hover:scale-105 active:scale-95',
                'hover:shadow-sm cursor-pointer'
              ],
              
              // 禁用状态
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            role="radio"
            aria-checked={isSelected}
            aria-describedby={`${mealType.id}-description`}
          >
            <div className="flex items-center space-x-3">
              {/* 表情图标 */}
              <div className={cn(
                'text-2xl transition-transform duration-200',
                isSelected && 'scale-110'
              )}>
                {mealType.emoji}
              </div>
              
              {/* 文字内容 */}
              <div className="flex-1">
                <div className={cn(
                  'font-medium text-base transition-colors duration-200',
                  isSelected && 'font-semibold'
                )}>
                  {mealType.label}
                </div>
                <div 
                  id={`${mealType.id}-description`}
                  className="text-xs opacity-70 mt-0.5"
                >
                  {mealType.description}
                </div>
              </div>
              
              {/* 选中指示器 */}
              {isSelected && (
                <div className="w-3 h-3 bg-current rounded-full animate-pulse" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/**
 * 餐次标签组件 - 用于显示餐次类型的小标签
 */
interface MealTypeBadgeProps {
  mealType: MealType
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
  className?: string
}

export function MealTypeBadge({ 
  mealType, 
  size = 'md',
  showEmoji = true,
  className 
}: MealTypeBadgeProps) {
  const mealConfig = mealTypeMap[mealType]
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-button',
        mealTypeVariants({ type: mealType }),
        sizeStyles[size],
        className
      )}
    >
      {showEmoji && (
        <span className={cn(
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base', 
          size === 'lg' && 'text-lg'
        )}>
          {mealConfig.emoji}
        </span>
      )}
      {mealConfig.label}
    </span>
  )
}

/**
 * 餐次统计卡片 - 用于显示各餐次的统计信息
 */
interface MealTypeStatsProps {
  mealType: MealType
  count: number
  calories: number
  className?: string
  onClick?: () => void
}

export function MealTypeStats({
  mealType,
  count,
  calories,
  className,
  onClick
}: MealTypeStatsProps) {
  const mealConfig = mealTypeMap[mealType]
  const isInteractive = !!onClick
  
  return (
    <div
      className={cn(
        'p-4 rounded-card border transition-all duration-200',
        mealTypeVariants({ type: mealType }),
        isInteractive && [
          'cursor-pointer hover:scale-105 active:scale-95',
          'hover:shadow-md animate-spring'
        ],
        className
      )}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{mealConfig.emoji}</div>
          <div>
            <div className="font-medium text-base">{mealConfig.label}</div>
            <div className="text-sm opacity-70">{count} 项记录</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-accent-calories">
            {calories}
          </div>
          <div className="text-xs opacity-70">卡路里</div>
        </div>
      </div>
    </div>
  )
}