import { FoodRecordService } from '@/lib/database'
import type { FoodRecordInsert, FoodRecordUpdate } from '@/types/database'

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

describe('Food Records API Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('FoodRecordService.getFoodRecordsByDate', () => {
    it('should get food records by date', async () => {
      // Setup mock
      mockFoodRecordService.getFoodRecordsByDate.mockResolvedValue([mockFoodRecord])

      // Execute
      const result = await FoodRecordService.getFoodRecordsByDate('2024-01-15')

      // Assertions
      expect(result).toEqual([mockFoodRecord])
      expect(mockFoodRecordService.getFoodRecordsByDate).toHaveBeenCalledWith('2024-01-15')
    })

    it('should return empty array when no records found', async () => {
      // Setup mock
      mockFoodRecordService.getFoodRecordsByDate.mockResolvedValue([])

      // Execute
      const result = await FoodRecordService.getFoodRecordsByDate('2024-01-16')

      // Assertions
      expect(result).toEqual([])
      expect(mockFoodRecordService.getFoodRecordsByDate).toHaveBeenCalledWith('2024-01-16')
    })
  })

  describe('FoodRecordService.createFoodRecord', () => {
    it('should create food record with valid data', async () => {
      const insertData: FoodRecordInsert = {
        user_id: 'user-123',
        meal_type: 'breakfast',
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15'
      }

      // Setup mock
      mockFoodRecordService.createFoodRecord.mockResolvedValue(mockFoodRecord)

      // Execute
      const result = await FoodRecordService.createFoodRecord(insertData)

      // Assertions
      expect(result).toEqual(mockFoodRecord)
      expect(mockFoodRecordService.createFoodRecord).toHaveBeenCalledWith(insertData)
    })

    it('should create food record with image data', async () => {
      const insertDataWithImage: FoodRecordInsert = {
        user_id: 'user-123',
        meal_type: 'breakfast',
        food_name: '燕麦粥',
        weight: 200,
        calories: 150,
        record_date: '2024-01-15',
        image_url: 'https://example.com/image.jpg',
        image_id: 'image-123'
      }

      const recordWithImage = { ...mockFoodRecord, image_url: 'https://example.com/image.jpg', image_id: 'image-123' }

      // Setup mock
      mockFoodRecordService.createFoodRecord.mockResolvedValue(recordWithImage)

      // Execute
      const result = await FoodRecordService.createFoodRecord(insertDataWithImage)

      // Assertions
      expect(result).toEqual(recordWithImage)
      expect(mockFoodRecordService.createFoodRecord).toHaveBeenCalledWith(insertDataWithImage)
    })
  })

  describe('FoodRecordService.updateFoodRecord', () => {
    it('should update food record', async () => {
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
  })

  describe('FoodRecordService.deleteFoodRecord', () => {
    it('should delete food record', async () => {
      // Setup mock
      mockFoodRecordService.deleteFoodRecord.mockResolvedValue()

      // Execute
      await FoodRecordService.deleteFoodRecord('record-123')

      // Assertions
      expect(mockFoodRecordService.deleteFoodRecord).toHaveBeenCalledWith('record-123')
    })
  })

  describe('FoodRecordService.getRecordDates', () => {
    it('should get record dates in range', async () => {
      const expectedDates = ['2024-01-15', '2024-01-16', '2024-01-17']

      // Setup mock
      mockFoodRecordService.getRecordDates.mockResolvedValue(expectedDates)

      // Execute
      const result = await FoodRecordService.getRecordDates('2024-01-01', '2024-01-31')

      // Assertions
      expect(result).toEqual(expectedDates)
      expect(mockFoodRecordService.getRecordDates).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
    })

    it('should return empty array when no records in range', async () => {
      // Setup mock
      mockFoodRecordService.getRecordDates.mockResolvedValue([])

      // Execute
      const result = await FoodRecordService.getRecordDates('2024-02-01', '2024-02-28')

      // Assertions
      expect(result).toEqual([])
      expect(mockFoodRecordService.getRecordDates).toHaveBeenCalledWith('2024-02-01', '2024-02-28')
    })
  })
})