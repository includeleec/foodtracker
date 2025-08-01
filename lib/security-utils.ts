// 安全工具函数 - 防护 XSS、CSRF 和其他安全威胁

import { NextRequest } from 'next/server'

// XSS 防护 - HTML 转义
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// 清理用户输入 - 移除潜在的恶意脚本
export function sanitizeInput(input: string): string {
  // 移除 HTML 标签
  const withoutTags = input.replace(/<[^>]*>/g, '')
  
  // 移除潜在的脚本内容
  let withoutScripts = withoutTags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
  
  // 移除事件处理器 - 保留其他内容
  withoutScripts = withoutScripts.replace(/on\w+\s*=\s*[^;\s]+/gi, '')
  
  // 清理多余空白字符
  return withoutScripts.trim().replace(/\s+/g, ' ')
}

// SQL 注入防护 - 验证输入格式
export function validateSqlInput(input: string): boolean {
  // 检查是否包含潜在的 SQL 注入模式
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(';|--;|\|\||\/\*|\*\/)/g,
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi,
    /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/gi
  ]
  
  return !sqlInjectionPatterns.some(pattern => pattern.test(input))
}

// CSRF 防护 - 验证请求来源
export function validateRequestOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // 在开发环境中，对于同源请求，origin 可能为空，这是正常的
  // 在 Cloudflare Workers 环境中，某些内部请求可能没有这些 headers
  if (!origin && !referer) {
    // 开发环境允许无 origin 的请求
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    
    // 在生产环境中，如果是来自 Cloudflare Workers 的内部请求，允许通过
    const userAgent = request.headers.get('user-agent')
    if (userAgent && userAgent.includes('Cloudflare-Workers')) {
      return true
    }
    return false
  }
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : '')
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    
    // 完全匹配
    if (requestOrigin === allowed) return true
    
    // 处理通配符匹配 (*.domain.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2)
      return requestOrigin.endsWith('.' + domain) || requestOrigin === 'https://' + domain || requestOrigin === 'http://' + domain
    }
    
    // 处理子域匹配
    const cleanAllowed = allowed.replace('https://', '').replace('http://', '')
    return requestOrigin.endsWith('.' + cleanAllowed) || requestOrigin.includes(cleanAllowed)
  })
}

// 速率限制 - 简单的内存存储实现
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15分钟
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  // 清理过期条目
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier)
  }
  
  const currentEntry = rateLimitStore.get(identifier)
  
  if (!currentEntry) {
    // 首次请求
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }
  
  if (currentEntry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime
    }
  }
  
  currentEntry.count++
  return {
    allowed: true,
    remaining: maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime
  }
}

// 文件上传安全检查
export function validateFileUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.push(`文件大小超过限制 (${maxSize / 1024 / 1024}MB)`)
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    errors.push(`不支持的文件类型: ${file.type}`)
  }
  
  // 检查文件名
  if (!file.name || file.name.length > 255) {
    errors.push('无效的文件名')
  }
  
  // 检查文件名中的危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
  if (dangerousChars.test(file.name)) {
    errors.push('文件名包含非法字符')
  }
  
  // 检查文件扩展名
  const extension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push('不支持的文件扩展名')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 验证图片文件头 (魔数检查)
export async function validateImageMagicNumbers(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  // 检查常见图片格式的魔数
  const magicNumbers = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46],
    webp: [0x52, 0x49, 0x46, 0x46] // RIFF (WebP 的前4字节)
  }
  
  for (const [format, magic] of Object.entries(magicNumbers)) {
    if (bytes.length >= magic.length) {
      const matches = magic.every((byte, index) => bytes[index] === byte)
      if (matches) {
        // 对于 WebP，还需要检查第8-11字节是否为 "WEBP"
        if (format === 'webp') {
          const webpSignature = [0x57, 0x45, 0x42, 0x50] // "WEBP"
          return bytes.length >= 12 && 
                 webpSignature.every((byte, index) => bytes[8 + index] === byte)
        }
        return true
      }
    }
  }
  
  return false
}

// 生成安全的随机字符串
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // 使用 crypto.getRandomValues 生成安全随机数
  const randomArray = new Uint8Array(length)
  crypto.getRandomValues(randomArray)
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomArray[i] % chars.length)
  }
  
  return result
}

// 验证 JWT 令牌格式
export function validateJwtFormat(token: string): boolean {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
  return jwtRegex.test(token)
}

// 安全头部设置
export function getSecurityHeaders(): Record<string, string> {
  return {
    // XSS 防护
    'X-XSS-Protection': '1; mode=block',
    
    // 内容类型嗅探防护
    'X-Content-Type-Options': 'nosniff',
    
    // 点击劫持防护
    'X-Frame-Options': 'DENY',
    
    // HTTPS 强制
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // 内容安全策略
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'nonce-' 'strict-dynamic'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://imagedelivery.net https://*.cloudflare.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://api.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // 推荐人策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 权限策略
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// 清理定时任务 - 清理过期的速率限制条目
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// 启动清理定时器
if (typeof window === 'undefined') {
  // 只在服务器端运行
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000) // 每5分钟清理一次
}