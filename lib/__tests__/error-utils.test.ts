import {
  CustomError,
  ERROR_CODES,
  ERROR_MESSAGES,
  categorizeError,
  handleError,
  getUserFriendlyMessage,
  isRetryableError,
  reportError
} from '../error-utils'

describe('error-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('CustomError', () => {
    it('应该创建自定义错误', () => {
      const error = new CustomError('TEST_CODE', 'Test message', { detail: 'test' })
      
      expect(error.name).toBe('CustomError')
      expect(error.code).toBe('TEST_CODE')
      expect(error.message).toBe('Test message')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('categorizeError', () => {
    it('应该分类网络错误', () => {
      const networkError = new Error('Network failed')
      networkError.name = 'NetworkError'
      
      const result = categorizeError(networkError)
      
      expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR])
    })

    it('应该分类HTTP状态码错误', () => {
      const httpError = { status: 401, message: 'Unauthorized' }
      
      const result = categorizeError(httpError)
      
      expect(result.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED])
    })

    it('应该分类服务器错误', () => {
      const serverError = { status: 500, message: 'Internal Server Error' }
      
      const result = categorizeError(serverError)
      
      expect(result.code).toBe(ERROR_CODES.SERVER_ERROR)
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR])
    })

    it('应该分类验证错误', () => {
      const validationError = { status: 422, message: 'Validation failed' }
      
      const result = categorizeError(validationError)
      
      expect(result.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR])
    })

    it('应该分类自定义错误', () => {
      const customError = new CustomError('CUSTOM_CODE', 'Custom message')
      
      const result = categorizeError(customError)
      
      expect(result.code).toBe('CUSTOM_CODE')
      expect(result.message).toBe('Custom message')
    })

    it('应该分类未知错误', () => {
      const unknownError = new Error('Unknown error')
      
      const result = categorizeError(unknownError)
      
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('Unknown error')
    })

    it('应该处理没有消息的错误', () => {
      const error = {}
      
      const result = categorizeError(error)
      
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR])
    })
  })

  describe('handleError', () => {
    it('应该处理错误并记录日志', () => {
      const error = new Error('Test error')
      
      const result = handleError(error, 'test-context')
      
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('Test error')
      expect(console.error).toHaveBeenCalledWith(
        'Error in test-context:',
        expect.objectContaining({
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Test error'
        })
      )
    })

    it('应该处理没有上下文的错误', () => {
      const error = new Error('Test error')
      
      const result = handleError(error)
      
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(console.error).toHaveBeenCalledWith(
        'Error in unknown context:',
        expect.any(Object)
      )
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('应该返回用户友好的错误消息', () => {
      const networkError = new Error('Network failed')
      networkError.name = 'NetworkError'
      
      const message = getUserFriendlyMessage(networkError)
      
      expect(message).toBe(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR])
    })

    it('应该返回自定义错误的消息', () => {
      const customError = new CustomError('CUSTOM_CODE', 'Custom user message')
      
      const message = getUserFriendlyMessage(customError)
      
      expect(message).toBe('Custom user message')
    })
  })

  describe('isRetryableError', () => {
    it('应该识别可重试的网络错误', () => {
      const networkError = new Error('Network failed')
      networkError.name = 'NetworkError'
      
      expect(isRetryableError(networkError)).toBe(true)
    })

    it('应该识别可重试的服务器错误', () => {
      const serverError = { status: 500 }
      
      expect(isRetryableError(serverError)).toBe(true)
    })

    it('应该识别不可重试的客户端错误', () => {
      const clientError = { status: 400 }
      
      expect(isRetryableError(clientError)).toBe(false)
    })

    it('应该识别不可重试的认证错误', () => {
      const authError = { status: 401 }
      
      expect(isRetryableError(authError)).toBe(false)
    })
  })

  describe('reportError', () => {
    it('应该报告错误', () => {
      const error = {
        code: 'TEST_ERROR',
        message: 'Test error',
        timestamp: new Date(),
        details: { test: true }
      }
      
      reportError(error, 'test-context', 'user-123')
      
      expect(console.error).toHaveBeenCalledWith(
        'Error Report:',
        expect.objectContaining({
          code: 'TEST_ERROR',
          message: 'Test error',
          context: 'test-context',
          userId: 'user-123'
        })
      )
    })
  })
})