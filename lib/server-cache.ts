// 服务端缓存工具 - 用于服务器端代码

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ServerCache {
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
}

// 单例缓存实例
export const serverCache = new ServerCache()

// 缓存键生成器
export const ServerCacheKeys = {
  // 食物记录相关
  foodRecords: (date: string) => `food_records_${date}`,
  recordDates: (startDate: string, endDate: string) => `record_dates_${startDate}_${endDate}`,
  
  // 用户相关
  userProfile: (userId: string) => `user_profile_${userId}`,
  
  // 图片相关
  imageUpload: (imageId: string) => `image_upload_${imageId}`,
}

// 带缓存的数据获取函数
export async function getServerCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = serverCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // 缓存未命中，获取新数据
  try {
    const data = await fetcher()
    serverCache.set(key, data, ttl)
    return data
  } catch (error) {
    // 如果获取失败，尝试返回过期的缓存数据
    const expiredCache = serverCache.get<T>(key)
    if (expiredCache !== null) {
      console.warn('Using expired cache due to fetch error:', error)
      return expiredCache
    }
    throw error
  }
}

// 缓存失效工具
export const ServerCacheInvalidation = {
  // 失效特定日期的食物记录缓存
  invalidateFoodRecords: (date: string) => {
    serverCache.delete(ServerCacheKeys.foodRecords(date))
  },

  // 失效日期范围的记录日期缓存
  invalidateRecordDates: (startDate: string, endDate: string) => {
    serverCache.delete(ServerCacheKeys.recordDates(startDate, endDate))
  },

  // 失效所有食物记录相关缓存
  invalidateAllFoodRecords: () => {
    serverCache.clear()
  },

  // 失效用户相关缓存
  invalidateUser: (userId: string) => {
    serverCache.delete(ServerCacheKeys.userProfile(userId))
  }
}