'use client'

import { cn } from '@/lib/utils'

interface RecordIndicatorProps {
  hasRecords: boolean
  totalCalories?: number
  className?: string
}

export function RecordIndicator({ 
  hasRecords, 
  totalCalories, 
  className = '' 
}: RecordIndicatorProps) {
  if (!hasRecords) {
    return (
      <div className={cn('w-2 h-2 bg-gray-300 rounded-full', className)} />
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* 记录指示点 */}
      <div className="w-2 h-2 bg-blue-500 rounded-full" />
      
      {/* 卡路里显示（可选） */}
      {totalCalories !== undefined && (
        <span className="text-xs text-gray-600 mt-0.5 leading-none">
          {totalCalories > 999 ? '999+' : totalCalories}
        </span>
      )}
    </div>
  )
}