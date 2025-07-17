import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { createClient } from '@supabase/supabase-js'

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
  const config = getConfig()
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey
  )

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid authentication token')
  }

  return user
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
    // 验证用户身份
    await validateUser(request)

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { status: 400 }
      )
    }

    // 验证文件
    validateFile(file)

    // 上传到 Cloudflare Images
    const uploadResult = await uploadToCloudflare(file)

    // 构建图片 URL
    const imageUrl = `https://imagedelivery.net/${getConfig().cloudflare.accountId}/${uploadResult.result.id}/public`

    return NextResponse.json({
      success: true,
      data: {
        id: uploadResult.result.id,
        url: imageUrl,
        filename: uploadResult.result.filename,
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '图片上传失败'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// 处理 OPTIONS 请求 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}