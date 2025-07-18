'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { FoodRecordForm } from '@/components/food/food-record-form'
import { FoodRecordsDisplay } from '@/components/food/food-records-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { getCurrentDate, formatRelativeDate } from '@/lib/date-utils'
import { useFoodRecordsManager, useDataPreloader } from '@/hooks/use-food-records'
import { usePerformanceMonitoring } from '@/lib/performance-utils'
import { type FoodRecord, type FoodRecordFormData } from '@/types/database'

export default function TodayPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const today = getCurrentDate()

  // 使用优化的数据管理 Hook
  const {
    records,
    loading: recordsLoading,
    error,
    isSubmitting,
    totalCalories,
    createRecord,
    updateRecord,
    deleteRecord,
    refresh
  } = useFoodRecordsManager(today)

  // 性能监控
  const { recordMetric } = usePerformanceMonitoring()

  // 数据预加载
  const { preloadTodayRecords, preloadRecentDates } = useDataPreloader()

  // 状态管理
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 重定向未认证用户
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // 预加载数据
  useEffect(() => {
    if (user?.access_token) {
      preloadTodayRecords()
      preloadRecentDates()
    }
  }, [user?.access_token, preloadTodayRecords, preloadRecentDates])

  // 创建新记录
  const handleCreateRecord = async (formData: FoodRecordFormData) => {
    try {
      recordMetric('form_submit_start', 1, 'counter')
      await createRecord(formData)
      setShowForm(false)
      setSuccessMessage('食物记录添加成功！')
      recordMetric('form_submit_success', 1, 'counter')
    } catch (err) {
      recordMetric('form_submit_error', 1, 'counter')
      const errorMessage = err instanceof Error ? err.message : '创建记录失败'
      throw new Error(errorMessage)
    }
  }

  // 更新记录
  const handleUpdateRecord = async (formData: FoodRecordFormData) => {
    if (!editingRecord) return

    try {
      recordMetric('form_update_start', 1, 'counter')
      await updateRecord(editingRecord.id, formData)
      setEditingRecord(null)
      setShowForm(false)
      setSuccessMessage('食物记录更新成功！')
      recordMetric('form_update_success', 1, 'counter')
    } catch (err) {
      recordMetric('form_update_error', 1, 'counter')
      const errorMessage = err instanceof Error ? err.message : '更新记录失败'
      throw new Error(errorMessage)
    }
  }

  // 删除记录
  const handleDeleteRecord = async (record: FoodRecord) => {
    try {
      recordMetric('record_delete_start', 1, 'counter')
      await deleteRecord(record)
      setSuccessMessage('食物记录删除成功！')
      recordMetric('record_delete_success', 1, 'counter')
    } catch (err) {
      recordMetric('record_delete_error', 1, 'counter')
      const errorMessage = err instanceof Error ? err.message : '删除记录失败'
      throw new Error(errorMessage)
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

  // 加载状态
  if (loading || recordsLoading) {
    return <PageLoading text="加载今日记录..." />
  }

  // 未认证状态
  if (!user) {
    return null
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* 页面头部 - 响应式设计 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-4 md:px-6 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {formatRelativeDate(today)}的记录
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  记录您今天的饮食情况
                </p>
              </div>

              {/* 总卡路里显示 - 响应式 */}
              <div className="flex-shrink-0 text-center sm:text-right">
                <div className="text-2xl md:text-3xl font-bold text-orange-600">
                  {totalCalories}
                </div>
                <div className="text-sm text-gray-600">
                  总卡路里
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="flex-1">{error.message || error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="w-full sm:w-auto"
              >
                重试
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          {/* 添加记录按钮 */}
          {!showForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button
                    onClick={() => setShowForm(true)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    ➕ 添加食物记录
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 食物记录表单 */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRecord ? '编辑食物记录' : '添加食物记录'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FoodRecordForm
                  onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
                  onCancel={handleCancel}
                  initialData={editingRecord || { record_date: today }}
                  isEditing={!!editingRecord}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>
          )}

          {/* 今日记录显示 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>今日记录</span>
                {records.length > 0 && (
                  <span className="text-sm font-normal text-gray-600">
                    共 {records.length} 项记录
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
      </div>

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