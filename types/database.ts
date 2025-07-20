// Supabase 数据库类型定义

export interface Database {
  public: {
    Tables: {
      food_records: {
        Row: {
          id: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          weight: number
          calories: number | null
          image_url: string | null
          image_id: string | null
          record_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          weight: number
          calories?: number | null
          image_url?: string | null
          image_id?: string | null
          record_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name?: string
          weight?: number
          calories?: number
          image_url?: string | null
          image_id?: string | null
          record_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 便捷类型别名
export type FoodRecord = Database['public']['Tables']['food_records']['Row']
export type FoodRecordInsert = Database['public']['Tables']['food_records']['Insert']
export type FoodRecordUpdate = Database['public']['Tables']['food_records']['Update']

// 餐次类型
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

// 每日记录汇总
export interface DailyRecords {
  date: string
  breakfast: FoodRecord[]
  lunch: FoodRecord[]
  dinner: FoodRecord[]
  snack: FoodRecord[]
  totalCalories: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 用户类型定义
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// 表单数据类型
export interface FoodRecordFormData {
  meal_type: MealType
  food_name: string
  weight: number
  calories?: number
  image_url?: string
  image_id?: string
  record_date: string
}

// 表单验证错误类型
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// 图片上传相关类型
export interface ImageUploadResponse {
  url: string
  id: string
}

export interface ImageUploadRequest {
  file: File
}

// API 错误类型
export interface ApiError {
  message: string
  code: string
  details?: any
}

// 日历相关类型
export interface CalendarDay {
  date: string
  hasRecords: boolean
  totalCalories?: number
}

export interface MonthData {
  year: number
  month: number
  days: CalendarDay[]
}

// 统计数据类型
export interface NutritionStats {
  totalCalories: number
  mealBreakdown: {
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
  averageCaloriesPerMeal: number
}