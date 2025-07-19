'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { FoodRecordForm } from '@/components/food/food-record-form'
import { FoodRecordsDisplay } from '@/components/food/food-records-display'
import { Button, FAB } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { getCurrentDate, formatRelativeDate } from '@/lib/date-utils'
import { ClientFoodRecordService } from '@/lib/client-api'
import { type FoodRecord, type FoodRecordFormData } from '@/types/database'

export default function TodayPage() {
  const { user } = useAuth()
  const today = getCurrentDate()

  // State management
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
    } else {
      setLoading(false)
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

  // Handlers
  const handleCreateRecord = async (formData: FoodRecordFormData) => {
    if (!user?.id) {
      setError(new Error('用户未登录'))
      return
    }
    
    try {
      const recordData = {
        ...formData,
        user_id: user.id
      }
      await ClientFoodRecordService.createFoodRecord(recordData)
      setSuccessMessage('食物记录添加成功！')
      setShowForm(false)
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
      await loadTodayRecords()
    } catch (err) {
      console.error('删除记录失败:', err)
      setError(err instanceof Error ? err : new Error('删除记录失败'))
    }
  }

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

  const handleCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

  const handleRetry = () => {
    loadTodayRecords()
  }

  // Calculate total calories
  const totalCalories = records.reduce((sum, record) => sum + record.calories, 0)

  // Loading state
  if (loading) {
    return <PageLoading text="加载今日记录..." />
  }

  return (
    <>
      <div className="space-y-6">
        {/* 页面头部 - 简化版本 */}
        <Card className="bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {formatRelativeDate(today)}
                </h1>
                <p className="text-gray-600">
                  📊 记录您今天的饮食情况，保持健康生活
                </p>
              </div>

              {/* 热量显示 - 简化版本 */}
              <div className="flex-shrink-0 text-center">
                <div className="text-4xl font-bold text-blue-600">{totalCalories}</div>
                <div className="text-sm text-gray-500">卡路里</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 餐次统计概览 - 简化版本 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: '早餐', icon: '🌅', type: 'breakfast' },
            { title: '中餐', icon: '☀️', type: 'lunch' },
            { title: '晚餐', icon: '🌙', type: 'dinner' },
            { title: '加餐', icon: '🍎', type: 'snack' }
          ].map((meal) => {
            const mealRecords = records.filter(r => r.meal_type === meal.type)
            const mealCalories = mealRecords.reduce((sum, r) => sum + r.calories, 0)
            
            return (
              <Card key={meal.type} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">{meal.title}</h3>
                  <span className="text-xl">{meal.icon}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{mealCalories}</div>
                <div className="text-xs text-gray-500">{mealRecords.length}项记录</div>
              </Card>
            )
          })}
        </div>

        {/* 错误提示 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-red-600">
                  <span>⚠️</span>
                  <span className="flex-1">{error instanceof Error ? error.message : String(error)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 食物记录表单 */}
        {showForm && (
          <Card className="border-blue-200" data-food-form>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>📝</span>
                <span>今日记录</span>
              </div>
              {records.length > 0 && (
                <span className="text-sm font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
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

      {/* 浮动添加按钮 */}
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