'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCachedData, CacheKeys, CacheInvalidation } from '@/lib/cache-utils'
import { performanceMonitor } from '@/lib/performance-utils'
import type { FoodRecord, FoodRecordFormData } from '@/types/database'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Hook for fetching food records by date
export function useFoodRecordsByDate(date: string) {
  const { user } = useAuth()

  return useCachedData({
    key: CacheKeys.foodRecords(date),
    fetcher: async () => {
      if (!user?.access_token) {
        throw new Error('用户未登录')
      }

      return performanceMonitor.measureAsync('fetch_food_records', async () => {
        const response = await fetch(`/api/food-records?date=${date}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        const result: ApiResponse<FoodRecord[]> = await response.json()

        if (!response.ok) {
          throw new Error(result.error || '获取记录失败')
        }

        if (!result.success || !result.data) {
          throw new Error(result.error || '获取记录失败')
        }

        return result.data
      })
    },
    ttl: 5 * 60 * 1000, // 5分钟缓存
    enabled: !!user?.access_token,
    onError: (error) => {
      console.error('Error fetching food records:', error)
    }
  })
}

// Hook for managing food records with CRUD operations
export function useFoodRecordsManager(date: string) {
  const { user } = useAuth()
  const { data: records, loading, error, refresh } = useFoodRecordsByDate(date)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 创建记录
  const createRecord = useCallback(async (formData: FoodRecordFormData): Promise<FoodRecord> => {
    if (!user?.access_token) {
      throw new Error('用户未登录')
    }

    setIsSubmitting(true)

    try {
      return await performanceMonitor.measureAsync('create_food_record', async () => {
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

        if (!result.success || !result.data) {
          throw new Error(result.error || '创建记录失败')
        }

        // 失效缓存并刷新
        CacheInvalidation.invalidateFoodRecords(formData.record_date)
        await refresh()

        return result.data
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.access_token, refresh])

  // 更新记录
  const updateRecord = useCallback(async (id: string, formData: FoodRecordFormData): Promise<FoodRecord> => {
    if (!user?.access_token) {
      throw new Error('用户未登录')
    }

    setIsSubmitting(true)

    try {
      return await performanceMonitor.measureAsync('update_food_record', async () => {
        const response = await fetch(`/api/food-records/${id}`, {
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

        if (!result.success || !result.data) {
          throw new Error(result.error || '更新记录失败')
        }

        // 失效缓存并刷新
        CacheInvalidation.invalidateFoodRecords(formData.record_date)
        await refresh()

        return result.data
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.access_token, refresh])

  // 删除记录
  const deleteRecord = useCallback(async (record: FoodRecord): Promise<void> => {
    if (!user?.access_token) {
      throw new Error('用户未登录')
    }

    return performanceMonitor.measureAsync('delete_food_record', async () => {
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

      if (!result.success) {
        throw new Error(result.error || '删除记录失败')
      }

      // 失效缓存并刷新
      CacheInvalidation.invalidateFoodRecords(record.record_date)
      await refresh()
    })
  }, [user?.access_token, refresh])

  // 计算总卡路里
  const totalCalories = records ? records.reduce((sum, record) => sum + record.calories, 0) : 0

  return {
    records: records || [],
    loading,
    error,
    isSubmitting,
    totalCalories,
    createRecord,
    updateRecord,
    deleteRecord,
    refresh
  }
}

// Hook for record dates (calendar view)
export function useRecordDates(startDate: string, endDate: string) {
  const { user } = useAuth()

  return useCachedData({
    key: CacheKeys.recordDates(startDate, endDate),
    fetcher: async () => {
      if (!user?.access_token) {
        throw new Error('用户未登录')
      }

      return performanceMonitor.measureAsync('fetch_record_dates', async () => {
        const response = await fetch(`/api/food-records/dates?start=${startDate}&end=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        const result: ApiResponse<string[]> = await response.json()

        if (!response.ok) {
          throw new Error(result.error || '获取记录日期失败')
        }

        if (!result.success || !result.data) {
          throw new Error(result.error || '获取记录日期失败')
        }

        return result.data
      })
    },
    ttl: 10 * 60 * 1000, // 10分钟缓存
    enabled: !!user?.access_token,
    onError: (error) => {
      console.error('Error fetching record dates:', error)
    }
  })
}

// Hook for preloading data
export function useDataPreloader() {
  const { user } = useAuth()

  const preloadTodayRecords = useCallback(async () => {
    if (!user?.access_token) return

    const today = new Date().toISOString().split('T')[0]
    
    // 预加载今日记录
    try {
      await performanceMonitor.measureAsync('preload_today_records', async () => {
        const response = await fetch(`/api/food-records?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const result: ApiResponse<FoodRecord[]> = await response.json()
          if (result.success && result.data) {
            // 数据已经通过 fetch 缓存了
            console.log('Preloaded today records')
          }
        }
      })
    } catch (error) {
      console.warn('Failed to preload today records:', error)
    }
  }, [user?.access_token])

  const preloadRecentDates = useCallback(async () => {
    if (!user?.access_token) return

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 预加载最近30天的记录日期
    try {
      await performanceMonitor.measureAsync('preload_recent_dates', async () => {
        const response = await fetch(`/api/food-records/dates?start=${startDate}&end=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const result: ApiResponse<string[]> = await response.json()
          if (result.success && result.data) {
            console.log('Preloaded recent dates')
          }
        }
      })
    } catch (error) {
      console.warn('Failed to preload recent dates:', error)
    }
  }, [user?.access_token])

  return {
    preloadTodayRecords,
    preloadRecentDates
  }
}