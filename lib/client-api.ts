import type { FoodRecord, FoodRecordInsert, FoodRecordUpdate } from '../types/database'
import { supabase } from './supabase'

// 客户端API服务
export class ClientFoodRecordService {
  private static async getAuthToken(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || ''
    } catch (error) {
      console.error('Error getting auth token:', error)
      return ''
    }
  }

  private static async makeRequest(url: string, options: RequestInit = {}) {
    const token = await this.getAuthToken()
    
    if (!token) {
      console.error('客户端API：缺少认证信息', { url, method: options.method || 'GET' })
      throw new Error('缺少认证信息')
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('客户端API：解析错误响应失败', { 
            url, 
            status: response.status, 
            statusText: response.statusText,
            parseError 
          })
        }
        
        const errorMessage = errorData?.error || `请求失败 (${response.status}: ${response.statusText})`
        console.error('客户端API：请求失败', {
          url,
          method: options.method || 'GET', 
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          timestamp: new Date().toISOString()
        })
        
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && !error.message.includes('请求失败')) {
        console.error('客户端API：网络或其他错误', {
          url,
          method: options.method || 'GET',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
      throw error
    }
  }

  // 获取指定日期的食物记录
  static async getFoodRecordsByDate(date: string): Promise<FoodRecord[]> {
    const response = await this.makeRequest(`/api/food-records?date=${encodeURIComponent(date)}`)
    return (response as any).data
  }

  // 创建新的食物记录
  static async createFoodRecord(record: FoodRecordInsert): Promise<FoodRecord> {
    console.log('客户端API：开始创建食物记录', { 
      foodName: record.food_name, 
      mealType: record.meal_type,
      weight: record.weight 
    })
    
    const response = await this.makeRequest('/api/food-records', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    
    const result = (response as any).data
    console.log('客户端API：创建食物记录成功', { id: result.id, foodName: result.food_name })
    return result
  }

  // 更新食物记录
  static async updateFoodRecord(id: string, updates: FoodRecordUpdate): Promise<FoodRecord> {
    console.log('客户端API：开始更新食物记录', { 
      id, 
      updates: { 
        ...updates, 
        hasImage: !!updates.image_url 
      } 
    })
    
    const response = await this.makeRequest(`/api/food-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    
    const result = (response as any).data
    console.log('客户端API：更新食物记录成功', { id: result.id, foodName: result.food_name })
    return result
  }

  // 删除食物记录
  static async deleteFoodRecord(id: string): Promise<void> {
    console.log('客户端API：开始删除食物记录', { id })
    
    await this.makeRequest(`/api/food-records/${id}`, {
      method: 'DELETE',
    })
    
    console.log('客户端API：删除食物记录成功', { id })
  }

  // 获取记录日期
  static async getRecordDates(startDate: string, endDate: string): Promise<string[]> {
    const response = await this.makeRequest(`/api/food-records/dates?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`)
    return (response as any).data
  }

  // 获取日期范围内的记录
  static async getFoodRecordsByDateRange(
    startDate: string,
    endDate: string,
    options: { groupByDate?: boolean } = {}
  ): Promise<FoodRecord[] | Record<string, FoodRecord[]>> {
    const response = await this.makeRequest(`/api/food-records?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}${options.groupByDate ? '&groupByDate=true' : ''}`)
    return (response as any).data
  }
}