'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { isToday, isPastDate, isFutureDate } from '@/lib/date-utils'

interface CalendarDayProps {
  date: string
  isSelected?: boolean
  isCurrentMonth?: boolean
  isToday?: boolean
  onClick?: () => void
  children?: ReactNode
  className?: string
}

export function CalendarDay({
  date,
  isSelected = false,
  isCurrentMonth = true,
  isToday: todayProp,
  onClick,
  children,
  className = ''
}: CalendarDayProps) {
  const dateObj = new Date(date)
  const dayNumber = dateObj.getDate()
  const isTodayCalculated = todayProp ?? isToday(date)
  const isPast = isPastDate(date)
  const isFuture = isFutureDate(date)

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className={cn(
        // 基础样式
        'relative aspect-square border rounded-lg cursor-pointer transition-all duration-200',
        'flex flex-col items-center justify-center p-1',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        
        // 选中状态优先级最高
        isSelected ? [
          'bg-blue-500 text-white border-blue-500',
          'hover:bg-blue-600'
        ] : [
          // 今天的样式
          isTodayCalculated && [
            'border-blue-500 border-2 font-semibold text-blue-600'
          ],
          
          // 非当前月份的日期背景
          !isCurrentMonth && 'bg-gray-50',
          
          // 文字颜色优先级：今天 > 当前月份 > 过去/未来
          !isTodayCalculated && (
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          )
        ],
        
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`选择日期 ${date}`}
      aria-pressed={isSelected}
    >
      {/* 日期数字 */}
      <span className={cn(
        'text-sm font-medium mb-1',
        isSelected && 'text-white',
        isTodayCalculated && !isSelected && 'text-blue-600 font-bold'
      )}>
        {dayNumber}
      </span>
      
      {/* 记录指示器和其他内容 */}
      {children}
      
      {/* 今天标记 */}
      {isTodayCalculated && !isSelected && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
      )}
    </div>
  )
}