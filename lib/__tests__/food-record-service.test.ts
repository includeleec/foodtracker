/**
 * @jest-environment node
 */
import { FoodRecordService } from '../database'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('FoodRecordService', () => {
  let service: FoodRecordService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockSupabase)
    service = new FoodRecordService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createRecord', () => {
    it('should create a food record successfully', async () => {
      const mockRecord = {
        id: '1',
        user_id: 'user1',
        meal_type: 'breakfast',
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockRecord,
        error: null
      })

      const recordData = {
        meal_type: 'breakfast' as const,
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15',
        image_url: null,
        image_id: null
      }

      const result = await service.createRecord('user1', recordData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRecord)
      expect(mockSupabase.from).toHaveBeenCalledWith('food_records')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const recordData = {
        meal_type: 'breakfast' as const,
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15',
        image_url: null,
        image_id: null
      }

      const result = await service.createRecord('user1', recordData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('getRecordsByDate', () => {
    it('should fetch records for a specific date', async () => {
      const mockRecords = [
        {
          id: '1',
          meal_type: 'breakfast',
          food_name: '燕麦粥',
          weight: 200,
          calories: 150
        }
      ]

      mockSupabase.single.mockResolvedValue({
        data: mockRecords,
        error: null
      })

      const result = await service.getRecordsByDate('user1', '2024-01-15')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRecords)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('record_date', '2024-01-15')
    })
  })

  describe('updateRecord', () => {
    it('should update a record successfully', async () => {
      const mockUpdatedRecord = {
        id: '1',
        meal_type: 'lunch',
        food_name: '更新的食物',
        weight: 300,
        calories: 200
      }

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedRecord,
        error: null
      })

      const updateData = {
        meal_type: 'lunch' as const,
        food_name: '更新的食物',
        weight: 300,
        calories: 200
      }

      const result = await service.updateRecord('user1', '1', updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedRecord)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user1')
    })
  })

  describe('deleteRecord', () => {
    it('should delete a record successfully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await service.deleteRecord('user1', '1')

      expect(result.success).toBe(true)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user1')
    })
  })

  describe('getCalendarData', () => {
    it('should fetch calendar data for a month', async () => {
      const mockCalendarData = [
        {
          record_date: '2024-01-15',
          record_count: 3,
          total_calories: 1500
        }
      ]

      mockSupabase.single.mockResolvedValue({
        data: mockCalendarData,
        error: null
      })

      const result = await service.getCalendarData('user1', 2024, 1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCalendarData)
    })
  })
})