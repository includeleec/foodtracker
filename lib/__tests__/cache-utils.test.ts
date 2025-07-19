import { clientCache, getCachedData, CacheKeys, CacheInvalidation } from '../cache-utils'

// Mock Date.now for consistent testing
const mockDateNow = jest.fn()
Date.now = mockDateNow

describe('Cache Utils', () => {
  beforeEach(() => {
    clientCache.clear()
    mockDateNow.mockReturnValue(1000)
    jest.clearAllMocks()
  })

  describe('ClientCache', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'test' }
      clientCache.set('test-key', testData)
      
      const retrieved = clientCache.get('test-key')
      expect(retrieved).toEqual(testData)
    })

    it('should return null for non-existent keys', () => {
      const result = clientCache.get('non-existent')
      expect(result).toBeNull()
    })

    it('should expire data after TTL', () => {
      const testData = { id: 1, name: 'test' }
      clientCache.set('test-key', testData, 100) // 100ms TTL
      
      // Data should be available immediately
      expect(clientCache.get('test-key')).toEqual(testData)
      
      // Mock time passing beyond TTL
      mockDateNow.mockReturnValue(1200) // 200ms later
      
      // Data should be expired
      expect(clientCache.get('test-key')).toBeNull()
    })

    it('should delete specific keys', () => {
      clientCache.set('key1', 'value1')
      clientCache.set('key2', 'value2')
      
      expect(clientCache.delete('key1')).toBe(true)
      expect(clientCache.get('key1')).toBeNull()
      expect(clientCache.get('key2')).toBe('value2')
    })

    it('should clear all data', () => {
      clientCache.set('key1', 'value1')
      clientCache.set('key2', 'value2')
      
      clientCache.clear()
      
      expect(clientCache.get('key1')).toBeNull()
      expect(clientCache.get('key2')).toBeNull()
    })

    it('should provide cache statistics', () => {
      clientCache.set('key1', 'value1')
      clientCache.set('key2', 'value2')
      
      const stats = clientCache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('key1')
      expect(stats.keys).toContain('key2')
    })
  })

  describe('getCachedData', () => {
    it('should fetch and cache data on first call', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-data')
      
      const result = await getCachedData('test-key', mockFetcher)
      
      expect(result).toBe('fetched-data')
      expect(mockFetcher).toHaveBeenCalledTimes(1)
      
      // Verify data is cached
      expect(clientCache.get('test-key')).toBe('fetched-data')
    })

    it('should return cached data on subsequent calls', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-data')
      
      // First call
      await getCachedData('test-key', mockFetcher)
      
      // Second call
      const result = await getCachedData('test-key', mockFetcher)
      
      expect(result).toBe('fetched-data')
      expect(mockFetcher).toHaveBeenCalledTimes(1) // Should not fetch again
    })

    it('should handle fetch errors gracefully', async () => {
      const mockFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'))
      
      await expect(getCachedData('test-key', mockFetcher)).rejects.toThrow('Fetch failed')
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })

    it('should use custom TTL', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-data')
      const customTTL = 500
      
      await getCachedData('test-key', mockFetcher, customTTL)
      
      // Verify data is cached with custom TTL
      const cached = clientCache.get('test-key')
      expect(cached).toBe('fetched-data')
    })
  })

  describe('CacheKeys', () => {
    it('should generate consistent keys', () => {
      const date = '2024-01-01'
      const key1 = CacheKeys.foodRecords(date)
      const key2 = CacheKeys.foodRecords(date)
      
      expect(key1).toBe(key2)
      expect(key1).toBe('food_records_2024-01-01')
    })

    it('should generate different keys for different dates', () => {
      const key1 = CacheKeys.foodRecords('2024-01-01')
      const key2 = CacheKeys.foodRecords('2024-01-02')
      
      expect(key1).not.toBe(key2)
    })

    it('should generate record dates keys', () => {
      const key = CacheKeys.recordDates('2024-01-01', '2024-01-31')
      expect(key).toBe('record_dates_2024-01-01_2024-01-31')
    })
  })

  describe('CacheInvalidation', () => {
    beforeEach(() => {
      // Set up some cached data
      clientCache.set(CacheKeys.foodRecords('2024-01-01'), ['record1'])
      clientCache.set(CacheKeys.foodRecords('2024-01-02'), ['record2'])
      clientCache.set(CacheKeys.recordDates('2024-01-01', '2024-01-31'), ['2024-01-01'])
      clientCache.set('other_key', 'other_data')
    })

    it('should invalidate specific food records', () => {
      CacheInvalidation.invalidateFoodRecords('2024-01-01')
      
      expect(clientCache.get(CacheKeys.foodRecords('2024-01-01'))).toBeNull()
      expect(clientCache.get(CacheKeys.foodRecords('2024-01-02'))).toEqual(['record2'])
    })

    it('should invalidate record dates', () => {
      CacheInvalidation.invalidateRecordDates('2024-01-01', '2024-01-31')
      
      expect(clientCache.get(CacheKeys.recordDates('2024-01-01', '2024-01-31'))).toBeNull()
      expect(clientCache.get(CacheKeys.foodRecords('2024-01-01'))).toEqual(['record1'])
    })

    it('should invalidate all food records', () => {
      CacheInvalidation.invalidateAllFoodRecords()
      
      expect(clientCache.get(CacheKeys.foodRecords('2024-01-01'))).toBeNull()
      expect(clientCache.get(CacheKeys.foodRecords('2024-01-02'))).toBeNull()
      expect(clientCache.get(CacheKeys.recordDates('2024-01-01', '2024-01-31'))).toBeNull()
      expect(clientCache.get('other_key')).toBe('other_data') // Should not affect other keys
    })
  })
})