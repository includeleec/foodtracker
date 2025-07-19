"use client"

// 客户端缓存工具

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ClientCache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5分钟默认缓存时间

  // 设置缓存
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // 清理过期缓存
    this.cleanup()
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear()
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计信息
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 单例缓存实例
export const clientCache = new ClientCache()

// 缓存键生成器
export const CacheKeys = {
  // 食物记录相关
  foodRecords: (date: string) => `food_records_${date}`,
  recordDates: (startDate: string, endDate: string) => `record_dates_${startDate}_${endDate}`,
  
  // 用户相关
  userProfile: (userId: string) => `user_profile_${userId}`,
  
  // 图片相关
  imageUpload: (imageId: string) => `image_upload_${imageId}`,
}

// 带缓存的数据获取函数
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = clientCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // 缓存未命中，获取新数据
  try {
    const data = await fetcher()
    clientCache.set(key, data, ttl)
    return data
  } catch (error) {
    // 如果获取失败，尝试返回过期的缓存数据
    const expiredCache = clientCache.get<T>(key)
    if (expiredCache !== null) {
      console.warn('Using expired cache due to fetch error:', error)
      return expiredCache
    }
    throw error
  }
}

// 缓存失效工具
export const CacheInvalidation = {
  // 失效特定日期的食物记录缓存
  invalidateFoodRecords: (date: string) => {
    clientCache.delete(CacheKeys.foodRecords(date))
  },

  // 失效日期范围的记录日期缓存
  invalidateRecordDates: (startDate: string, endDate: string) => {
    clientCache.delete(CacheKeys.recordDates(startDate, endDate))
  },

  // 失效所有食物记录相关缓存
  invalidateAllFoodRecords: () => {
    const stats = clientCache.getStats()
    stats.keys.forEach(key => {
      if (key.startsWith('food_records_') || key.startsWith('record_dates_')) {
        clientCache.delete(key)
      }
    })
  },

  // 失效用户相关缓存
  invalidateUser: (userId: string) => {
    clientCache.delete(CacheKeys.userProfile(userId))
  }
}

// React Hook for cached data
import { useState, useEffect, useCallback } from 'react'

interface UseCachedDataOptions<T> {
  key: string
  fetcher: () => Promise<T>
  ttl?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useCachedData<T>({
  key,
  fetcher,
  ttl,
  enabled = true,
  onSuccess,
  onError
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await getCachedData(key, fetcher, ttl)
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [key, ttl, enabled]) // 移除 fetcher, onSuccess, onError 从依赖数组

  // 手动刷新数据
  const refresh = useCallback(async () => {
    clientCache.delete(key)
    await fetchData()
  }, [key, fetchData])

  // 初始加载
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh
  }
}

// 预加载数据
export async function preloadData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<void> {
  try {
    await getCachedData(key, fetcher, ttl)
  } catch (error) {
    console.warn('Preload failed for key:', key, error)
  }
}