import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase-server'
import { FoodRecordService } from '@/lib/database'
import { handleError } from '@/lib/error-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '缺少必需的日期参数' },
        { status: 400 }
      )
    }

    // 验证日期格式
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { success: false, error: '日期格式无效' },
        { status: 400 }
      )
    }

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { success: false, error: '开始日期不能晚于结束日期' },
        { status: 400 }
      )
    }

    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '缺少认证信息' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = createAuthenticatedClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '无效的认证令牌' },
        { status: 401 }
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
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      }
    )

  } catch (error) {
    console.error('Error fetching record dates:', error)
    const appError = handleError(error, 'GET /api/food-records/dates')
    
    return NextResponse.json(
      { success: false, error: appError.message },
      { status: 500 }
    )
  }
}