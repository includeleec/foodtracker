// 安全工具函数测试

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

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Mock File API for testing
class MockFile {
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
  
  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.content[0] instanceof Uint8Array) {
      return this.content[0].buffer
    }
    // Convert string content to ArrayBuffer
    const str = this.content.join('')
    const buffer = new ArrayBuffer(str.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i)
    }
    return buffer
  }
}

// Replace global File with our mock
Object.defineProperty(global, 'File', {
  value: MockFile
})

import {
  escapeHtml,
  sanitizeInput,
  validateSqlInput,
  validateRequestOrigin,
  checkRateLimit,
  validateFileUpload,
  validateImageMagicNumbers,
  generateSecureToken,
  validateJwtFormat,
  getSecurityHeaders
} from '../security-utils'

// Mock NextRequest for testing
class MockNextRequest {
  constructor(public url: string, public init?: any) {
    this.headers = new Map()
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value as string)
      })
    }
  }
  
  headers: Map<string, string>
  
  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null
  }
}

describe('Security Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>'
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape all dangerous characters', () => {
      const input = `<>&"'`
      const expected = '&lt;&gt;&amp;&quot;&#039;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<p>Hello <script>alert("XSS")</script> World</p>'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello alert("XSS") World')
    })

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("XSS")'
      const result = sanitizeInput(input)
      expect(result).toBe('alert("XSS")')
    })

    it('should remove event handlers', () => {
      const input = 'onclick=alert("XSS") onload=malicious()'
      const result = sanitizeInput(input)
      expect(result).toBe('')
    })

    it('should normalize whitespace', () => {
      const input = '  Hello    World  \n\t  '
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })
  })

  describe('validateSqlInput', () => {
    it('should reject SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1; DELETE FROM users",
        "UNION SELECT * FROM users",
        "INSERT INTO users VALUES",
        "test'; DROP TABLE users; --"
      ]

      maliciousInputs.forEach(input => {
        expect(validateSqlInput(input)).toBe(false)
      })
    })

    it('should accept safe inputs', () => {
      const safeInputs = [
        "苹果",
        "Chicken Breast",
        "100g",
        "2024-01-01",
        "breakfast"
      ]

      safeInputs.forEach(input => {
        expect(validateSqlInput(input)).toBe(true)
      })
    })
  })

  describe('validateRequestOrigin', () => {
    it('should validate allowed origins', () => {
      const request = new MockNextRequest('https://example.com/api/test', {
        headers: {
          'origin': 'https://myapp.com'
        }
      }) as any

      expect(validateRequestOrigin(request, ['https://myapp.com'])).toBe(true)
      expect(validateRequestOrigin(request, ['https://other.com'])).toBe(false)
    })

    it('should handle wildcard origins', () => {
      const request = new MockNextRequest('https://example.com/api/test', {
        headers: {
          'origin': 'https://any-domain.com'
        }
      }) as any

      expect(validateRequestOrigin(request, ['*'])).toBe(true)
    })

    it('should handle missing origin with referer', () => {
      const request = new MockNextRequest('https://example.com/api/test', {
        headers: {
          'referer': 'https://myapp.com/page'
        }
      }) as any

      expect(validateRequestOrigin(request, ['https://myapp.com'])).toBe(true)
    })

    it('should reject requests without origin or referer', () => {
      const request = new MockNextRequest('https://example.com/api/test') as any
      expect(validateRequestOrigin(request, ['https://myapp.com'])).toBe(false)
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // 清理速率限制存储
      jest.clearAllMocks()
    })

    it('should allow first request', () => {
      const result = checkRateLimit('user1', 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should track multiple requests', () => {
      checkRateLimit('user2', 3, 60000)
      checkRateLimit('user2', 3, 60000)
      const result = checkRateLimit('user2', 3, 60000)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should block requests after limit exceeded', () => {
      // 达到限制
      for (let i = 0; i < 3; i++) {
        checkRateLimit('user3', 3, 60000)
      }
      
      // 第4次请求应该被阻止
      const result = checkRateLimit('user3', 3, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('validateFileUpload', () => {
    it('should validate correct image file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized files', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join('')
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('文件大小超过限制 (10MB)')
    })

    it('should reject unsupported file types', () => {
      const file = new File([''], 'test.exe', { type: 'application/exe' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('不支持的文件类型: application/exe')
    })

    it('should reject files with dangerous characters in name', () => {
      const file = new File([''], 'test<script>.jpg', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('文件名包含非法字符')
    })

    it('should reject files with invalid extensions', () => {
      const file = new File([''], 'test.php', { type: 'image/jpeg' })
      const result = validateFileUpload(file)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('不支持的文件扩展名')
    })
  })

  describe('validateImageMagicNumbers', () => {
    it('should validate JPEG magic numbers', async () => {
      // JPEG 魔数: FF D8 FF
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
      const file = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' })
      const result = await validateImageMagicNumbers(file)
      expect(result).toBe(true)
    })

    it('should validate PNG magic numbers', async () => {
      // PNG 魔数: 89 50 4E 47
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      const file = new File([pngBytes], 'test.png', { type: 'image/png' })
      const result = await validateImageMagicNumbers(file)
      expect(result).toBe(true)
    })

    it('should validate WebP magic numbers', async () => {
      // WebP 魔数: RIFF + WEBP
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // 文件大小占位符
        0x57, 0x45, 0x42, 0x50  // WEBP
      ])
      const file = new File([webpBytes], 'test.webp', { type: 'image/webp' })
      const result = await validateImageMagicNumbers(file)
      expect(result).toBe(true)
    })

    it('should reject files with invalid magic numbers', async () => {
      const invalidBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      const file = new File([invalidBytes], 'fake.jpg', { type: 'image/jpeg' })
      const result = await validateImageMagicNumbers(file)
      expect(result).toBe(false)
    })
  })

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(16)
      expect(token).toHaveLength(16)
    })

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      expect(token1).not.toBe(token2)
    })

    it('should only contain allowed characters', () => {
      const token = generateSecureToken(100)
      const allowedChars = /^[A-Za-z0-9]+$/
      expect(allowedChars.test(token)).toBe(true)
    })
  })

  describe('validateJwtFormat', () => {
    it('should validate correct JWT format', () => {
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      expect(validateJwtFormat(validJwt)).toBe(true)
    })

    it('should reject invalid JWT format', () => {
      const invalidJwts = [
        'invalid.jwt',
        'not-a-jwt-at-all',
        'too.many.parts.here.invalid',
        '',
        'onlyonepart'
      ]

      invalidJwts.forEach(jwt => {
        expect(validateJwtFormat(jwt)).toBe(false)
      })
    })
  })

  describe('getSecurityHeaders', () => {
    it('should return all required security headers', () => {
      const headers = getSecurityHeaders()
      
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Permissions-Policy']).toContain('camera=()')
    })

    it('should include CSP for image delivery', () => {
      const headers = getSecurityHeaders()
      expect(headers['Content-Security-Policy']).toContain('https://imagedelivery.net')
    })

    it('should include CSP for Supabase connection', () => {
      const headers = getSecurityHeaders()
      expect(headers['Content-Security-Policy']).toContain('https://*.supabase.co')
    })
  })
})