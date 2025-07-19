import type { FoodRecord, FoodRecordInsert, FoodRecordUpdate } from '../types/database'

// 客户端API服务
export class ClientFoodRecordService {
  private static getAuthToken(): string {
    // 从localStorage或sessionStorage获取token，或者从全局变量
    // 这里简化处理，实际应该从auth上下文获取
    const token = localStorage.getItem('auth_token') || ''
    return token
  }

  private static async makeRequest(url: string, options: RequestInit = {}) {
    const token = this.getAuthToken()
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = (errorData as any)?.error || '请求失败'
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // 获取指定日期的食物记录
  static async getFoodRecordsByDate(date: string): Promise<FoodRecord[]> {
    const response = await this.makeRequest(`/api/food-records?date=${encodeURIComponent(date)}`)
    return (response as any).data
  }

  // 创建新的食物记录
  static async createFoodRecord(record: FoodRecordInsert): Promise<FoodRecord> {
    const response = await this.makeRequest('/api/food-records', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    return (response as any).data
  }

  // 更新食物记录
  static async updateFoodRecord(id: string, updates: FoodRecordUpdate): Promise<FoodRecord> {
    const response = await this.makeRequest(`/api/food-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return (response as any).data
  }

  // 删除食物记录
  static async deleteFoodRecord(id: string): Promise<void> {
    await this.makeRequest(`/api/food-records/${id}`, {
      method: 'DELETE',
    })
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