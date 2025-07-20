// 验证函数单元测试

import { describe, it, expect } from '@jest/globals'
import {
  isValidEmail,
  isValidPassword,
  isValidFoodName,
  isValidWeight,
  isValidCalories,
  isValidMealType,
  isValidDate,
  isValidImageFile,
  validateFoodRecordForm,
  validateAuthForm,
  validateImageUpload,
  sanitizeFoodRecordData,
  sanitizeString,
  formatValidationErrors,
  getFirstValidationError,
  VALIDATION_RULES
} from '../validation'
import type { FoodRecordFormData } from '../../types/database'

describe('基础验证函数', () => {
  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
    })

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test space@example.com')).toBe(false)
    })

    it('应该处理带空格的邮箱', () => {
      expect(isValidEmail(' test@example.com ')).toBe(true)
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })

  describe('isValidPassword', () => {
    it('应该验证有效的密码', () => {
      expect(isValidPassword('123456')).toBe(true)
      expect(isValidPassword('password123')).toBe(true)
      expect(isValidPassword('a'.repeat(128))).toBe(true)
    })

    it('应该拒绝无效的密码', () => {
      expect(isValidPassword('')).toBe(false)
      expect(isValidPassword('12345')).toBe(false) // 太短
      expect(isValidPassword('a'.repeat(129))).toBe(false) // 太长
    })
  })

  describe('isValidFoodName', () => {
    it('应该验证有效的食物名称', () => {
      expect(isValidFoodName('苹果')).toBe(true)
      expect(isValidFoodName('鸡胸肉')).toBe(true)
      expect(isValidFoodName('a'.repeat(255))).toBe(true)
    })

    it('应该拒绝无效的食物名称', () => {
      expect(isValidFoodName('')).toBe(false)
      expect(isValidFoodName('   ')).toBe(false)
      expect(isValidFoodName('a'.repeat(256))).toBe(false)
    })
  })

  describe('isValidWeight', () => {
    it('应该验证有效的重量', () => {
      expect(isValidWeight(0.1)).toBe(true)
      expect(isValidWeight(100)).toBe(true)
      expect(isValidWeight(10000)).toBe(true)
    })

    it('应该拒绝无效的重量', () => {
      expect(isValidWeight(0)).toBe(false)
      expect(isValidWeight(-1)).toBe(false)
      expect(isValidWeight(10001)).toBe(false)
      expect(isValidWeight(NaN)).toBe(false)
    })
  })

  describe('isValidCalories', () => {
    it('应该验证有效的卡路里', () => {
      expect(isValidCalories(1)).toBe(true)
      expect(isValidCalories(500)).toBe(true)
      expect(isValidCalories(10000)).toBe(true)
    })

    it('应该拒绝无效的卡路里', () => {
      expect(isValidCalories(0)).toBe(false)
      expect(isValidCalories(-1)).toBe(false)
      expect(isValidCalories(10001)).toBe(false)
      expect(isValidCalories(NaN)).toBe(false)
    })
  })

  describe('isValidMealType', () => {
    it('应该验证有效的餐次类型', () => {
      expect(isValidMealType('breakfast')).toBe(true)
      expect(isValidMealType('lunch')).toBe(true)
      expect(isValidMealType('dinner')).toBe(true)
      expect(isValidMealType('snack')).toBe(true)
    })

    it('应该拒绝无效的餐次类型', () => {
      expect(isValidMealType('')).toBe(false)
      expect(isValidMealType('invalid')).toBe(false)
      expect(isValidMealType('BREAKFAST')).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it('应该验证有效的日期', () => {
      expect(isValidDate('2024-01-01')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)
    })

    it('应该拒绝无效的日期', () => {
      expect(isValidDate('')).toBe(false)
      expect(isValidDate('2024-13-01')).toBe(false)
      expect(isValidDate('2024-01-32')).toBe(false)
      expect(isValidDate('24-01-01')).toBe(false)
      expect(isValidDate('2024/01/01')).toBe(false)
    })
  })

  describe('isValidImageFile', () => {
    it('应该验证有效的图片文件', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB
      expect(isValidImageFile(validFile)).toBe(true)
    })

    it('应该拒绝无效的图片文件', () => {
      const invalidTypeFile = new File([''], 'test.txt', { type: 'text/plain' })
      expect(isValidImageFile(invalidTypeFile)).toBe(false)

      const oversizeFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(oversizeFile, 'size', { value: 11 * 1024 * 1024 }) // 11MB
      expect(isValidImageFile(oversizeFile)).toBe(false)
    })
  })
})

describe('表单验证函数', () => {
  describe('validateFoodRecordForm', () => {
    const validData: FoodRecordFormData = {
      meal_type: 'breakfast',
      food_name: '苹果',
      weight: 100,
      calories: 52,
      record_date: '2024-01-01'
    }

    it('应该验证有效的表单数据', () => {
      const result = validateFoodRecordForm(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测缺失的必填字段', () => {
      const result = validateFoodRecordForm({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4) // 4个必填字段（卡路里现在是可选的）
    })

    it('应该验证餐次类型', () => {
      const invalidData = { ...validData, meal_type: 'invalid' as any }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'meal_type')).toBe(true)
    })

    it('应该验证食物名称', () => {
      const invalidData = { ...validData, food_name: '' }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'food_name')).toBe(true)
    })

    it('应该验证重量', () => {
      const invalidData = { ...validData, weight: -1 }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'weight')).toBe(true)
    })

    it('应该验证卡路里', () => {
      const invalidData = { ...validData, calories: 0 }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'calories')).toBe(true)
    })

    it('应该验证日期', () => {
      const invalidData = { ...validData, record_date: 'invalid-date' }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'record_date')).toBe(true)
    })

    it('应该允许卡路里为可选字段', () => {
      const dataWithoutCalories = { ...validData }
      delete dataWithoutCalories.calories
      const result = validateFoodRecordForm(dataWithoutCalories)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该验证提供的卡路里值', () => {
      const invalidData = { ...validData, calories: -1 }
      const result = validateFoodRecordForm(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'calories')).toBe(true)
    })
  })

  describe('validateAuthForm', () => {
    it('应该验证有效的认证表单', () => {
      const result = validateAuthForm('test@example.com', 'password123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效的邮箱', () => {
      const result = validateAuthForm('invalid-email', 'password123')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'email')).toBe(true)
    })

    it('应该检测无效的密码', () => {
      const result = validateAuthForm('test@example.com', '123')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'password')).toBe(true)
    })

    it('应该检测空字段', () => {
      const result = validateAuthForm('', '')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('validateImageUpload', () => {
    it('应该验证有效的图片上传', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 })
      
      const result = validateImageUpload(validFile)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效的文件类型', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      const result = validateImageUpload(invalidFile)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'file')).toBe(true)
    })

    it('应该检测文件过大', () => {
      const oversizeFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(oversizeFile, 'size', { value: 11 * 1024 * 1024 })
      
      const result = validateImageUpload(oversizeFile)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'file')).toBe(true)
    })
  })
})

describe('数据清理函数', () => {
  describe('sanitizeFoodRecordData', () => {
    it('应该清理食物记录数据', () => {
      const dirtyData = {
        food_name: '  苹果  ',
        weight: '100.5',
        calories: '52.7'
      } as any

      const cleaned = sanitizeFoodRecordData(dirtyData)
      expect(cleaned.food_name).toBe('苹果')
      expect(cleaned.weight).toBe(100.5)
      expect(cleaned.calories).toBe(52.7)
    })

    it('应该处理未定义的值', () => {
      const data = { food_name: 'test' }
      const cleaned = sanitizeFoodRecordData(data)
      expect(cleaned.weight).toBeUndefined()
      expect(cleaned.calories).toBeUndefined()
    })
  })

  describe('sanitizeString', () => {
    it('应该清理字符串', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world')
      expect(sanitizeString('test\n\nstring')).toBe('test string')
    })
  })
})

describe('错误处理函数', () => {
  describe('formatValidationErrors', () => {
    it('应该格式化验证错误', () => {
      const errors = [
        { field: 'email', message: '邮箱无效' },
        { field: 'password', message: '密码太短' }
      ]

      const formatted = formatValidationErrors(errors)
      expect(formatted).toEqual({
        email: '邮箱无效',
        password: '密码太短'
      })
    })
  })

  describe('getFirstValidationError', () => {
    it('应该返回第一个错误消息', () => {
      const errors = [
        { field: 'email', message: '邮箱无效' },
        { field: 'password', message: '密码太短' }
      ]

      expect(getFirstValidationError(errors)).toBe('邮箱无效')
      expect(getFirstValidationError([])).toBeNull()
    })
  })
})

describe('验证规则常量', () => {
  it('应该定义正确的验证规则', () => {
    expect(VALIDATION_RULES.FOOD_NAME.MIN_LENGTH).toBe(1)
    expect(VALIDATION_RULES.FOOD_NAME.MAX_LENGTH).toBe(255)
    expect(VALIDATION_RULES.WEIGHT.MIN).toBe(0.1)
    expect(VALIDATION_RULES.WEIGHT.MAX).toBe(10000)
    expect(VALIDATION_RULES.CALORIES.MIN).toBe(1)
    expect(VALIDATION_RULES.CALORIES.MAX).toBe(10000)
    expect(VALIDATION_RULES.PASSWORD.MIN_LENGTH).toBe(6)
    expect(VALIDATION_RULES.IMAGE.MAX_SIZE).toBe(10 * 1024 * 1024)
    expect(VALIDATION_RULES.IMAGE.ALLOWED_TYPES).toContain('image/jpeg')
  })
})