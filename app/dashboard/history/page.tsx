'use client'

import React, { useState, useEffect } from 'react'
import { FoodCalendar } from '@/components/calendar'
import { FoodRecordsDisplay } from '@/components/food'
import { FoodRecordForm } from '@/components/food/food-record-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContentLoading } from '@/components/ui/loading-spinner'
import { CaloriesDisplay, StatsCard } from '@/components/ui/number-display'
import { MealTypeStats } from '@/components/ui/meal-type-selector'
import { Toast } from '@/components/ui/toast'
import { ClientFoodRecordService } from '@/lib/client-api'
import { getCurrentDate, formatDateWithWeekday } from '@/lib/date-utils'
import type { FoodRecord, FoodRecordFormData } from '@/types/database'
import { useAuth } from '@/lib/auth-context'

export default function HistoryPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate())
  const [records, setRecords] = useState<FoodRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 加载选中日期的记录
  useEffect(() => {
    loadRecordsForDate(selectedDate)
  }, [selectedDate])

  const loadRecordsForDate = async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const dayRecords = await ClientFoodRecordService.getFoodRecordsByDate(date)
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

  // 处理编辑记录
  const handleEditRecord = (record: FoodRecord) => {
    setEditingRecord(record)
    setShowForm(true)
    
    // 滚动到编辑表单区域
    setTimeout(() => {
      const formElement = document.querySelector('[data-food-form]')
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100)
  }

  // 处理删除记录
  const handleDeleteRecord = async (record: FoodRecord) => {
    try {
      await ClientFoodRecordService.deleteFoodRecord(record.id)
      setSuccessMessage('食物记录删除成功！')
      await loadRecordsForDate(selectedDate)
    } catch (err) {
      console.error('删除记录失败:', err)
      setError(err instanceof Error ? err.message : '删除记录失败')
    }
  }

  // 处理更新记录
  const handleUpdateRecord = async (formData: FoodRecordFormData) => {
    if (!editingRecord) return
    
    try {
      await ClientFoodRecordService.updateFoodRecord(editingRecord.id, formData)
      setSuccessMessage('食物记录更新成功！')
      setEditingRecord(null)
      setShowForm(false)
      await loadRecordsForDate(selectedDate)
    } catch (err) {
      console.error('更新记录失败:', err)
      setError(err instanceof Error ? err.message : '更新记录失败')
    }
  }

  // 处理取消编辑
  const handleCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

  // 计算选中日期的统计数据
  const dayStats = React.useMemo(() => {
    const totalCalories = records.reduce((sum, record) => sum + (record.calories || 0), 0)
    const mealStats = {
      breakfast: { count: 0, calories: 0 },
      lunch: { count: 0, calories: 0 },
      dinner: { count: 0, calories: 0 },
      snack: { count: 0, calories: 0 }
    }
    
    records.forEach(record => {
      const mealType = record.meal_type as keyof typeof mealStats
      if (mealStats[mealType]) {
        mealStats[mealType].count++
        mealStats[mealType].calories += record.calories || 0
      }
    })
    
    return { totalCalories, mealStats }
  }, [records])

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <Card variant="elevated" className="bg-gradient-to-br from-white to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                📅 历史记录
              </h1>
              <p className="text-gray-600">
                查看过往的饮食记录，追踪您的健康历程
              </p>
            </div>
            
            {/* 选中日期的总热量 */}
            {records.length > 0 && (
              <div className="flex-shrink-0">
                <CaloriesDisplay 
                  calories={dayStats.totalCalories} 
                  size="2xl"
                  animated={true}
                  className="text-center"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 日历组件 */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📆</span>
                <span>选择日期</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FoodCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* 记录显示区域 */}
        <div className="xl:col-span-2 space-y-6">
          {/* 日期统计概览 */}
          {records.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MealTypeStats
                mealType="breakfast"
                count={dayStats.mealStats.breakfast.count}
                calories={dayStats.mealStats.breakfast.calories}
              />
              <MealTypeStats
                mealType="lunch"
                count={dayStats.mealStats.lunch.count}
                calories={dayStats.mealStats.lunch.calories}
              />
              <MealTypeStats
                mealType="dinner"
                count={dayStats.mealStats.dinner.count}
                calories={dayStats.mealStats.dinner.calories}
              />
              <MealTypeStats
                mealType="snack"
                count={dayStats.mealStats.snack.count}
                calories={dayStats.mealStats.snack.calories}
              />
            </div>
          )}

          {/* 记录详情卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  <span>{formatDateWithWeekday(selectedDate)}</span>
                </div>
                {records.length > 0 && (
                  <span className="text-sm font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-button">
                    {records.length} 项记录
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 错误状态 */}
              {error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <span className="text-4xl">⚠️</span>
                  </div>
                  <div className="text-accent-error mb-4">
                    <p className="font-medium">加载失败</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button 
                    onClick={handleRetry} 
                    variant="outline" 
                    size="sm"
                    className="border-accent-error text-accent-error hover:bg-accent-error hover:text-white"
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
                      onEditRecord={handleEditRecord}
                      onDeleteRecord={handleDeleteRecord}
                      showDate={false}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">
                        📋
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        这一天还没有记录
                      </h3>
                      <p className="text-gray-500 mb-6">
                        选择其他日期查看历史记录，或者回到今天开始记录
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => setSelectedDate(getCurrentDate())}
                          variant="outline"
                          size="lg"
                        >
                          📅 回到今天
                        </Button>
                        <Button 
                          onClick={() => window.location.href = '/dashboard/today'}
                          size="lg"
                        >
                          ➕ 开始记录
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 编辑表单 */}
        {showForm && editingRecord && (
          <Card className="border-blue-200" data-food-form>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span>✏️</span>
                编辑食物记录
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FoodRecordForm
                onSubmit={handleUpdateRecord}
                onCancel={handleCancel}
                initialData={editingRecord}
                isEditing={true}
                disabled={false}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* 成功提示 */}
      {successMessage && (
        <Toast
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  )
}