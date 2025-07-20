// 数据验证和表单验证工具函数

import type { 
  FoodRecordFormData, 
  ValidationError, 
  FormValidationResult,
  MealType 
} from '../types/database'

// 常量定义
export const VALIDATION_RULES = {
  FOOD_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  WEIGHT: {
    MIN: 0.1,
    MAX: 10000, // 10kg
  },
  CALORIES: {
    MIN: 1,
    MAX: 10000,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
} as const

// 基础验证函数
export function isValidEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email.trim())
}

export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH && 
         password.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH
}

export function isValidFoodName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length >= VALIDATION_RULES.FOOD_NAME.MIN_LENGTH && 
         trimmed.length <= VALIDATION_RULES.FOOD_NAME.MAX_LENGTH
}

export function isValidWeight(weight: number): boolean {
  return !isNaN(weight) && 
         weight >= VALIDATION_RULES.WEIGHT.MIN && 
         weight <= VALIDATION_RULES.WEIGHT.MAX
}

export function isValidCalories(calories: number): boolean {
  return !isNaN(calories) && 
         calories >= VALIDATION_RULES.CALORIES.MIN && 
         calories <= VALIDATION_RULES.CALORIES.MAX
}

export function isValidMealType(mealType: string): mealType is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

export function isValidImageFile(file: File): boolean {
  return (VALIDATION_RULES.IMAGE.ALLOWED_TYPES as readonly string[]).includes(file.type) &&
         file.size <= VALIDATION_RULES.IMAGE.MAX_SIZE
}

// 表单验证函数
export function validateFoodRecordForm(data: Partial<FoodRecordFormData>): FormValidationResult {
  const errors: ValidationError[] = []

  // 验证餐次类型
  if (!data.meal_type) {
    errors.push({ field: 'meal_type', message: '请选择餐次类型' })
  } else if (!isValidMealType(data.meal_type)) {
    errors.push({ field: 'meal_type', message: '无效的餐次类型' })
  }

  // 验证食物名称
  if (!data.food_name) {
    errors.push({ field: 'food_name', message: '请输入食物名称' })
  } else if (!isValidFoodName(data.food_name)) {
    errors.push({ 
      field: 'food_name', 
      message: `食物名称长度应在 ${VALIDATION_RULES.FOOD_NAME.MIN_LENGTH}-${VALIDATION_RULES.FOOD_NAME.MAX_LENGTH} 字符之间` 
    })
  }

  // 验证重量
  if (data.weight === undefined || data.weight === null) {
    errors.push({ field: 'weight', message: '请输入食物重量' })
  } else if (!isValidWeight(data.weight)) {
    errors.push({ 
      field: 'weight', 
      message: `重量应在 ${VALIDATION_RULES.WEIGHT.MIN}-${VALIDATION_RULES.WEIGHT.MAX}g 之间` 
    })
  }

  // 验证卡路里（可选字段）
  if (data.calories !== undefined && data.calories !== null && !isValidCalories(data.calories)) {
    errors.push({ 
      field: 'calories', 
      message: `卡路里应在 ${VALIDATION_RULES.CALORIES.MIN}-${VALIDATION_RULES.CALORIES.MAX} 之间` 
    })
  }

  // 验证日期
  if (!data.record_date) {
    errors.push({ field: 'record_date', message: '请选择记录日期' })
  } else if (!isValidDate(data.record_date)) {
    errors.push({ field: 'record_date', message: '无效的日期格式' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateAuthForm(email: string, password: string): FormValidationResult {
  const errors: ValidationError[] = []

  // 验证邮箱
  if (!email) {
    errors.push({ field: 'email', message: '请输入邮箱地址' })
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: '请输入有效的邮箱地址' })
  }

  // 验证密码
  if (!password) {
    errors.push({ field: 'password', message: '请输入密码' })
  } else if (!isValidPassword(password)) {
    errors.push({ 
      field: 'password', 
      message: `密码长度应在 ${VALIDATION_RULES.PASSWORD.MIN_LENGTH}-${VALIDATION_RULES.PASSWORD.MAX_LENGTH} 字符之间` 
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateImageUpload(file: File): FormValidationResult {
  const errors: ValidationError[] = []

  if (!file) {
    errors.push({ field: 'file', message: '请选择图片文件' })
  } else {
    if (!(VALIDATION_RULES.IMAGE.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      errors.push({ 
        field: 'file', 
        message: `只支持以下图片格式: ${VALIDATION_RULES.IMAGE.ALLOWED_TYPES.join(', ')}` 
      })
    }

    if (file.size > VALIDATION_RULES.IMAGE.MAX_SIZE) {
      errors.push({ 
        field: 'file', 
        message: `图片大小不能超过 ${VALIDATION_RULES.IMAGE.MAX_SIZE / (1024 * 1024)}MB` 
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 数据清理函数
export function sanitizeFoodRecordData(data: Partial<FoodRecordFormData>): Partial<FoodRecordFormData> {
  return {
    ...data,
    food_name: data.food_name?.trim(),
    weight: data.weight ? Number(data.weight) : undefined,
    calories: data.calories ? Number(data.calories) : undefined,
  }
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

// 错误消息格式化
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message
    return acc
  }, {} as Record<string, string>)
}

export function getFirstValidationError(errors: ValidationError[]): string | null {
  return errors.length > 0 ? errors[0].message : null
}