import { apiCallWithRetry } from './retry-utils'
import { handleError, CustomError, ERROR_CODES } from './error-utils'
import { getServerCachedData, ServerCacheKeys, ServerCacheInvalidation } from './server-cache'
import type { FoodRecord, FoodRecordInsert, FoodRecordUpdate } from '../types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// 分页查询选项
interface PaginationOptions {
  page?: number
  pageSize?: number
  orderBy?: string
  ascending?: boolean
}

// 查询结果包含分页信息
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 食物记录数据库操作
export class FoodRecordService {
  readonly supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  // 获取指定日期的食物记录（带缓存）
  async getFoodRecordsByDate(date: string): Promise<FoodRecord[]> {
    return getServerCachedData(
      ServerCacheKeys.foodRecords(date),
      async () => {
        try {
          return await apiCallWithRetry(async () => {
            const { data, error } = await this.supabase
              .from('food_records')
              .select('*')
              .eq('record_date', date)
              .order('created_at', { ascending: true })

            if (error) {
              throw new CustomError(ERROR_CODES.DATABASE_ERROR, `获取食物记录失败: ${error.message}`, error)
            }

            return data || []
          })
        } catch (error) {
          const appError = handleError(error, 'getFoodRecordsByDate')
          throw new CustomError(appError.code, appError.message, appError.details)
        }
      },
      5 * 60 * 1000 // 5分钟缓存
    )
  }

  // 分页获取食物记录
  async getFoodRecordsPaginated(
    options: PaginationOptions & { startDate?: string; endDate?: string } = {}
  ): Promise<PaginatedResult<FoodRecord>> {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'created_at',
      ascending = false,
      startDate,
      endDate
    } = options

    try {
      return await apiCallWithRetry(async () => {
        let query = this.supabase
          .from('food_records')
          .select('*', { count: 'exact' })

        // 日期范围过滤
        if (startDate) {
          query = query.gte('record_date', startDate)
        }
        if (endDate) {
          query = query.lte('record_date', endDate)
        }

        // 排序和分页
        query = query
          .order(orderBy, { ascending })
          .range((page - 1) * pageSize, page * pageSize - 1)

        const { data, error, count } = await query

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `获取食物记录失败: ${error.message}`, error)
        }

        const total = count || 0
        const hasMore = page * pageSize < total

        return {
          data: data || [],
          total,
          page,
          pageSize,
          hasMore
        }
      })
    } catch (error) {
      const appError = handleError(error, 'getFoodRecordsPaginated')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 创建新的食物记录（带缓存失效）
  async createFoodRecord(record: FoodRecordInsert): Promise<FoodRecord> {
    try {
      const result = await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('food_records')
          .insert([record])
          .select()
          .single()

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `创建食物记录失败: ${error.message}`, error)
        }

        return data
      })

      // 失效相关缓存
      ServerCacheInvalidation.invalidateFoodRecords(record.record_date)
      ServerCacheInvalidation.invalidateAllFoodRecords()

      return result
    } catch (error) {
      const appError = handleError(error, 'createFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 更新食物记录（带缓存失效）
  async updateFoodRecord(id: string, updates: FoodRecordUpdate): Promise<FoodRecord> {
    try {
      const result = await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('food_records')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `更新食物记录失败: ${error.message}`, error)
        }

        return data
      })

      // 失效相关缓存
      if (updates.record_date) {
        ServerCacheInvalidation.invalidateFoodRecords(updates.record_date)
      }
      ServerCacheInvalidation.invalidateAllFoodRecords()

      return result
    } catch (error) {
      const appError = handleError(error, 'updateFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 删除食物记录（带缓存失效）
  async deleteFoodRecord(id: string, recordDate?: string): Promise<void> {
    try {
      await apiCallWithRetry(async () => {
        const { error } = await this.supabase
          .from('food_records')
          .delete()
          .eq('id', id)

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `删除食物记录失败: ${error.message}`, error)
        }
      })

      // 失效相关缓存
      if (recordDate) {
        ServerCacheInvalidation.invalidateFoodRecords(recordDate)
      }
      ServerCacheInvalidation.invalidateAllFoodRecords()
    } catch (error) {
      const appError = handleError(error, 'deleteFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 获取用户在指定日期范围内有记录的日期（带缓存）
  async getRecordDates(startDate: string, endDate: string): Promise<string[]> {
    return getServerCachedData(
      ServerCacheKeys.recordDates(startDate, endDate),
      async () => {
        try {
          return await apiCallWithRetry(async () => {
            const { data, error } = await this.supabase
              .from('food_records')
              .select('record_date')
              .gte('record_date', startDate)
              .lte('record_date', endDate)

            if (error) {
              throw new CustomError(ERROR_CODES.DATABASE_ERROR, `获取记录日期失败: ${error.message}`, error)
            }

            // 去重并返回日期数组
            const uniqueDates = [...new Set(data.map(record => record.record_date))]
            return uniqueDates.sort()
          })
        } catch (error) {
          const appError = handleError(error, 'getRecordDates')
          throw new CustomError(appError.code, appError.message, appError.details)
        }
      },
      10 * 60 * 1000 // 10分钟缓存
    )
  }

  // 批量获取多个日期的记录（优化版）
  async getFoodRecordsByDateRange(
    startDate: string,
    endDate: string,
    options: { groupByDate?: boolean } = {}
  ): Promise<FoodRecord[] | Record<string, FoodRecord[]>> {
    try {
      const records = await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('food_records')
          .select('*')
          .gte('record_date', startDate)
          .lte('record_date', endDate)
          .order('record_date', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `获取食物记录失败: ${error.message}`, error)
        }

        return data || []
      })

      if (options.groupByDate) {
        // 按日期分组
        const grouped: Record<string, FoodRecord[]> = {}
        records.forEach(record => {
          if (!grouped[record.record_date]) {
            grouped[record.record_date] = []
          }
          grouped[record.record_date].push(record)
        })
        return grouped
      }

      return records
    } catch (error) {
      const appError = handleError(error, 'getFoodRecordsByDateRange')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 获取统计信息（优化查询）
  async getRecordStats(startDate: string, endDate: string): Promise<{
    totalRecords: number
    totalCalories: number
    avgCaloriesPerDay: number
    recordDays: number
  }> {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase
          .from('food_records')
          .select('calories, record_date')
          .gte('record_date', startDate)
          .lte('record_date', endDate)

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `获取统计信息失败: ${error.message}`, error)
        }

        const records = data || []
        const totalRecords = records.length
        const totalCalories = records.reduce((sum, record) => sum + record.calories, 0)
        const uniqueDates = new Set(records.map(record => record.record_date))
        const recordDays = uniqueDates.size
        const avgCaloriesPerDay = recordDays > 0 ? totalCalories / recordDays : 0

        return {
          totalRecords,
          totalCalories,
          avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
          recordDays
        }
      })
    } catch (error) {
      const appError = handleError(error, 'getRecordStats')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }
}

// 认证相关操作
export class AuthService {
  readonly supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  // 获取当前用户
  async getCurrentUser() {
    try {
      return await apiCallWithRetry(async () => {
        const { data: { user }, error } = await this.supabase.auth.getUser()
        
        if (error) {
          throw new CustomError(ERROR_CODES.AUTH_ERROR, `获取用户信息失败: ${error.message}`, error)
        }

        return user
      })
    } catch (error) {
      const appError = handleError(error, 'getCurrentUser')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 用户注册
  async signUp(email: string, password: string) {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          throw new CustomError(ERROR_CODES.AUTH_ERROR, `注册失败: ${error.message}`, error)
        }

        return data
      })
    } catch (error) {
      const appError = handleError(error, 'signUp')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 用户登录
  async signIn(email: string, password: string) {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new CustomError(ERROR_CODES.AUTH_ERROR, `登录失败: ${error.message}`, error)
        }

        return data
      })
    } catch (error) {
      const appError = handleError(error, 'signIn')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 用户登出
  async signOut() {
    try {
      await apiCallWithRetry(async () => {
        const { error } = await this.supabase.auth.signOut()

        if (error) {
          throw new CustomError(ERROR_CODES.AUTH_ERROR, `登出失败: ${error.message}`, error)
        }
      })
    } catch (error) {
      const appError = handleError(error, 'signOut')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }
}