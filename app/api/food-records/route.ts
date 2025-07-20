import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase-server'
import { FoodRecordService } from '@/lib/database'
import { getAllowedOrigins } from '@/lib/config'
import type { FoodRecordInsert, ApiResponse, FoodRecord } from '@/types/database'
import { 
  validateRequestOrigin, 
  checkRateLimit, 
  sanitizeInput, 
  validateSqlInput,
  getSecurityHeaders,
  validateJwtFormat
} from '@/lib/security-utils'

// 验证用户身份并获取用户ID和认证客户端
async function validateUserAndGetClient(request: NextRequest): Promise<{ userId: string, foodService: FoodRecordService }> {
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

  return { userId: user.id, foodService: new FoodRecordService(supabase) }
}

// 安全验证中间件
async function securityMiddleware(request: NextRequest): Promise<void> {
  // 验证请求来源 - 使用动态配置
  const allowedOrigins = getAllowedOrigins(request)
  
  if (!validateRequestOrigin(request, allowedOrigins)) {
    throw new Error('Invalid request origin')
  }
  
  // 速率限制 - 开发环境使用更宽松的限制
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for') || 
                   'unknown'
  
  // 开发环境允许更多请求
  const isDev = process.env.NODE_ENV === 'development'
  const rateLimit = checkRateLimit(
    `api:${clientIp}`, 
    isDev ? 1000 : 100, // 开发环境1000请求/15分钟，生产环境100请求/15分钟
    15 * 60 * 1000
  )
  
  if (!rateLimit.allowed) {
    throw new Error('Rate limit exceeded')
  }
}

// GET /api/food-records - 获取食物记录
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<FoodRecord[]>>> {
  try {
    // 安全验证
    await securityMiddleware(request)
    
    // 验证用户身份并获取服务
    const { userId, foodService } = await validateUserAndGetClient(request)

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: false, error: '缺少日期参数' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 清理和验证日期输入
    const cleanDate = sanitizeInput(date)
    if (!validateSqlInput(cleanDate)) {
      return NextResponse.json(
        { success: false, error: '日期参数包含非法字符' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(cleanDate)) {
      return NextResponse.json(
        { success: false, error: '日期格式无效，请使用 YYYY-MM-DD 格式' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证日期范围（防止查询过于久远的数据）
    const requestDate = new Date(cleanDate)
    const minDate = new Date('2020-01-01')
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 1) // 允许明天的日期

    if (requestDate < minDate || requestDate > maxDate) {
      return NextResponse.json(
        { success: false, error: '日期超出允许范围' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 获取指定日期的食物记录
    const records = await foodService.getFoodRecordsByDate(cleanDate)
    
    // 过滤只返回当前用户的记录（双重验证）
    const userRecords = records.filter(record => record.user_id === userId)

    return NextResponse.json({
      success: true,
      data: userRecords
    }, {
      headers: getSecurityHeaders()
    })

  } catch (error) {
    console.error('GET food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取食物记录失败'
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

// POST /api/food-records - 创建食物记录
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FoodRecord>>> {
  try {
    // 安全验证
    await securityMiddleware(request)
    
    // 验证用户身份并获取服务
    const { userId, foodService } = await validateUserAndGetClient(request)

    // 获取请求体数据
    const body = await request.json() as any
    
    // 验证必填字段
    const requiredFields = ['meal_type', 'food_name', 'weight', 'record_date']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `缺少必填字段: ${missingFields.join(', ')}` },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 清理和验证输入数据
    const cleanFoodName = sanitizeInput(body.food_name)
    const cleanMealType = sanitizeInput(body.meal_type)
    const cleanRecordDate = sanitizeInput(body.record_date)
    
    // 验证输入是否包含恶意内容
    if (!validateSqlInput(cleanFoodName) || !validateSqlInput(cleanMealType) || !validateSqlInput(cleanRecordDate)) {
      return NextResponse.json(
        { success: false, error: '输入数据包含非法字符' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证餐次类型
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
    if (!validMealTypes.includes(cleanMealType)) {
      return NextResponse.json(
        { success: false, error: '无效的餐次类型' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证食物名称长度
    if (cleanFoodName.length === 0 || cleanFoodName.length > 255) {
      return NextResponse.json(
        { success: false, error: '食物名称长度必须在1-255字符之间' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证数值字段
    const weight = Number(body.weight)
    const calories = Number(body.calories)
    
    if (isNaN(weight) || weight <= 0 || weight > 10000) {
      return NextResponse.json(
        { success: false, error: '重量必须是0-10000之间的数字' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 卡路里为可选字段，如果提供则验证
    if (calories !== undefined && calories !== null && (isNaN(calories) || calories < 0 || calories > 10000)) {
      return NextResponse.json(
        { success: false, error: '卡路里必须是0-10000之间的数字' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证日期格式和范围
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(cleanRecordDate)) {
      return NextResponse.json(
        { success: false, error: '日期格式无效，请使用 YYYY-MM-DD 格式' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    const recordDate = new Date(cleanRecordDate)
    const minDate = new Date('2020-01-01')
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 1) // 允许明天的日期

    if (recordDate < minDate || recordDate > maxDate) {
      return NextResponse.json(
        { success: false, error: '日期超出允许范围' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // 验证图片URL（如果提供）
    let cleanImageUrl = null
    let cleanImageId = null
    
    if (body.image_url) {
      cleanImageUrl = sanitizeInput(body.image_url)
      if (!cleanImageUrl.startsWith('https://imagedelivery.net/')) {
        return NextResponse.json(
          { success: false, error: '无效的图片URL' },
          { 
            status: 400,
            headers: getSecurityHeaders()
          }
        )
      }
    }
    
    if (body.image_id) {
      cleanImageId = sanitizeInput(body.image_id)
      if (!validateSqlInput(cleanImageId) || cleanImageId.length > 255) {
        return NextResponse.json(
          { success: false, error: '无效的图片ID' },
          { 
            status: 400,
            headers: getSecurityHeaders()
          }
        )
      }
    }

    // 构建插入数据
    const insertData: FoodRecordInsert = {
      user_id: userId,
      meal_type: cleanMealType as any,
      food_name: cleanFoodName,
      weight: weight,
      calories: calories !== undefined && calories !== null ? calories : null,
      record_date: cleanRecordDate,
      image_url: cleanImageUrl,
      image_id: cleanImageId
    }

    // 创建食物记录
    const newRecord = await foodService.createFoodRecord(insertData)

    return NextResponse.json({
      success: true,
      data: newRecord
    }, {
      headers: getSecurityHeaders()
    })

  } catch (error) {
    console.error('POST food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '创建食物记录失败'
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
  const allowedOrigins = getAllowedOrigins(request)
  
  // 动态设置 CORS origin
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 
                    (allowedOrigins.find(allowed => origin.endsWith(allowed.replace('https://', '').replace('http://', ''))) || allowedOrigins[0])

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}