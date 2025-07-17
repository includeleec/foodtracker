/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { DELETE } from '../route'
import { getConfig } from '@/lib/config'

// Mock dependencies
jest.mock('@/lib/config')
jest.mock('@supabase/supabase-js')

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

describe('/api/upload/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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

  describe('DELETE /api/upload/[id]', () => {
    it('should delete image successfully', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock Cloudflare Images API response
      const mockCloudflareResponse = {
        success: true
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponse)
      })

      // Create request
      const request = new NextRequest('http://localhost:3000/api/upload/image-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'image-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify Cloudflare API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/accounts/test-account-id/images/v1/image-123',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-images-token'
          }
        }
      )
    })

    it('should reject request without authorization', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload/image-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'image-123' } })
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

      const request = new NextRequest('http://localhost:3000/api/upload/image-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'image-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid authentication token')
    })

    it('should reject request without image ID', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/upload/', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('缺少图片ID')
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
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Image not found')
      })

      const request = new NextRequest('http://localhost:3000/api/upload/image-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'image-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('图片删除失败')
    })

    it('should handle Cloudflare API success false response', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock Cloudflare API response with success: false
      const mockCloudflareResponse = {
        success: false,
        errors: ['Image not found']
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCloudflareResponse)
      })

      const request = new NextRequest('http://localhost:3000/api/upload/image-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request, { params: { id: 'image-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('图片删除失败')
    })
  })
})