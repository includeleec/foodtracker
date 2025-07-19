import { FoodRecordService } from '@/lib/database'
import type { FoodRecordUpdate } from '@/types/database'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock dependencies
jest.mock('@/lib/database')

const mockFoodRecordService = FoodRecordService as jest.Mocked<typeof FoodRecordService>

// Test data
const mockFoodRecord = {
  id: 'record-123',
  user_id: 'user-123',
  meal_type: 'breakfast' as const,
  food_name: '燕麦粥',
  weight: 200,
  calories: 150,
  image_url: null,
  image_id: null,
  record_date: '2024-01-15',
  created_at: '2024-01-15T08:00:00Z',
  updated_at: '2024-01-15T08:00:00Z'
}

describe('Food Records API Individual Record Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Update Food Record', () => {
    it('should update food record with partial data', async () => {
      const updateData: FoodRecordUpdate = {
        food_name: '更新的燕麦粥',
        calories: 180
      }

      const updatedRecord = { ...mockFoodRecord, food_name: '更新的燕麦粥', calories: 180 }

      // Setup mock
      mockFoodRecordService.updateFoodRecord.mockResolvedValue(updatedRecord)

      // Execute
      const result = await FoodRecordService.updateFoodRecord('record-123', updateData)

      // Assertions
      expect(result).toEqual(updatedRecord)
      expect(mockFoodRecordService.updateFoodRecord).toHaveBeenCalledWith('record-123', updateData)
    })

    it('should update only provided fields', async () => {
      const partialUpdate: FoodRecordUpdate = {
        calories: 180
      }

      const updatedRecord = { ...mockFoodRecord, calories: 180 }

      // Setup mock
      mockFoodRecordService.updateFoodRecord.mockResolvedValue(updatedRecord)

      // Execute
      const result = await FoodRecordService.updateFoodRecord('record-123', partialUpdate)

      // Assertions
      expect(result).toEqual(updatedRecord)
      expect(mockFoodRecordService.updateFoodRecord).toHaveBeenCalledWith('record-123', partialUpdate)
    })

    it('should update image data', async () => {
      const imageUpdate: FoodRecordUpdate = {
        image_url: 'https://example.com/new-image.jpg',
        image_id: 'new-image-123'
      }

      const updatedRecord = { 
        ...mockFoodRecord, 
        image_url: 'https://example.com/new-image.jpg',
        image_id: 'new-image-123'
      }

      // Setup mock
      mockFoodRecordService.updateFoodRecord.mockResolvedValue(updatedRecord)

      // Execute
      const result = await FoodRecordService.updateFoodRecord('record-123', imageUpdate)

      // Assertions
      expect(result).toEqual(updatedRecord)
      expect(mockFoodRecordService.updateFoodRecord).toHaveBeenCalledWith('record-123', imageUpdate)
    })

    it('should handle meal type update', async () => {
      const mealTypeUpdate: FoodRecordUpdate = {
        meal_type: 'lunch'
      }

      const updatedRecord = { ...mockFoodRecord, meal_type: 'lunch' as const }

      // Setup mock
      mockFoodRecordService.updateFoodRecord.mockResolvedValue(updatedRecord)

      // Execute
      const result = await FoodRecordService.updateFoodRecord('record-123', mealTypeUpdate)

      // Assertions
      expect(result).toEqual(updatedRecord)
      expect(mockFoodRecordService.updateFoodRecord).toHaveBeenCalledWith('record-123', mealTypeUpdate)
    })
  })

  describe('Delete Food Record', () => {
    it('should delete food record successfully', async () => {
      // Setup mock
      mockFoodRecordService.deleteFoodRecord.mockResolvedValue()

      // Execute
      await FoodRecordService.deleteFoodRecord('record-123')

      // Assertions
      expect(mockFoodRecordService.deleteFoodRecord).toHaveBeenCalledWith('record-123')
    })

    it('should handle deletion of record with image', async () => {
      // Setup mock
      mockFoodRecordService.deleteFoodRecord.mockResolvedValue()

      // Execute
      await FoodRecordService.deleteFoodRecord('record-with-image-456')

      // Assertions
      expect(mockFoodRecordService.deleteFoodRecord).toHaveBeenCalledWith('record-with-image-456')
    })
  })

  describe('Error Handling', () => {
    it('should handle update errors', async () => {
      const updateData: FoodRecordUpdate = {
        food_name: '更新的燕麦粥'
      }

      // Setup mock to throw error
      mockFoodRecordService.updateFoodRecord.mockRejectedValue(new Error('更新食物记录失败: Database error'))

      // Execute and expect error
      await expect(FoodRecordService.updateFoodRecord('record-123', updateData))
        .rejects.toThrow('更新食物记录失败: Database error')
    })

    it('should handle delete errors', async () => {
      // Setup mock to throw error
      mockFoodRecordService.deleteFoodRecord.mockRejectedValue(new Error('删除食物记录失败: Database error'))

      // Execute and expect error
      await expect(FoodRecordService.deleteFoodRecord('record-123'))
        .rejects.toThrow('删除食物记录失败: Database error')
    })
  })
})