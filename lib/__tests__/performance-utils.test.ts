import { performanceMonitor, getPerformanceRecommendations, getMemoryUsage, getNetworkInfo } from '../performance-utils'

// Mock performance API
const mockPerformanceNow = jest.fn()
const mockPerformanceObserver = jest.fn()

Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    }
  },
  writable: true
})

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    }
  },
  writable: true
})

describe('Performance Utils', () => {
  beforeEach(() => {
    mockPerformanceNow.mockReturnValue(1000)
    jest.clearAllMocks()
    // Clear performance monitor metrics
    performanceMonitor['metrics'] = []
  })

  describe('PerformanceMonitor', () => {
    it('should record metrics', () => {
      performanceMonitor.recordMetric('test_metric', 100, 'timing')
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.test_metric).toBe(100)
      expect(stats.counts.test_metric).toBe(1)
    })

    it('should calculate averages correctly', () => {
      performanceMonitor.recordMetric('test_metric', 100, 'timing')
      performanceMonitor.recordMetric('test_metric', 200, 'timing')
      performanceMonitor.recordMetric('test_metric', 300, 'timing')
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.test_metric).toBe(200) // (100 + 200 + 300) / 3
      expect(stats.counts.test_metric).toBe(3)
    })

    it('should measure async function execution time', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('result')
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1500) // End time
      
      const result = await performanceMonitor.measureAsync('async_test', mockAsyncFn)
      
      expect(result).toBe('result')
      expect(mockAsyncFn).toHaveBeenCalledTimes(1)
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.async_test).toBe(500) // 1500 - 1000
    })

    it('should measure sync function execution time', () => {
      const mockSyncFn = jest.fn().mockReturnValue('result')
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1200) // End time
      
      const result = performanceMonitor.measure('sync_test', mockSyncFn)
      
      expect(result).toBe('result')
      expect(mockSyncFn).toHaveBeenCalledTimes(1)
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.sync_test).toBe(200) // 1200 - 1000
    })

    it('should handle async function errors', async () => {
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Test error'))
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1300) // End time
      
      await expect(performanceMonitor.measureAsync('async_error_test', mockAsyncFn))
        .rejects.toThrow('Test error')
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.async_error_test_error).toBe(300) // 1300 - 1000
    })

    it('should handle sync function errors', () => {
      const mockSyncFn = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1100) // End time
      
      expect(() => performanceMonitor.measure('sync_error_test', mockSyncFn))
        .toThrow('Test error')
      
      const stats = performanceMonitor.getStats()
      expect(stats.averages.sync_error_test_error).toBe(100) // 1100 - 1000
    })

    it('should get web vitals', () => {
      performanceMonitor.recordMetric('largest_contentful_paint', 2000, 'timing')
      performanceMonitor.recordMetric('first_input_delay', 50, 'timing')
      performanceMonitor.recordMetric('first_paint', 1000, 'timing')
      performanceMonitor.recordMetric('page_load_time', 3000, 'timing')
      
      const webVitals = performanceMonitor.getWebVitals()
      
      expect(webVitals.lcp).toBe(2000)
      expect(webVitals.fid).toBe(50)
      expect(webVitals.fcp).toBe(1000)
      expect(webVitals.ttfb).toBe(3000)
    })

    it('should export performance data', () => {
      performanceMonitor.recordMetric('test_metric', 100, 'timing')
      
      const exportedData = performanceMonitor.exportData()
      const parsedData = JSON.parse(exportedData)
      
      expect(parsedData).toHaveProperty('timestamp')
      expect(parsedData).toHaveProperty('stats')
      expect(parsedData).toHaveProperty('webVitals')
      expect(parsedData).toHaveProperty('userAgent')
      expect(parsedData.stats.averages.test_metric).toBe(100)
    })
  })

  describe('getPerformanceRecommendations', () => {
    it('should recommend page load optimization', () => {
      const stats = {
        averages: { page_load_time: 4000 },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toContain('页面加载时间过长，考虑优化资源加载')
    })

    it('should recommend API optimization', () => {
      const stats = {
        averages: { api_request_time: 1500 },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toContain('API 请求时间过长，考虑添加缓存或优化查询')
    })

    it('should recommend image optimization', () => {
      const stats = {
        averages: { image_load_time: 2500 },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toContain('图片加载时间过长，考虑压缩图片或使用懒加载')
    })

    it('should recommend LCP optimization', () => {
      const stats = {
        averages: { largest_contentful_paint: 3000 },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toContain('LCP 指标较差，考虑优化关键资源加载')
    })

    it('should recommend FID optimization', () => {
      const stats = {
        averages: { first_input_delay: 150 },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toContain('FID 指标较差，考虑减少主线程阻塞')
    })

    it('should return empty array for good performance', () => {
      const stats = {
        averages: {
          page_load_time: 1000,
          api_request_time: 500,
          image_load_time: 800,
          largest_contentful_paint: 1500,
          first_input_delay: 50
        },
        counts: {},
        recent: []
      }
      
      const recommendations = getPerformanceRecommendations(stats)
      expect(recommendations).toHaveLength(0)
    })
  })

  describe('getMemoryUsage', () => {
    it('should return memory usage information', () => {
      const memoryUsage = getMemoryUsage()
      
      expect(memoryUsage).toEqual({
        used: 50, // 50MB
        total: 100, // 100MB
        percentage: 50 // 50%
      })
    })

    it('should return null when memory API is not available', () => {
      const originalPerformance = global.performance
      
      // Remove memory property
      Object.defineProperty(global, 'performance', {
        value: {},
        writable: true
      })
      
      const memoryUsage = getMemoryUsage()
      expect(memoryUsage).toBeNull()
      
      // Restore original performance object
      Object.defineProperty(global, 'performance', {
        value: originalPerformance,
        writable: true
      })
    })
  })

  describe('getNetworkInfo', () => {
    it('should return network information', () => {
      const networkInfo = getNetworkInfo()
      
      expect(networkInfo).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      })
    })

    it('should return null when connection API is not available', () => {
      const originalNavigator = global.navigator
      
      // Remove connection property
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      })
      
      const networkInfo = getNetworkInfo()
      expect(networkInfo).toBeNull()
      
      // Restore original navigator object
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true
      })
    })
  })
})