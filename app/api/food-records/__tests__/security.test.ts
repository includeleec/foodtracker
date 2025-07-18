/**
 * @jest-environment jsdom
 */

// Mock Next.js server components for testing
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    constructor(public url: string, public init?: any) {}
    headers = new Map()
  }
})

// 食物记录 API 安全测试

import { NextRequest } from 'next/server'
import { GET, POST, OPTIONS } from '../route'

// Mock 依赖
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

jest.mock('@/lib/database', () => ({
  FoodRecordService: {
    getFoodRecordsByDate: jest.fn(),
    createFoodRecord: jest.fn()
  }
}))

jest.mock('@/lib/security-utils', () => ({
  validateRequestOrigin: jest.fn(),
  checkRateLimit: jest.fn(),
  sanitizeInput: jest.fn((input) => input),
  validateSqlInput: jest.fn(() => true),
  getSecurityHeaders: jest.fn(() => ({
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff'
  })),
  validateJwtFormat: jest.fn(() => true)
}))

describe('Food Records API Security', () => {
  const mockUser = { id: 'user-123' }
  const validToken = 'valid.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 默认成功的 mock
    const { createServerSupabaseClient } = require('@/lib/supabase-server')
    createServerSupabaseClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    })

    const securityUtils = require('@/lib/security-utils')
    securityUtils.validateRequestOrigin.mockReturnValue(true)
    securityUtils.checkRateLimit.mockReturnValue({ allowed: true, remaining: 99, resetTime: Date.now() + 900000 })
  })

  describe('Authentication Security', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing or invalid authorization header')
    })

    it('should reject requests with invalid JWT format', async () => {
      const { validateJwtFormat } = require('@/lib/security-utils')
      validateJwtFormat.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01', {
        headers: { 'authorization': 'Bearer invalid-token' }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JWT format')
    })

    it('should reject requests with invalid authentication token', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      createServerSupabaseClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01', {
        headers: { 'authorization': 'Bearer invalid-token' }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid authentication token')
    })
  })

  describe('Origin Validation', () => {
    it('should reject requests from invalid origins', async () => {
      const { validateRequestOrigin } = require('@/lib/security-utils')
      validateRequestOrigin.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01', {
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'origin': 'https://malicious-site.com'
        }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request origin')
    })
  })

  describe('Rate Limiting', () => {
    it('should reject requests when rate limit is exceeded', async () => {
      const { checkRateLimit } = require('@/lib/security-utils')
      checkRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetTime: Date.now() + 900000 })

      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01', {
        headers: { 'authorization': `Bearer ${validToken}` }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Rate limit exceeded')
    })
  })

  describe('Input Validation', () => {
    it('should reject SQL injection attempts in date parameter', async () => {
      const { validateSqlInput } = require('@/lib/security-utils')
      validateSqlInput.mockReturnValue(false)

      const request = new NextRequest("http://localhost:3000/api/food-records?date=2024-01-01'; DROP TABLE users; --", {
        headers: { 'authorization': `Bearer ${validToken}` }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('日期参数包含非法字符')
    })

    it('should reject invalid date formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/food-records?date=invalid-date', {
        headers: { 'authorization': `Bearer ${validToken}` }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('日期格式无效')
    })

    it('should reject dates outside allowed range', async () => {
      const request = new NextRequest('http://localhost:3000/api/food-records?date=1999-01-01', {
        headers: { 'authorization': `Bearer ${validToken}` }
      })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('日期超出允许范围')
    })
  })

  describe('POST Request Security', () => {
    const validPostData = {
      meal_type: 'breakfast',
      food_name: '苹果',
      weight: 100,
      calories: 52,
      record_date: '2024-01-01'
    }

    it('should reject POST requests with SQL injection in food name', async () => {
      const { validateSqlInput } = require('@/lib/security-utils')
      validateSqlInput.mockImplementation((input) => !input.includes('DROP'))

      const maliciousData = {
        ...validPostData,
        food_name: "苹果'; DROP TABLE food_records; --"
      }

      const request = new NextRequest('http://localhost:3000/api/food-records', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(maliciousData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('输入数据包含非法字符')
    })

    it('should reject POST requests with invalid meal type', async () => {
      const invalidData = {
        ...validPostData,
        meal_type: 'invalid_meal'
      }

      const request = new NextRequest('http://localhost:3000/api/food-records', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('无效的餐次类型')
    })

    it('should reject POST requests with invalid numeric values', async () => {
      const invalidData = {
        ...validPostData,
        weight: -10,
        calories: 20000
      }

      const request = new NextRequest('http://localhost:3000/api/food-records', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('重量必须是0-10000之间的数字')
    })

    it('should reject POST requests with invalid image URL', async () => {
      const invalidData = {
        ...validPostData,
        image_url: 'https://malicious-site.com/image.jpg'
      }

      const request = new NextRequest('http://localhost:3000/api/food-records', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('无效的图片URL')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const { FoodRecordService } = require('@/lib/database')
      FoodRecordService.getFoodRecordsByDate.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/food-records?date=2024-01-01', {
        headers: { 'authorization': `Bearer ${validToken}` }
      })
      
      const response = await GET(request)
      
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should include proper CORS headers in OPTIONS response', async () => {
      const response = await OPTIONS()
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET, POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize input data before processing', async () => {
      const { sanitizeInput } = require('@/lib/security-utils')
      const { FoodRecordService } = require('@/lib/database')
      
      sanitizeInput.mockImplementation((input) => input.trim().replace(/<[^>]*>/g, ''))
      FoodRecordService.createFoodRecord.mockResolvedValue({ id: 'new-record-id' })

      const dataWithHtml = {
        meal_type: 'breakfast',
        food_name: '<script>alert("XSS")</script>苹果',
        weight: 100,
        calories: 52,
        record_date: '2024-01-01'
      }

      const request = new NextRequest('http://localhost:3000/api/food-records', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(dataWithHtml)
      })
      
      await POST(request)
      
      expect(sanitizeInput).toHaveBeenCalledWith('<script>alert("XSS")</script>苹果')
    })
  })
})