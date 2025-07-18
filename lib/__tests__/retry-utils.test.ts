import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { 
  withRetry, 
  fetchWithRetry, 
  apiCallWithRetry, 
  delay, 
  calculateDelay,
  DEFAULT_RETRY_CONFIG 
} from '../retry-utils'

// Mock fetch and Response
global.fetch = jest.fn()
global.Response = jest.fn().mockImplementation((body, init) => ({
  ok: init?.status >= 200 && init?.status < 300,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  text: () => Promise.resolve(body),
  json: () => Promise.resolve(JSON.parse(body))
}))

describe('retry-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('delay', () => {
    it('应该等待指定的毫秒数', async () => {
      const delayPromise = delay(1000)
      
      // 快进时间
      jest.advanceTimersByTime(1000)
      
      await expect(delayPromise).resolves.toBeUndefined()
    })
  })

  describe('calculateDelay', () => {
    it('应该计算线性延迟', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, backoff: 'linear' as const }
      
      expect(calculateDelay(1, config)).toBe(1000)
      expect(calculateDelay(2, config)).toBe(2000)
      expect(calculateDelay(3, config)).toBe(3000)
    })

    it('应该计算指数延迟', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, backoff: 'exponential' as const }
      
      expect(calculateDelay(1, config)).toBe(1000)
      expect(calculateDelay(2, config)).toBe(2000)
      expect(calculateDelay(3, config)).toBe(4000)
    })
  })

  describe('withRetry', () => {
    it('应该在第一次尝试成功时返回结果', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      
      const result = await withRetry(mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该在失败后重试', async () => {
      const networkError = new Error('Network error')
      ;(networkError as any).name = 'NetworkError'
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success')
      
      const retryPromise = withRetry(mockFn, { maxAttempts: 2 })
      
      // 快进延迟时间
      setTimeout(() => jest.advanceTimersByTime(1000), 0)
      
      const result = await retryPromise
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('应该在达到最大重试次数后抛出错误', async () => {
      const error = new Error('Persistent error')
      const mockFn = jest.fn().mockRejectedValue(error)
      
      const retryPromise = withRetry(mockFn, { maxAttempts: 2 })
      
      // 快进所有延迟时间
      jest.advanceTimersByTime(10000)
      
      await expect(retryPromise).rejects.toThrow('Persistent error')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('应该根据重试条件决定是否重试', async () => {
      const error = new Error('Non-retryable error')
      const mockFn = jest.fn().mockRejectedValue(error)
      
      const retryPromise = withRetry(mockFn, {
        maxAttempts: 3,
        retryCondition: () => false
      })
      
      await expect(retryPromise).rejects.toThrow('Non-retryable error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetchWithRetry', () => {
    it('应该成功获取数据', async () => {
      const mockResponse = new Response('success', { status: 200 })
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)
      
      const result = await fetchWithRetry('/api/test')
      
      expect(result).toBe(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/test', undefined)
    })

    it('应该在HTTP错误时重试', async () => {
      const errorResponse = new Response('Server Error', { status: 500 })
      const successResponse = new Response('success', { status: 200 })
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValue(successResponse)
      
      const retryPromise = fetchWithRetry('/api/test', undefined, { maxAttempts: 2 })
      
      // 快进延迟时间
      jest.advanceTimersByTime(1000)
      
      const result = await retryPromise
      
      expect(result).toBe(successResponse)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('应该在网络错误时重试', async () => {
      const networkError = new Error('Network error')
      ;(networkError as any).name = 'NetworkError'
      
      const successResponse = new Response('success', { status: 200 })
      
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(successResponse)
      
      const retryPromise = fetchWithRetry('/api/test', undefined, { maxAttempts: 2 })
      
      // 快进延迟时间
      jest.advanceTimersByTime(1000)
      
      const result = await retryPromise
      
      expect(result).toBe(successResponse)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('apiCallWithRetry', () => {
    it('应该重试API调用', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue('success')
      
      const retryPromise = apiCallWithRetry(mockApiCall)
      
      // 快进延迟时间
      jest.advanceTimersByTime(1000)
      
      const result = await retryPromise
      
      expect(result).toBe('success')
      expect(mockApiCall).toHaveBeenCalledTimes(2)
    })

    it('应该重试限流错误', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue('success')
      
      const retryPromise = apiCallWithRetry(mockApiCall)
      
      // 快进延迟时间
      jest.advanceTimersByTime(1000)
      
      const result = await retryPromise
      
      expect(result).toBe('success')
      expect(mockApiCall).toHaveBeenCalledTimes(2)
    })

    it('应该不重试客户端错误', async () => {
      const clientError = { status: 400 }
      const mockApiCall = jest.fn().mockRejectedValue(clientError)
      
      await expect(apiCallWithRetry(mockApiCall)).rejects.toEqual(clientError)
      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })
  })
})