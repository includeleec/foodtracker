/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST, OPTIONS } from '../route'
import { getConfig } from '@/lib/config'

// Mock dependencies
jest.mock('@/lib/config')
jest.mock('@supabase/supabase-js')
const mockValidateJwtFormat = jest.fn()
jest.mock('@/lib/security-utils', () => ({
  validateRequestOrigin: jest.fn(() => true),
  checkRateLimit: jest.fn(() => ({ allowed: true, remaining: 10 })),
  validateFileUpload: jest.fn(() => ({ valid: true })),
  validateImageMagicNumbers: jest.fn(() => true),
  getSecurityHeaders: jest.fn(() => ({})),
  validateJwtFormat: mockValidateJwtFormat
}))

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

// Mock fetch globally
global.fetch = jest.fn()

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  }
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default JWT validation mock - returns true for valid tokens
    mockValidateJwtFormat.mockImplementation((token: string) => {
      return token.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    })
    
    // Default config mock
    mockGetConfig.mockReturnValue({
      supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key',
        serviceRoleKey: 'test-service-key'
      },
      cloudflare: {
        accountId: 'test-account-id',
        imagesToken: 'test-images-token'
      }
    })
  })

  describe('POST /api/upload', () => {
    it('should upload image successfully', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock Cloudflare Images API response
      const mockCloudflareResponse = {
        success: true,
        result: {
          id: 'image-123',
          filename: 'test.jpg',
          uploaded: '2024-01-01T00:00:00Z',
          requireSignedURLs: false,
          variants: []
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponse)
      })

      // Create test file
      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)

      // Create request with proper origin
      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      // Mock request.formData()
      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        id: 'image-123',
        url: 'https://imagedelivery.net/test-account-id/image-123/public',
        filename: 'test.jpg'
      })
    })

    it('should reject request without authorization', async () => {
      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing or invalid authorization header')
    })

    it('should reject invalid user token', async () => {
      // Mock invalid user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid.jwt.token',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JWT format')
    })

    it('should reject request without file', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      const formData = new FormData()

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('未找到上传文件')
    })

    it('should reject unsupported file type', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', testFile)

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('不支持的文件类型')
    })

    it('should reject file that is too large', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Create a large file (11MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const testFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('文件大小超过限制')
    })

    it('should handle Cloudflare API error', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock Cloudflare API error
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error')
      })

      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)

      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'Origin': 'https://food.tinycard.xyz'
        },
        body: formData
      })

      jest.spyOn(request, 'formData').mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('图片上传失败')
    })
  })

  describe('OPTIONS /api/upload', () => {
    it('should handle CORS preflight request', async () => {
      const request = new NextRequest('https://food.tinycard.xyz/api/upload', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://food.tinycard.xyz'
        }
      })

      const response = await OPTIONS(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    })
  })
})