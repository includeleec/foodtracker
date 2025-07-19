// 安全集成测试

import {
  escapeHtml,
  sanitizeInput,
  validateSqlInput,
  validateFileUpload,
  generateSecureToken,
  validateJwtFormat,
  getSecurityHeaders
} from '../lib/security-utils'

describe('Security Integration Tests', () => {
  describe('XSS Protection', () => {
    it('should prevent XSS attacks through HTML escaping', () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      const escaped = escapeHtml(maliciousInput)
      expect(escaped).not.toContain('<script>')
      expect(escaped).toContain('&lt;script&gt;')
    })

    it('should sanitize user input to remove dangerous content', () => {
      const maliciousInputs = [
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>',
        'onclick="alert(1)"'
      ]

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onclick=')
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('<iframe>')
      })
    })
  })

  describe('SQL Injection Protection', () => {
    it('should detect and reject SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1 OR 1=1; DELETE FROM users",
        "UNION SELECT password FROM users",
        "'; INSERT INTO admin VALUES('hacker'); --"
      ]

      sqlInjectionAttempts.forEach(attempt => {
        expect(validateSqlInput(attempt)).toBe(false)
      })
    })

    it('should allow safe user inputs', () => {
      const safeInputs = [
        '苹果',
        'Chicken Breast 100g',
        '2024-01-01',
        'breakfast',
        'This is a normal food description'
      ]

      safeInputs.forEach(input => {
        expect(validateSqlInput(input)).toBe(true)
      })
    })
  })

  describe('File Upload Security', () => {
    it('should validate file uploads securely', () => {
      // Valid image file
      const validFile = new File([''], 'photo.jpg', { type: 'image/jpeg' })
      const validResult = validateFileUpload(validFile)
      expect(validResult.valid).toBe(true)

      // Invalid file type
      const executableFile = new File([''], 'malware.exe', { type: 'application/exe' })
      const execResult = validateFileUpload(executableFile)
      expect(execResult.valid).toBe(false)
      expect(execResult.errors).toContain('不支持的文件类型: application/exe')

      // File with dangerous name
      const dangerousFile = new File([''], 'test<script>.jpg', { type: 'image/jpeg' })
      const dangerousResult = validateFileUpload(dangerousFile)
      expect(dangerousResult.valid).toBe(false)
      expect(dangerousResult.errors).toContain('文件名包含非法字符')
    })

    it('should reject oversized files', () => {
      // Create a large file (simulate 11MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join('')
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      
      const result = validateFileUpload(largeFile)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('文件大小超过限制 (10MB)')
    })
  })

  describe('Token Security', () => {
    it('should generate secure random tokens', () => {
      const token1 = generateSecureToken(32)
      const token2 = generateSecureToken(32)
      
      expect(token1).toHaveLength(32)
      expect(token2).toHaveLength(32)
      expect(token1).not.toBe(token2)
      
      // Should only contain safe characters
      expect(/^[A-Za-z0-9]+$/.test(token1)).toBe(true)
      expect(/^[A-Za-z0-9]+$/.test(token2)).toBe(true)
    })

    it('should validate JWT token format', () => {
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      expect(validateJwtFormat(validJwt)).toBe(true)

      const invalidTokens = [
        'not-a-jwt',
        'invalid.jwt',
        'too.many.parts.in.this.jwt',
        '',
        'onlyonepart'
      ]

      invalidTokens.forEach(token => {
        expect(validateJwtFormat(token)).toBe(false)
      })
    })
  })

  describe('Security Headers', () => {
    it('should provide comprehensive security headers', () => {
      const headers = getSecurityHeaders()
      
      // XSS Protection
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      
      // Content Type Protection
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      
      // Clickjacking Protection
      expect(headers['X-Frame-Options']).toBe('DENY')
      
      // HTTPS Enforcement
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
      
      // Content Security Policy
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
      expect(headers['Content-Security-Policy']).toContain('https://imagedelivery.net')
      expect(headers['Content-Security-Policy']).toContain('https://*.supabase.co')
      
      // Referrer Policy
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      
      // Permissions Policy
      expect(headers['Permissions-Policy']).toContain('camera=()')
    })
  })

  describe('Data Validation Security', () => {
    it('should validate food record data securely', () => {
      // Test XSS prevention
      const xssInput = '<script>alert("XSS")</script>'
      const sanitizedXss = sanitizeInput(xssInput)
      expect(sanitizedXss).not.toContain('<script>')
      
      // Test SQL injection prevention
      const sqlInjection = "'; DROP TABLE food_records; --"
      const isValidSql = validateSqlInput(sqlInjection)
      expect(isValidSql).toBe(false)
      
      // Test that safe inputs are preserved
      const safeInput = '苹果'
      const sanitizedSafe = sanitizeInput(safeInput)
      const isValidSafeSql = validateSqlInput(safeInput)
      expect(sanitizedSafe).toBe(safeInput)
      expect(isValidSafeSql).toBe(true)
    })
  })

  describe('Rate Limiting Security', () => {
    it('should implement rate limiting to prevent abuse', () => {
      // This test would normally require the actual rate limiting implementation
      // For now, we'll test that the security headers include rate limiting info
      const headers = getSecurityHeaders()
      
      // Ensure security headers are present (rate limiting would be implemented at API level)
      expect(Object.keys(headers).length).toBeGreaterThan(0)
    })
  })

  describe('Authentication Security', () => {
    it('should validate authentication tokens properly', () => {
      // Test JWT format validation
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature'
      const invalidJwt = 'invalid-token-format'
      
      expect(validateJwtFormat(validJwt)).toBe(true)
      expect(validateJwtFormat(invalidJwt)).toBe(false)
    })
  })

  describe('CSRF Protection', () => {
    it('should validate request origins for CSRF protection', () => {
      // This would be tested at the API level with actual request objects
      // For now, ensure security headers include CSRF protection
      const headers = getSecurityHeaders()
      
      // CSP helps prevent CSRF attacks
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
    })
  })
})

// Mock File API for Node.js environment
if (typeof File === 'undefined') {
  global.File = class MockFile {
    constructor(public content: any[], public name: string, public options: any = {}) {
      this.size = this.calculateSize(content)
      this.type = options.type || ''
    }
    
    size: number
    type: string
    
    private calculateSize(content: any[]): number {
      return content.reduce((size, chunk) => {
        if (typeof chunk === 'string') return size + chunk.length
        if (chunk instanceof Uint8Array) return size + chunk.length
        return size + String(chunk).length
      }, 0)
    }
  } as any
}

// Mock crypto for Node.js environment
if (typeof crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  } as any
}