import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FoodRecordService } from '@/lib/database'
import type { FoodRecordInsert, ApiResponse, FoodRecord } from '@/types/database'

// 验证用户身份并获取用户ID
async function validateUserAndGetId(request: NextRequest): Promise<string> {
  const supabase = createServerSupabaseClient()
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid authentication token')
  }

  return user.id
}

// GET /api/food-records - 获取食物记录
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<FoodRecord[]>>> {
  try {
    // 验证用户身份
    const userId = await validateUserAndGetId(request)

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: false, error: '缺少日期参数' },
        { status: 400 }
      )
    }

    // 验证日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: '日期格式无效，请使用 YYYY-MM-DD 格式' },
        { status: 400 }
      )
    }

    // 获取指定日期的食物记录
    const records = await FoodRecordService.getFoodRecordsByDate(date)
    
    // 过滤只返回当前用户的记录
    const userRecords = records.filter(record => record.user_id === userId)

    return NextResponse.json({
      success: true,
      data: userRecords
    })

  } catch (error) {
    console.error('GET food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取食物记录失败'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST /api/food-records - 创建食物记录
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FoodRecord>>> {
  try {
    // 验证用户身份
    const userId = await validateUserAndGetId(request)

    // 获取请求体数据
    const body = await request.json() as any
    
    // 验证必填字段
    const requiredFields = ['meal_type', 'food_name', 'weight', 'calories', 'record_date']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `缺少必填字段: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // 验证餐次类型
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
    if (!validMealTypes.includes(body.meal_type)) {
      return NextResponse.json(
        { success: false, error: '无效的餐次类型' },
        { status: 400 }
      )
    }

    // 验证数值字段
    if (typeof body.weight !== 'number' || body.weight <= 0) {
      return NextResponse.json(
        { success: false, error: '重量必须是大于0的数字' },
        { status: 400 }
      )
    }

    if (typeof body.calories !== 'number' || body.calories <= 0) {
      return NextResponse.json(
        { success: false, error: '卡路里必须是大于0的数字' },
        { status: 400 }
      )
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.record_date)) {
      return NextResponse.json(
        { success: false, error: '日期格式无效，请使用 YYYY-MM-DD 格式' },
        { status: 400 }
      )
    }

    // 构建插入数据
    const insertData: FoodRecordInsert = {
      user_id: userId,
      meal_type: body.meal_type,
      food_name: body.food_name.trim(),
      weight: body.weight,
      calories: body.calories,
      record_date: body.record_date,
      image_url: body.image_url || null,
      image_id: body.image_id || null
    }

    // 创建食物记录
    const newRecord = await FoodRecordService.createFoodRecord(insertData)

    return NextResponse.json({
      success: true,
      data: newRecord
    })

  } catch (error) {
    console.error('POST food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '创建食物记录失败'
    
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}