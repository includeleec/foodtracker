import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase-server'
import { FoodRecordService } from '@/lib/database'
import { handleError } from '@/lib/error-utils'
import { 
  validateRequestOrigin, 
  checkRateLimit, 
  getSecurityHeaders,
  validateJwtFormat
} from '@/lib/security-utils'

// 安全验证中间件
async function securityMiddleware(request: NextRequest): Promise<void> {
  // 验证请求来源
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000', // 开发环境
    'http://localhost:3001', // 开发环境备用端口
    'http://localhost:3002', // 开发环境备用端口
    '*.pages.dev', // Cloudflare Pages
    '*.workers.dev', // Cloudflare Workers
    'https://food-tracker-app.includeleec-b6f.workers.dev', // 明确的生产域名
    'https://food.tinycard.xyz', // 自定义域名
    '*.tinycard.xyz' // 允许子域名
  ]
  
  if (!validateRequestOrigin(request, allowedOrigins)) {
    throw new Error('Invalid request origin')
  }
  
  // 速率限制
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown'
  
  const isDev = process.env.NODE_ENV === 'development'
  const rateLimit = checkRateLimit(
    `api:${clientIp}`, 
    isDev ? 1000 : 100,
    15 * 60 * 1000
  )
  
  if (!rateLimit.allowed) {
    throw new Error('Rate limit exceeded')
  }
}

export async function GET(request: NextRequest) {
  try {
    // 安全验证
    await securityMiddleware(request)
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '缺少必需的日期参数' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证日期格式
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { success: false, error: '日期格式无效' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { success: false, error: '开始日期不能晚于结束日期' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '缺少认证信息' },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }

    const token = authHeader.substring(7)
    
    // 验证 JWT 格式
    if (!validateJwtFormat(token)) {
      return NextResponse.json(
        { success: false, error: 'Invalid JWT format' },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }
    
    const supabase = createAuthenticatedClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '无效的认证令牌' },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }

    const foodService = new FoodRecordService(supabase)
    
    // 获取记录日期
    const dates = await foodService.getRecordDates(startDate, endDate)

    return NextResponse.json(
      { success: true, data: dates },
      { 
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    )

  } catch (error) {
    console.error('Error fetching record dates:', error)
    const appError = handleError(error, 'GET /api/food-records/dates')
    
    const errorMessage = error instanceof Error ? error.message : appError.message
    const statusCode = error instanceof Error && error.message.includes('Rate limit') ? 429 :
                      error instanceof Error && error.message.includes('origin') ? 403 : 500
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { 
        status: statusCode,
        headers: getSecurityHeaders()
      }
    )
  }
}

// 处理 OPTIONS 请求 (CORS)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000', // 开发环境
    'https://food-tracker-app.includeleec-b6f.workers.dev',
    'https://food.tinycard.xyz' // 自定义域名
  ]
  
  // 动态设置 CORS origin
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 
                    (allowedOrigins.find(allowed => origin.endsWith(allowed.replace('https://', '').replace('http://', ''))) || allowedOrigins[0])

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}