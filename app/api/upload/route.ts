import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { createAuthenticatedClient } from '@/lib/supabase-server'
import { 
  validateRequestOrigin, 
  checkRateLimit, 
  validateFileUpload,
  validateImageMagicNumbers,
  getSecurityHeaders,
  validateJwtFormat
} from '@/lib/security-utils'

// 支持的图片格式
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface CloudflareImagesResponse {
  result: {
    id: string
    filename: string
    uploaded: string
    requireSignedURLs: boolean
    variants: string[]
  }
  success: boolean
  errors: any[]
  messages: any[]
}

interface UploadResponse {
  success: boolean
  data?: {
    id: string
    url: string
    filename: string
  }
  error?: string
}

// 验证用户身份
async function validateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  
  // 验证 JWT 格式
  if (!validateJwtFormat(token)) {
    throw new Error('Invalid JWT format')
  }
  
  const supabase = createAuthenticatedClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Invalid authentication token')
  }

  return user
}

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
  
  // 速率限制 - 图片上传更严格的限制
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown'
  
  // 开发环境允许更多上传
  const isDev = process.env.NODE_ENV === 'development'
  const rateLimit = checkRateLimit(
    `upload:${clientIp}`, 
    isDev ? 200 : 20, // 开发环境200上传/15分钟，生产环境20上传/15分钟
    15 * 60 * 1000
  )
  
  if (!rateLimit.allowed) {
    throw new Error('Upload rate limit exceeded')
  }
}

// 验证文件
function validateFile(file: File): void {
  // 检查文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`不支持的文件类型。支持的格式: ${ALLOWED_TYPES.join(', ')}`)
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制。最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // 检查文件名
  if (!file.name || file.name.length > 255) {
    throw new Error('无效的文件名')
  }
}

// 上传到 Cloudflare Images
async function uploadToCloudflare(file: File): Promise<CloudflareImagesResponse> {
  const config = getConfig()
  
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.cloudflare.imagesToken}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cloudflare Images API error:', errorText)
    throw new Error(`图片上传失败: ${response.status} ${response.statusText}`)
  }

  const result: CloudflareImagesResponse = await response.json()
  
  if (!result.success) {
    console.error('Cloudflare Images upload failed:', result.errors)
    throw new Error('图片上传失败')
  }

  return result
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // 安全验证
    await securityMiddleware(request)
    
    // 验证用户身份
    await validateUser(request)

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 使用增强的文件验证
    const fileValidation = validateFileUpload(file)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { success: false, error: fileValidation.errors.join('; ') },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证图片魔数（文件头）
    const isMagicNumberValid = await validateImageMagicNumbers(file)
    if (!isMagicNumberValid) {
      return NextResponse.json(
        { success: false, error: '文件不是有效的图片格式' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 上传到 Cloudflare Images
    const uploadResult = await uploadToCloudflare(file)

    // 构建图片 URL
    const imageUrl = `https://imagedelivery.net/${getConfig().cloudflare.accountHash}/${uploadResult.result.id}/public`

    return NextResponse.json({
      success: true,
      data: {
        id: uploadResult.result.id,
        url: imageUrl,
        filename: uploadResult.result.filename,
      }
    }, {
      headers: getSecurityHeaders()
    })

  } catch (error) {
    console.error('Upload API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '图片上传失败'
    const statusCode = error instanceof Error && error.message.includes('rate limit') ? 429 :
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
    'http://localhost:3001', // 开发环境备用端口
    'http://localhost:3002', // 开发环境备用端口
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}