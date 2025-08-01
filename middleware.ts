import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 生成唯一的 nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // 构建 CSP 头部
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://imagedelivery.net https://*.cloudflare.com;
    font-src 'self';
    connect-src 'self' https://*.supabase.co https://api.cloudflare.com https://cloudflareinsights.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
  `
  
  // 清理 CSP 头部格式
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()
  
  // 设置请求头部
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  
  // 创建响应
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // 设置安全头部
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  return response
}

export const config = {
  matcher: [
    // 匹配所有路径，但排除 API 路由、静态文件和预取请求
    {
      source: '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}