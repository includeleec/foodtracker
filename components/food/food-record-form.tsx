'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  validateFoodRecordForm, 
  sanitizeFoodRecordData, 
  formatValidationErrors 
} from '@/lib/validation'
import { 
  type FoodRecordFormData, 
  type FoodRecord, 
  type MealType,
  type ValidationError 
} from '@/types/database'
import { cn } from '@/lib/utils'

interface FoodRecordFormProps {
  onSubmit: (data: FoodRecordFormData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<FoodRecord>
  isEditing?: boolean
  disabled?: boolean
  className?: string
}

interface FormState {
  meal_type: MealType | ''
  food_name: string
  weight: string
  calories: string
  image_url: string
  image_id: string
  record_date: string
}

interface FormErrors {
  [key: string]: string
}

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '中餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' },
] as const

export function FoodRecordForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  disabled = false,
  className
}: FoodRecordFormProps) {
  // 表单状态
  const [formData, setFormData] = useState<FormState>({
    meal_type: '',
    food_name: '',
    weight: '',
    calories: '',
    image_url: '',
    image_id: '',
    record_date: new Date().toISOString().split('T')[0] // 默认今天
  })

  // 错误状态
  const [errors, setErrors] = useState<FormErrors>({})
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 成功状态
  const [showSuccess, setShowSuccess] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        meal_type: initialData.meal_type || '',
        food_name: initialData.food_name || '',
        weight: initialData.weight?.toString() || '',
        calories: initialData.calories?.toString() || '',
        image_url: initialData.image_url || '',
        image_id: initialData.image_id || '',
        record_date: initialData.record_date || new Date().toISOString().split('T')[0]
      })
    }
  }, [initialData])

  // 处理输入变化
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // 隐藏成功消息
    if (showSuccess) {
      setShowSuccess(false)
    }
  }

  // 处理图片上传成功
  const handleImageUploadSuccess = (result: { id: string; url: string; filename: string }) => {
    setFormData(prev => ({
      ...prev,
      image_url: result.url,
      image_id: result.id
    }))
    
    // 清除图片相关错误
    if (errors.image_url) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.image_url
        return newErrors
      })
    }
  }

  // 处理图片删除成功
  const handleImageDeleteSuccess = () => {
    setFormData(prev => ({
      ...prev,
      image_url: '',
      image_id: ''
    }))
  }

  // 处理图片上传/删除错误
  const handleImageError = (error: string) => {
    setErrors(prev => ({ ...prev, image_url: error }))
  }

  // 验证表单
  const validateForm = (): boolean => {
    const sanitizedData = sanitizeFoodRecordData({
      meal_type: formData.meal_type as MealType,
      food_name: formData.food_name,
      weight: parseFloat(formData.weight),
      calories: parseFloat(formData.calories),
      record_date: formData.record_date,
      image_url: formData.image_url || undefined,
      image_id: formData.image_id || undefined
    })

    const validation = validateFoodRecordForm(sanitizedData)
    
    if (!validation.isValid) {
      setErrors(formatValidationErrors(validation.errors))
      return false
    }

    setErrors({})
    return true
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (disabled || isSubmitting) {
      return
    }

    // 验证表单
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const submitData: FoodRecordFormData = {
        meal_type: formData.meal_type as MealType,
        food_name: formData.food_name.trim(),
        weight: parseFloat(formData.weight),
        calories: parseFloat(formData.calories),
        record_date: formData.record_date,
        image_url: formData.image_url || undefined,
        image_id: formData.image_id || undefined
      }

      await onSubmit(submitData)
      
      // 显示成功消息
      setShowSuccess(true)
      
      // 如果不是编辑模式，重置表单
      if (!isEditing) {
        setFormData(prev => ({
          ...prev,
          meal_type: '',
          food_name: '',
          weight: '',
          calories: '',
          image_url: '',
          image_id: ''
        }))
      }

      // 3秒后隐藏成功消息
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失败，请重试'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      // 重置表单
      setFormData({
        meal_type: '',
        food_name: '',
        weight: '',
        calories: '',
        image_url: '',
        image_id: '',
        record_date: new Date().toISOString().split('T')[0]
      })
      setErrors({})
      setShowSuccess(false)
    }
  }

  const isFormDisabled = disabled || isSubmitting

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* 成功消息 */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {isEditing ? '更新成功！' : '添加成功！'}
        </div>
      )}

      {/* 提交错误 */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* 餐次类型选择 */}
      <div className="space-y-2">
        <Label htmlFor="meal_type" className="text-base font-medium">
          餐次类型 <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEAL_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('meal_type', option.value)}
              disabled={isFormDisabled}
              className={cn(
                'px-4 py-2 rounded-md border text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                formData.meal_type === option.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                isFormDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.meal_type && (
          <p className="text-sm text-red-600">{errors.meal_type}</p>
        )}
      </div>

      {/* 食物名称 */}
      <div className="space-y-2">
        <Label htmlFor="food_name" className="text-base font-medium">
          食物名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="food_name"
          type="text"
          value={formData.food_name}
          onChange={(e) => handleInputChange('food_name', e.target.value)}
          placeholder="请输入食物名称"
          disabled={isFormDisabled}
          className={errors.food_name ? 'border-red-500' : ''}
        />
        {errors.food_name && (
          <p className="text-sm text-red-600">{errors.food_name}</p>
        )}
      </div>

      {/* 重量和卡路里 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 重量 */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-base font-medium">
            重量 (克) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0.1"
            max="10000"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="0.0"
            disabled={isFormDisabled}
            className={errors.weight ? 'border-red-500' : ''}
          />
          {errors.weight && (
            <p className="text-sm text-red-600">{errors.weight}</p>
          )}
        </div>

        {/* 卡路里 */}
        <div className="space-y-2">
          <Label htmlFor="calories" className="text-base font-medium">
            卡路里 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="calories"
            type="number"
            step="1"
            min="1"
            max="10000"
            value={formData.calories}
            onChange={(e) => handleInputChange('calories', e.target.value)}
            placeholder="0"
            disabled={isFormDisabled}
            className={errors.calories ? 'border-red-500' : ''}
          />
          {errors.calories && (
            <p className="text-sm text-red-600">{errors.calories}</p>
          )}
        </div>
      </div>

      {/* 记录日期 */}
      <div className="space-y-2">
        <Label htmlFor="record_date" className="text-base font-medium">
          记录日期 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="record_date"
          type="date"
          value={formData.record_date}
          onChange={(e) => handleInputChange('record_date', e.target.value)}
          disabled={isFormDisabled}
          className={errors.record_date ? 'border-red-500' : ''}
        />
        {errors.record_date && (
          <p className="text-sm text-red-600">{errors.record_date}</p>
        )}
      </div>

      {/* 图片上传 */}
      <div className="space-y-2">
        <Label className="text-base font-medium">食物图片</Label>
        <ImageUpload
          onUploadSuccess={handleImageUploadSuccess}
          onUploadError={handleImageError}
          onDeleteSuccess={handleImageDeleteSuccess}
          onDeleteError={handleImageError}
          currentImageUrl={formData.image_url}
          currentImageId={formData.image_id}
          disabled={isFormDisabled}
          className="w-full"
        />
        {errors.image_url && (
          <p className="text-sm text-red-600">{errors.image_url}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isFormDisabled}
          className="w-full sm:w-auto"
        >
          {onCancel ? '取消' : '重置'}
        </Button>
        <Button
          type="submit"
          disabled={isFormDisabled}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">⏳</span>
              {isEditing ? '更新中...' : '添加中...'}
            </>
          ) : (
            isEditing ? '更新记录' : '添加记录'
          )}
        </Button>
      </div>
    </form>
  )
}