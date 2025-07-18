'use client'

import { useState, useEffect } from 'react'
import { CalendarDay } from './calendar-day'
import { RecordIndicator } from './record-indicator'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { 
  formatDate, 
  getMonthCalendarDays, 
  DATE_FORMATS,
  getCurrentDate,
  addDays,
  subtractDays
} from '@/lib/date-utils'
import { FoodRecordService } from '@/lib/database'
import type { CalendarDay as CalendarDayType } from '@/types/database'

interface FoodCalendarProps {
  selectedDate?: string
  onDateSelect: (date: string) => void
  className?: string
}

export function FoodCalendar({ selectedDate, onDateSelect, className = '' }: FoodCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDayType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // 获取当月日历数据
  useEffect(() => {
    loadCalendarData()
  }, [currentDate])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取当月的所有日期
      const monthDays = getMonthCalendarDays(year, month)
      
      // 获取日期范围
      const startDate = formatDate(monthDays[0], 'iso')
      const endDate = formatDate(monthDays[monthDays.length - 1], 'iso')
      
      // 获取有记录的日期
      const recordDates = await FoodRecordService.getRecordDates(startDate, endDate)
      const recordDateSet = new Set(recordDates)

      // 构建日历数据
      const calendarData: CalendarDayType[] = monthDays.map(date => {
        const dateStr = formatDate(date, 'iso')
        return {
          date: dateStr,
          hasRecords: recordDateSet.has(dateStr),
          totalCalories: undefined // 可以后续扩展显示总卡路里
        }
      })

      setCalendarDays(calendarData)
    } catch (err) {
      console.error('加载日历数据失败:', err)
      setError(err instanceof Error ? err.message : '加载日历数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    onDateSelect(getCurrentDate())
  }

  const handleDateClick = (date: string) => {
    onDateSelect(date)
  }

  const isCurrentMonth = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.getMonth() === currentDate.getMonth() && 
           dateObj.getFullYear() === currentDate.getFullYear()
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-red-600">
          <p>加载日历失败</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <Button 
            onClick={loadCalendarData} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            重试
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-3 md:p-4 ${className}`}>
      {/* 日历头部 - 响应式布局 */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          <Button 
            onClick={handlePreviousMonth}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex-shrink-0"
          >
            ← 上月
          </Button>
          
          <h2 className="text-base md:text-lg font-semibold mx-4 sm:mx-0">
            {formatDate(currentDate, 'month-year')}
          </h2>
          
          <Button 
            onClick={handleNextMonth}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex-shrink-0"
          >
            下月 →
          </Button>
        </div>
        
        <Button 
          onClick={handleToday}
          variant="outline"
          size="sm"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          今天
        </Button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DATE_FORMATS.WEEKDAY.map((day, index) => (
          <div 
            key={index} 
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            星期{day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {loading ? (
          // 加载状态
          Array.from({ length: 42 }).map((_, index) => (
            <div 
              key={index} 
              className="aspect-square border rounded-lg bg-gray-50 animate-pulse"
            />
          ))
        ) : (
          calendarDays.map((dayData, index) => (
            <CalendarDay
              key={index}
              date={dayData.date}
              isSelected={selectedDate === dayData.date}
              isCurrentMonth={isCurrentMonth(dayData.date)}
              isToday={dayData.date === getCurrentDate()}
              onClick={() => handleDateClick(dayData.date)}
            >
              <RecordIndicator 
                hasRecords={dayData.hasRecords}
                totalCalories={dayData.totalCalories}
              />
            </CalendarDay>
          ))
        )}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>有记录</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>无记录</span>
        </div>
      </div>
    </Card>
  )
}