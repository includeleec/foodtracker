'use client'

import { useState, useEffect } from 'react'
import { FoodCalendar } from '@/components/calendar'
import { FoodRecordsDisplay } from '@/components/food'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContentLoading } from '@/components/ui/loading-spinner'
import { FoodRecordService } from '@/lib/database'
import { getCurrentDate, formatDateWithWeekday } from '@/lib/date-utils'
import type { FoodRecord } from '@/types/database'

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate())
  const [records, setRecords] = useState<FoodRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载选中日期的记录
  useEffect(() => {
    loadRecordsForDate(selectedDate)
  }, [selectedDate])

  const loadRecordsForDate = async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const dayRecords = await FoodRecordService.getFoodRecordsByDate(date)
      setRecords(dayRecords)
    } catch (err) {
      console.error('加载历史记录失败:', err)
      setError(err instanceof Error ? err.message : '加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
  }

  const handleRetry = () => {
    loadRecordsForDate(selectedDate)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">历史记录</h1>
        <p className="text-gray-600">查看过往的饮食记录</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* 日历组件 */}
        <div className="xl:col-span-1">
          <FoodCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            className="w-full"
          />
        </div>

        {/* 记录显示区域 */}
        <div className="xl:col-span-1">
          <Card className="p-4 md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {formatDateWithWeekday(selectedDate)}
              </h2>
            </div>

            {/* 错误状态 */}
            {error && (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">
                  <p className="font-medium">加载失败</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  size="sm"
                >
                  重试
                </Button>
              </div>
            )}

            {/* 加载状态 */}
            {loading && !error && (
              <ContentLoading text="加载记录中..." />
            )}

            {/* 记录内容 */}
            {!loading && !error && (
              <>
                {records.length > 0 ? (
                  <FoodRecordsDisplay
                    records={records}
                    onEdit={() => {}} // 历史记录页面不支持编辑
                    onDelete={() => {}} // 历史记录页面不支持删除
                    showActions={false} // 隐藏操作按钮
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg 
                        className="w-16 h-16 mx-auto mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      这一天还没有记录
                    </h3>
                    <p className="text-gray-500 mb-4">
                      选择其他日期查看历史记录
                    </p>
                    <Button 
                      onClick={() => setSelectedDate(getCurrentDate())}
                      variant="outline"
                    >
                      回到今天
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}