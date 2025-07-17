import { supabase } from './supabase'
import type { FoodRecord, FoodRecordInsert, FoodRecordUpdate } from '../types/database'

// 食物记录数据库操作
export class FoodRecordService {
  // 获取指定日期的食物记录
  static async getFoodRecordsByDate(date: string): Promise<FoodRecord[]> {
    const { data, error } = await supabase
      .from('food_records')
      .select('*')
      .eq('record_date', date)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`获取食物记录失败: ${error.message}`)
    }

    return data || []
  }

  // 创建新的食物记录
  static async createFoodRecord(record: FoodRecordInsert): Promise<FoodRecord> {
    const { data, error } = await supabase
      .from('food_records')
      .insert([record])
      .select()
      .single()

    if (error) {
      throw new Error(`创建食物记录失败: ${error.message}`)
    }

    return data
  }

  // 更新食物记录
  static async updateFoodRecord(id: string, updates: FoodRecordUpdate): Promise<FoodRecord> {
    const { data, error } = await supabase
      .from('food_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`更新食物记录失败: ${error.message}`)
    }

    return data
  }

  // 删除食物记录
  static async deleteFoodRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('food_records')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`删除食物记录失败: ${error.message}`)
    }
  }

  // 获取用户在指定日期范围内有记录的日期
  static async getRecordDates(startDate: string, endDate: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('food_records')
      .select('record_date')
      .gte('record_date', startDate)
      .lte('record_date', endDate)

    if (error) {
      throw new Error(`获取记录日期失败: ${error.message}`)
    }

    // 去重并返回日期数组
    const uniqueDates = [...new Set(data.map(record => record.record_date))]
    return uniqueDates.sort()
  }
}

// 认证相关操作
export class AuthService {
  // 获取当前用户
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new Error(`获取用户信息失败: ${error.message}`)
    }

    return user
  }

  // 用户注册
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(`注册失败: ${error.message}`)
    }

    return data
  }

  // 用户登录
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(`登录失败: ${error.message}`)
    }

    return data
  }

  // 用户登出
  static async signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(`登出失败: ${error.message}`)
    }
  }
}