import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FoodRecordService } from '@/lib/database'
import type { FoodRecordUpdate, ApiResponse, FoodRecord } from '@/types/database'

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

// 验证记录所有权
async function validateRecordOwnership(recordId: string, userId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  const { data: record, error } = await supabase
    .from('food_records')
    .select('user_id')
    .eq('id', recordId)
    .single()

  if (error) {
    throw new Error('记录不存在')
  }

  if (record.user_id !== userId) {
    throw new Error('无权限访问此记录')
  }
}

// PUT /api/food-records/[id] - 更新食物记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<FoodRecord>>> {
  try {
    // 验证用户身份
    const userId = await validateUserAndGetId(request)
    
    // 获取参数
    const { id } = await params
    
    // 验证记录所有权
    await validateRecordOwnership(id, userId)

    // 获取请求体数据
    const body = await request.json() as any
    
    // 验证餐次类型（如果提供）
    if (body.meal_type) {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
      if (!validMealTypes.includes(body.meal_type)) {
        return NextResponse.json(
          { success: false, error: '无效的餐次类型' },
          { status: 400 }
        )
      }
    }

    // 验证数值字段（如果提供）
    if (body.weight !== undefined) {
      if (typeof body.weight !== 'number' || body.weight <= 0) {
        return NextResponse.json(
          { success: false, error: '重量必须是大于0的数字' },
          { status: 400 }
        )
      }
    }

    if (body.calories !== undefined) {
      if (typeof body.calories !== 'number' || body.calories <= 0) {
        return NextResponse.json(
          { success: false, error: '卡路里必须是大于0的数字' },
          { status: 400 }
        )
      }
    }

    // 验证日期格式（如果提供）
    if (body.record_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(body.record_date)) {
        return NextResponse.json(
          { success: false, error: '日期格式无效，请使用 YYYY-MM-DD 格式' },
          { status: 400 }
        )
      }
    }

    // 构建更新数据
    const updateData: FoodRecordUpdate = {
      updated_at: new Date().toISOString()
    }

    // 只更新提供的字段
    if (body.meal_type) updateData.meal_type = body.meal_type
    if (body.food_name) updateData.food_name = body.food_name.trim()
    if (body.weight !== undefined) updateData.weight = body.weight
    if (body.calories !== undefined) updateData.calories = body.calories
    if (body.record_date) updateData.record_date = body.record_date
    if (body.image_url !== undefined) updateData.image_url = body.image_url
    if (body.image_id !== undefined) updateData.image_id = body.image_id

    // 更新食物记录
    const updatedRecord = await FoodRecordService.updateFoodRecord(id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedRecord
    })

  } catch (error) {
    console.error('PUT food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '更新食物记录失败'
    const statusCode = errorMessage.includes('记录不存在') ? 404 : 
                      errorMessage.includes('无权限') ? 403 : 500
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/food-records/[id] - 删除食物记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    // 验证用户身份
    const userId = await validateUserAndGetId(request)
    
    // 获取参数
    const { id } = await params
    
    // 验证记录所有权
    await validateRecordOwnership(id, userId)

    // 删除食物记录
    await FoodRecordService.deleteFoodRecord(id)

    return NextResponse.json({
      success: true,
      data: null
    })

  } catch (error) {
    console.error('DELETE food-records API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '删除食物记录失败'
    const statusCode = errorMessage.includes('记录不存在') ? 404 : 
                      errorMessage.includes('无权限') ? 403 : 500
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// 处理 OPTIONS 请求 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}