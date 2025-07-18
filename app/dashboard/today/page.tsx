'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { FoodRecordForm } from '@/components/food/food-record-form'
import { FoodRecordsDisplay } from '@/components/food/food-records-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentDate, formatRelativeDate } from '@/lib/date-utils'
import { type FoodRecord, type FoodRecordFormData } from '@/types/database'
import { cn } from '@/lib/utils'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export default function TodayPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // 状态管理
  const [records, setRecords] = useState<FoodRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = getCurrentDate()

  // 重定向未认证用户
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // 获取今日记录
  const fetchTodayRecords = useCallback(async () => {
    if (!user?.access_token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/food-records?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result: ApiResponse<FoodRecord[]> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取记录失败')
      }

      if (result.success && result.data) {
        setRecords(result.data)
      } else {
        throw new Error(result.error || '获取记录失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取记录失败'
      setError(errorMessage)
      console.error('Error fetching today records:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.access_token, today])

  // 初始加载
  useEffect(() => {
    if (user?.access_token) {
      fetchTodayRecords()
    }
  }, [user?.access_token, fetchTodayRecords])

  // 创建新记录
  const handleCreateRecord = async (formData: FoodRecordFormData) => {
    if (!user?.access_token) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/food-records', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result: ApiResponse<FoodRecord> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '创建记录失败')
      }

      if (result.success && result.data) {
        // 添加新记录到列表
        setRecords(prev => [...prev, result.data!])
        setShowForm(false)
      } else {
        throw new Error(result.error || '创建记录失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建记录失败'
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 更新记录
  const handleUpdateRecord = async (formData: FoodRecordFormData) => {
    if (!user?.access_token || !editingRecord) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/food-records/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result: ApiResponse<FoodRecord> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '更新记录失败')
      }

      if (result.success && result.data) {
        // 更新记录列表
        setRecords(prev => 
          prev.map(record => 
            record.id === editingRecord.id ? result.data! : record
          )
        )
        setEditingRecord(null)
        setShowForm(false)
      } else {
        throw new Error(result.error || '更新记录失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新记录失败'
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 删除记录
  const handleDeleteRecord = async (record: FoodRecord) => {
    if (!user?.access_token) return

    try {
      const response = await fetch(`/api/food-records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result: ApiResponse<void> = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '删除记录失败')
      }

      if (result.success) {
        // 从列表中移除记录
        setRecords(prev => prev.filter(r => r.id !== record.id))
      } else {
        throw new Error(result.error || '删除记录失败')
      }
    } catch (err) {
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

  // 计算总卡路里
  const totalCalories = Array.isArray(records) ? records.reduce((sum, record) => sum + record.calories, 0) : 0

  // 加载状态
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未认证状态
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatRelativeDate(today)}的记录
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                记录您今天的饮食情况
              </p>
            </div>
            
            {/* 总卡路里显示 */}
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {totalCalories}
              </div>
              <div className="text-sm text-gray-600">
                总卡路里
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTodayRecords}
                className="ml-4"
              >
                重试
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-8">
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
    </div>
  )
}