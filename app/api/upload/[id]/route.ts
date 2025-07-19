import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { createAuthenticatedClient } from '@/lib/supabase-server'

interface DeleteResponse {
  success: boolean
  error?: string
}

// 验证用户身份
async function validateUser(request: NextRequest) {
  const config = getConfig()
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const supabase = createAuthenticatedClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Invalid authentication token')
  }

  return user
}

// 从 Cloudflare Images 删除图片
async function deleteFromCloudflare(imageId: string): Promise<void> {
  const config = getConfig()
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/images/v1/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.cloudflare.imagesToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cloudflare Images delete error:', errorText)
    throw new Error(`图片删除失败: ${response.status} ${response.statusText}`)
  }

  const result = await response.json() as any
  
  if (!result.success) {
    console.error('Cloudflare Images delete failed:', result.errors)
    throw new Error('图片删除失败')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse>> {
  try {
    // 验证用户身份
    await validateUser(request)

    const { id: imageId } = await params
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: '缺少图片ID' },
        { status: 400 }
      )
    }

    // 从 Cloudflare Images 删除
    await deleteFromCloudflare(imageId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '图片删除失败'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}