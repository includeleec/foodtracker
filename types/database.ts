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
          calories: number
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
          calories: number
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

// 表单数据类型
export interface FoodRecordFormData {
  meal_type: MealType
  food_name: string
  weight: number
  calories: number
  image_url?: string
  image_id?: string
  record_date: string
}