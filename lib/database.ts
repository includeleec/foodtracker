import { supabase } from './supabase'
import { apiCallWithRetry } from './retry-utils'
import { handleError, CustomError, ERROR_CODES } from './error-utils'
import type { FoodRecord, FoodRecordInsert, FoodRecordUpdate } from '../types/database'

// 食物记录数据库操作
export class FoodRecordService {
  // 获取指定日期的食物记录
  static async getFoodRecordsByDate(date: string): Promise<FoodRecord[]> {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase
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
  }

  // 创建新的食物记录
  static async createFoodRecord(record: FoodRecordInsert): Promise<FoodRecord> {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase
          .from('food_records')
          .insert([record])
          .select()
          .single()

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `创建食物记录失败: ${error.message}`, error)
        }

        return data
      })
    } catch (error) {
      const appError = handleError(error, 'createFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 更新食物记录
  static async updateFoodRecord(id: string, updates: FoodRecordUpdate): Promise<FoodRecord> {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase
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
    } catch (error) {
      const appError = handleError(error, 'updateFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 删除食物记录
  static async deleteFoodRecord(id: string): Promise<void> {
    try {
      await apiCallWithRetry(async () => {
        const { error } = await supabase
          .from('food_records')
          .delete()
          .eq('id', id)

        if (error) {
          throw new CustomError(ERROR_CODES.DATABASE_ERROR, `删除食物记录失败: ${error.message}`, error)
        }
      })
    } catch (error) {
      const appError = handleError(error, 'deleteFoodRecord')
      throw new CustomError(appError.code, appError.message, appError.details)
    }
  }

  // 获取用户在指定日期范围内有记录的日期
  static async getRecordDates(startDate: string, endDate: string): Promise<string[]> {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase
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
  }
}

// 认证相关操作
export class AuthService {
  // 获取当前用户
  static async getCurrentUser() {
    try {
      return await apiCallWithRetry(async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        
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
  static async signUp(email: string, password: string) {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase.auth.signUp({
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
  static async signIn(email: string, password: string) {
    try {
      return await apiCallWithRetry(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
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
  static async signOut() {
    try {
      await apiCallWithRetry(async () => {
        const { error } = await supabase.auth.signOut()

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