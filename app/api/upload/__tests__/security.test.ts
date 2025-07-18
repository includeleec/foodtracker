// 图片上传 API 安全测试

import { NextRequest } from 'next/server'
import { POST, OPTIONS } from '../route'

// Mock 依赖
jest.mock('@/lib/config', () => ({
  getConfig: jest.fn(() => ({
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceRoleKey: 'test-service-key'
    },
    cloudflare: {
      accountId: 'test-account-id',
      imagesToken: 'test-images-token'
    }
  }))
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

jest.mock('@/lib/security-utils', () => ({
  validateRequestOrigin: jest.fn(),
  checkRateLimit: jest.fn(),
  validateFileUpload: jest.fn(),
  validateImageMagicNumbers: jest.fn(),
  getSecurityHeaders: jest.fn(() => ({
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff'
  })),
  validateJwtFormat: jest.fn(() => true)
}))

// Mock fetch for Cloudflare Images API
global.fetch = jest.fn()

describe('Upload API Security', () => {
  const mockUser = { id: 'user-123' }
  const validToken = 'valid.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // 默认成功的 mock
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    })

    const securityUtils = require('@/lib/security-utils')
    securityUtils.validateRequestOrigin.mockReturnValue(true)
    securityUtils.checkRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetTime: Date.now() + 900000 })
    securityUtils.validateFileUpload.mockReturnValue({ valid: true, errors: [] })
    securityUtils.validateImageMagicNumbers.mockResolvedValue(true)

    // Mock successful Cloudflare response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        result: {
          id: 'test-image-id',
          filename: 'test.jpg',
          uploaded: '2024-01-01T00:00:00Z',
          requireSignedURLs: false,
          variants: []
        }
      })
    })
  })

  describe('Authentication Security', () => {
    it('should reject requests without authorization header', async () => {
      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing or invalid authorization header')
    })

    it('should reject requests with invalid JWT format', async () => {
      const { validateJwtFormat } = require('@/lib/security-utils')
      validateJwtFormat.mockReturnValue(false)

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': 'Bearer invalid-token' },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JWT format')
    })

    it('should reject requests with invalid authentication token', async () => {
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') })
        }
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': 'Bearer invalid-token' },
        body: formData
      })
      
      const response = await POST(request)
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

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 
          'authorization': `Bearer ${validToken}`,
          'origin': 'https://malicious-site.com'
        },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request origin')
    })
  })

  describe('Rate Limiting', () => {
    it('should reject requests when upload rate limit is exceeded', async () => {
      const { checkRateLimit } = require('@/lib/security-utils')
      checkRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetTime: Date.now() + 900000 })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Upload rate limit exceeded')
    })

    it('should use stricter rate limits for uploads', async () => {
      const { checkRateLimit } = require('@/lib/security-utils')

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      await POST(request)
      
      // 验证使用了更严格的上传限制
      expect(checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('upload:'),
        20, // 20 uploads per 15 minutes
        15 * 60 * 1000
      )
    })
  })

  describe('File Validation Security', () => {
    it('should reject files that fail basic validation', async () => {
      const { validateFileUpload } = require('@/lib/security-utils')
      validateFileUpload.mockReturnValue({ 
        valid: false, 
        errors: ['文件大小超过限制 (10MB)', '不支持的文件类型: application/exe'] 
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'malicious.exe', { type: 'application/exe' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('文件大小超过限制')
      expect(data.error).toContain('不支持的文件类型')
    })

    it('should reject files with invalid magic numbers', async () => {
      const { validateImageMagicNumbers } = require('@/lib/security-utils')
      validateImageMagicNumbers.mockResolvedValue(false)

      const formData = new FormData()
      formData.append('file', new File(['fake image content'], 'fake.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('文件不是有效的图片格式')
    })

    it('should reject requests without file', async () => {
      const formData = new FormData()
      // 不添加文件

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('未找到上传文件')
    })
  })

  describe('Cloudflare Integration Security', () => {
    it('should handle Cloudflare API errors securely', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve('Access denied')
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('图片上传失败')
    })

    it('should handle Cloudflare API failure response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          errors: ['Invalid file format'],
          messages: []
        })
      })

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('图片上传失败')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should include proper CORS headers in OPTIONS response', async () => {
      const response = await OPTIONS()
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })

  describe('Successful Upload Flow', () => {
    it('should successfully upload valid image with all security checks', async () => {
      const formData = new FormData()
      formData.append('file', new File(['test image content'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${validToken}` },
        body: formData
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id', 'test-image-id')
      expect(data.data).toHaveProperty('url')
      expect(data.data?.url).toContain('imagedelivery.net')
      expect(data.data).toHaveProperty('filename', 'test.jpg')
    })
  })
})