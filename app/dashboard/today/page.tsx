'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { FoodRecordForm } from '@/components/food/food-record-form'
import { FoodRecordsDisplay } from '@/components/food/food-records-display'
import { Button, FAB } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { CaloriesDisplay, StatsCard } from '@/components/ui/number-display'
import { getCurrentDate, formatRelativeDate } from '@/lib/date-utils'
import { ClientFoodRecordService } from '@/lib/client-api'
import { type FoodRecord, type FoodRecordFormData } from '@/types/database'

export default function TodayPage() {
  const { user } = useAuth()
  const today = getCurrentDate()

  // Simplified state management without complex hooks for now
  const [records, setRecords] = useState<FoodRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load today's records
  useEffect(() => {
    if (user?.access_token) {
      loadTodayRecords()
    }
  }, [user?.access_token])

  const loadTodayRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const todayRecords = await ClientFoodRecordService.getFoodRecordsByDate(today)
      setRecords(todayRecords)
    } catch (err) {
      console.error('加载今日记录失败:', err)
      setError(err instanceof Error ? err : new Error('加载今日记录失败'))
    } finally {
      setLoading(false)
    }
  }

  // Real handlers with API calls
  const handleCreateRecord = async (formData: FoodRecordFormData) => {
    if (!user?.id) {
      setError(new Error('用户未登录'))
      return
    }
    
    try {
      // Add user_id to form data to match FoodRecordInsert type
      const recordData = {
        ...formData,
        user_id: user.id
      }
      await ClientFoodRecordService.createFoodRecord(recordData)
      setSuccessMessage('食物记录添加成功！')
      setShowForm(false)
      // Reload records to show the new one
      await loadTodayRecords()
    } catch (err) {
      console.error('创建记录失败:', err)
      setError(err instanceof Error ? err : new Error('创建记录失败'))
    }
  }

  const handleUpdateRecord = async (formData: FoodRecordFormData) => {
    if (!editingRecord) return
    
    try {
      await ClientFoodRecordService.updateFoodRecord(editingRecord.id, formData)
      setSuccessMessage('食物记录更新成功！')
      setEditingRecord(null)
      setShowForm(false)
      // Reload records to show the updated one
      await loadTodayRecords()
    } catch (err) {
      console.error('更新记录失败:', err)
      setError(err instanceof Error ? err : new Error('更新记录失败'))
    }
  }

  const handleDeleteRecord = async (record: FoodRecord) => {
    try {
      await ClientFoodRecordService.deleteFoodRecord(record.id)
      setSuccessMessage('食物记录删除成功！')
      // Reload records to remove the deleted one
      await loadTodayRecords()
    } catch (err) {
      console.error('删除记录失败:', err)
      setError(err instanceof Error ? err : new Error('删除记录失败'))
    }
  }

  // 编辑记录
  const handleEditRecord = (record: FoodRecord) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  // 取消操作
  const handleCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

  // 重试加载
  const handleRetry = () => {
    loadTodayRecords()
  }

  // 计算统计数据
  const mealStats = React.useMemo(() => {
    const stats = {
      breakfast: { count: 0, calories: 0 },
      lunch: { count: 0, calories: 0 },
      dinner: { count: 0, calories: 0 },
      snack: { count: 0, calories: 0 }
    }
    
    if (records) {
      records.forEach(record => {
        const mealType = record.meal_type as keyof typeof stats
        if (stats[mealType]) {
          stats[mealType].count++
          stats[mealType].calories += record.calories || 0
        }
      })
    }
    
    return stats
  }, [records])

  // Calculate total calories
  const totalCalories = records.reduce((sum, record) => sum + record.calories, 0)

  // 只处理数据加载状态，认证已在layout处理
  if (loading) {
    return <PageLoading text="加载今日记录..." />
  }

  return (
    <>
      <div className="space-y-6">
        {/* 页面头部 - 新设计 */}
        <Card variant="elevated" className="bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {formatRelativeDate(today)}
                </h1>
                <p className="text-gray-600">
                  📊 记录您今天的饮食情况，保持健康生活
                </p>
              </div>

              {/* 热量显示 - 使用新组件 */}
              <div className="flex-shrink-0">
                <CaloriesDisplay 
                  calories={totalCalories} 
                  size="3xl"
                  animated={true}
                  className="text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 餐次统计概览 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="早餐"
            value={mealStats.breakfast.calories}
            unit="卡"
            icon="🌅"
            type="calories"
            trend={{
              value: mealStats.breakfast.count,
              type: 'neutral',
              period: `${mealStats.breakfast.count}项记录`
            }}
          />
          <StatsCard
            title="中餐"
            value={mealStats.lunch.calories}
            unit="卡"
            icon="☀️"
            type="calories"
            trend={{
              value: mealStats.lunch.count,
              type: 'neutral',
              period: `${mealStats.lunch.count}项记录`
            }}
          />
          <StatsCard
            title="晚餐"
            value={mealStats.dinner.calories}
            unit="卡"
            icon="🌙"
            type="calories"
            trend={{
              value: mealStats.dinner.count,
              type: 'neutral',
              period: `${mealStats.dinner.count}项记录`
            }}
          />
          <StatsCard
            title="加餐"
            value={mealStats.snack.calories}
            unit="卡"
            icon="🍎"
            type="calories"
            trend={{
              value: mealStats.snack.count,
              type: 'neutral',
              period: `${mealStats.snack.count}项记录`
            }}
          />
        </div>

        {/* 错误提示 - 新设计 */}
        {error && (
          <Card className="border-accent-error bg-red-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-accent-error">
                  <span>⚠️</span>
                  <span className="flex-1">{error instanceof Error ? error.message : String(error)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="w-full sm:w-auto border-accent-error text-accent-error hover:bg-accent-error hover:text-white"
                >
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 食物记录表单 */}
        {showForm && (
          <Card variant="elevated" className="border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <span>{editingRecord ? '✏️' : '➕'}</span>
                {editingRecord ? '编辑食物记录' : '添加食物记录'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FoodRecordForm
                onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
                onCancel={handleCancel}
                initialData={editingRecord || { record_date: today }}
                isEditing={!!editingRecord}
                disabled={false}
              />
            </CardContent>
          </Card>
        )}

        {/* 今日记录显示 */}
        <Card variant="interactive">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>📝</span>
                <span>今日记录</span>
              </div>
              {records.length > 0 && (
                <span className="text-sm font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-button">
                  {records.length} 项记录
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FoodRecordsDisplay
              records={records}
              date={today}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              showDate={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* 浮动添加按钮 - 仅在未显示表单时显示 */}
      {!showForm && (
        <FAB
          onClick={() => setShowForm(true)}
          icon="➕"
          aria-label="添加食物记录"
        />
      )}

      {/* 成功提示 */}
      {successMessage && (
        <Toast
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </>
  )
}