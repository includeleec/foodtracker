/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { 
  validateRequestOrigin, 
  sanitizeInput, 
  validateSqlInput,
  escapeHtml,
  validateJwtFormat,
  checkRateLimit
} from '@/lib/security-utils'

describe('Security Utils Comprehensive Tests', () => {
  describe('validateRequestOrigin', () => {
    it('should validate allowed origins correctly', () => {
      const allowedOrigins = [
        'https://food.tinycard.xyz',
        'https://food-tracker-app.includeleec-b6f.workers.dev',
        'http://localhost:3000'
      ]

      // Test valid origin
      const validRequest = new NextRequest('https://food.tinycard.xyz/api/test', {
        headers: { 'origin': 'https://food.tinycard.xyz' }
      })
      expect(validateRequestOrigin(validRequest, allowedOrigins)).toBe(true)

      // Test invalid origin
      const invalidRequest = new NextRequest('https://malicious.com/api/test', {
        headers: { 'origin': 'https://malicious.com' }
      })
      expect(validateRequestOrigin(invalidRequest, allowedOrigins)).toBe(false)
    })

    it('should handle development environment correctly', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const requestWithoutOrigin = new NextRequest('http://localhost:3000/api/test')
      expect(validateRequestOrigin(requestWithoutOrigin, ['https://food.tinycard.xyz'])).toBe(true)

      process.env.NODE_ENV = originalEnv
    })

    it('should validate wildcard patterns', () => {
      const allowedOrigins = ['*.tinycard.xyz', '*.workers.dev']

      const subdomainRequest = new NextRequest('https://api.tinycard.xyz/test', {
        headers: { 'origin': 'https://api.tinycard.xyz' }
      })
      expect(validateRequestOrigin(subdomainRequest, allowedOrigins)).toBe(true)

      const workersRequest = new NextRequest('https://app.workers.dev/test', {
        headers: { 'origin': 'https://app.workers.dev' }
      })
      expect(validateRequestOrigin(workersRequest, allowedOrigins)).toBe(true)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello<b>World</b>'
      const result = sanitizeInput(input)
      expect(result).toBe('HelloWorld')
    })

    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert("xss") data:text/html,<script>alert(1)</script>'
      const result = sanitizeInput(input)
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('data:')
    })

    it('should remove event handlers', () => {
      const input = 'onclick="alert(1)" onload="malicious()" text'
      const result = sanitizeInput(input)
      expect(result).not.toContain('onclick=')
      expect(result).not.toContain('onload=')
      expect(result).toContain('text')
    })

    it('should preserve safe content', () => {
      const input = '燕麦粥 200g 150卡路里'
      const result = sanitizeInput(input)
      expect(result).toBe('燕麦粥 200g 150卡路里')
    })
  })

  describe('validateSqlInput', () => {
    it('should detect SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM passwords",
        "admin'/*",
        "1; DELETE FROM food_records; --"
      ]

      maliciousInputs.forEach(input => {
        expect(validateSqlInput(input)).toBe(false)
      })
    })

    it('should allow safe inputs', () => {
      const safeInputs = [
        '燕麦粥',
        'Chicken Breast',
        '200',
        '2024-01-15',
        'user@example.com'
      ]

      safeInputs.forEach(input => {
        expect(validateSqlInput(input)).toBe(true)
      })
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<div>Hello & "World"</div>'
      const result = escapeHtml(input)
      expect(result).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;')
    })

    it('should handle single quotes', () => {
      const input = "It's a test"
      const result = escapeHtml(input)
      expect(result).toBe('It&#039;s a test')
    })
  })

  describe('validateJwtFormat', () => {
    it('should validate JWT format', () => {
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      expect(validateJwtFormat(validJwt)).toBe(true)

      const invalidJwts = [
        'not.a.jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Missing parts
        'invalid-format',
        ''
      ]

      invalidJwts.forEach(jwt => {
        expect(validateJwtFormat(jwt)).toBe(false)
      })
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear any existing rate limit data
      jest.clearAllMocks()
    })

    it('should allow requests within limit', () => {
      const result1 = checkRateLimit('test-key', 5, 60000)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = checkRateLimit('test-key', 5, 60000)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests exceeding limit', () => {
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('limit-test', 5, 60000)
      }

      // This should be blocked
      const result = checkRateLimit('limit-test', 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now
      let currentTime = Date.now()
      Date.now = jest.fn(() => currentTime)

      // Use up limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('reset-test', 3, 1000)
      }

      // Should be blocked
      let result = checkRateLimit('reset-test', 3, 1000)
      expect(result.allowed).toBe(false)

      // Advance time past window
      currentTime += 1001
      
      // Should be allowed again
      result = checkRateLimit('reset-test', 3, 1000)
      expect(result.allowed).toBe(true)

      Date.now = originalNow
    })
  })

  describe('Input validation edge cases', () => {
    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(escapeHtml('')).toBe('')
      expect(validateSqlInput('')).toBe(true)
    })

    it('should handle very long inputs', () => {
      const longInput = 'a'.repeat(10000)
      expect(sanitizeInput(longInput)).toBe(longInput)
      expect(validateSqlInput(longInput)).toBe(true)
    })

    it('should handle Unicode characters', () => {
      const unicodeInput = '🍎🥗🍜 中文测试 Éñglish tëxt'
      expect(sanitizeInput(unicodeInput)).toBe(unicodeInput)
      expect(validateSqlInput(unicodeInput)).toBe(true)
    })

    it('should handle mixed malicious content', () => {
      const mixedInput = '<script>alert("xss")</script> javascript:void(0) onclick="evil()" AND 1=1 燕麦粥'
      const result = sanitizeInput(mixedInput)
      
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('onclick=')
      expect(result).toContain('燕麦粥')
    })
  })

  describe('Security headers and configuration', () => {
    it('should handle CORS properly', () => {
      const allowedOrigins = ['https://food.tinycard.xyz']
      
      const validRequest = new NextRequest('https://food.tinycard.xyz/api/test', {
        headers: { 'origin': 'https://food.tinycard.xyz' }
      })
      
      expect(validateRequestOrigin(validRequest, allowedOrigins)).toBe(true)
    })

    it('should reject requests from unauthorized domains', () => {
      const allowedOrigins = ['https://food.tinycard.xyz']
      
      const maliciousRequest = new NextRequest('https://evil.com/api/test', {
        headers: { 'origin': 'https://evil.com' }
      })
      
      expect(validateRequestOrigin(maliciousRequest, allowedOrigins)).toBe(false)
    })
  })
})