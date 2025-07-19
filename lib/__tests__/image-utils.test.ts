import {
  validateImageFile,
  uploadImage,
  deleteImage,
  createImagePreview,
  revokeImagePreview,
  compressImage,
  ImageUploadError,
  SUPPORTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE
} from '../image-utils'

// Mock global objects
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
} as any

global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  upload: {
    addEventListener: jest.fn()
  },
  status: 200,
  responseText: JSON.stringify({ success: true, data: { id: 'test-id', url: 'test-url', filename: 'test.jpg' } }),
  timeout: 0
})) as any

global.fetch = jest.fn()

describe('image-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(() => validateImageFile(file)).not.toThrow()
    })

    it('should throw error for missing file', () => {
      expect(() => validateImageFile(null as any)).toThrow('请选择要上传的文件')
    })

    it('should throw error for unsupported file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      expect(() => validateImageFile(file)).toThrow('不支持的文件格式')
    })

    it('should throw error for file too large', () => {
      const largeContent = new Array(MAX_IMAGE_SIZE + 1).fill('a').join('')
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      expect(() => validateImageFile(file)).toThrow('文件大小超过限制')
    })

    it('should accept all supported image types', () => {
      SUPPORTED_IMAGE_TYPES.forEach(type => {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        expect(() => validateImageFile(file)).not.toThrow()
      })
    })
  })

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const authToken = 'test-token'

      // Mock successful XMLHttpRequest
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            // Simulate successful response
            mockXHR.status = 200
            mockXHR.responseText = JSON.stringify({
              success: true,
              data: { id: 'test-id', url: 'test-url', filename: 'test.jpg' }
            })
            callback()
          }
        }),
        upload: {
          addEventListener: jest.fn()
        },
        status: 200,
        responseText: '',
        timeout: 0
      }

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any

      const result = await uploadImage(file, authToken)

      expect(result).toEqual({
        id: 'test-id',
        url: 'test-url',
        filename: 'test.jpg'
      })

      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/api/upload')
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token')
      expect(mockXHR.send).toHaveBeenCalled()
    })

    it('should handle upload progress', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const authToken = 'test-token'
      const onProgress = jest.fn()

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            mockXHR.status = 200
            mockXHR.responseText = JSON.stringify({
              success: true,
              data: { id: 'test-id', url: 'test-url', filename: 'test.jpg' }
            })
            callback()
          }
        }),
        upload: {
          addEventListener: jest.fn((event, callback) => {
            if (event === 'progress') {
              // Simulate progress event
              callback({ lengthComputable: true, loaded: 50, total: 100 })
            }
          })
        },
        status: 200,
        responseText: '',
        timeout: 0
      }

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any

      await uploadImage(file, authToken, onProgress)

      expect(onProgress).toHaveBeenCalledWith(50)
    })

    it('should handle upload error', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const authToken = 'test-token'

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'error') {
            callback()
          }
        }),
        upload: {
          addEventListener: jest.fn()
        },
        status: 0,
        responseText: '',
        timeout: 0
      }

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any

      await expect(uploadImage(file, authToken)).rejects.toThrow('网络错误，请检查网络连接')
    })

    it('should handle server error response', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const authToken = 'test-token'

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            mockXHR.status = 500
            mockXHR.statusText = 'Internal Server Error'
            callback()
          }
        }),
        upload: {
          addEventListener: jest.fn()
        },
        status: 500,
        statusText: 'Internal Server Error',
        responseText: '',
        timeout: 0
      }

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any

      await expect(uploadImage(file, authToken)).rejects.toThrow('上传失败: 500 Internal Server Error')
    })
  })

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true })
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(deleteImage('test-id', 'test-token')).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledWith('/api/upload/test-id', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle delete error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(deleteImage('test-id', 'test-token')).rejects.toThrow('删除失败: 500 Internal Server Error')
    })

    it('should handle API error response', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Image not found' })
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(deleteImage('test-id', 'test-token')).rejects.toThrow('Image not found')
    })
  })

  describe('createImagePreview and revokeImagePreview', () => {
    it('should create and revoke image preview', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const previewUrl = createImagePreview(file)
      expect(previewUrl).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)

      revokeImagePreview(previewUrl)
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(previewUrl)
    })
  })

  describe('compressImage', () => {
    it('should be defined as a function', () => {
      expect(typeof compressImage).toBe('function')
    })

    // Note: Canvas compression tests are skipped in Jest environment
    // due to lack of canvas support. These would be tested in browser environment.
    it.skip('should compress image successfully', async () => {
      // This test would run in a real browser environment
      // where canvas is available
    })

    it.skip('should handle image load error', async () => {
      // This test would run in a real browser environment
      // where canvas is available
    })

    it.skip('should handle canvas toBlob failure', async () => {
      // This test would run in a real browser environment
      // where canvas is available
    })
  })

  describe('ImageUploadError', () => {
    it('should create error with message and code', () => {
      const error = new ImageUploadError('Test error', 'TEST_CODE')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('ImageUploadError')
    })

    it('should create error with message only', () => {
      const error = new ImageUploadError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.code).toBeUndefined()
      expect(error.name).toBe('ImageUploadError')
    })
  })
})