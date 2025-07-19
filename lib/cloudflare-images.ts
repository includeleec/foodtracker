// Cloudflare Images 工具函数

interface CloudflareImagesConfig {
  accountHash: string
  accountId: string
}

/**
 * 获取 Cloudflare Images 配置
 */
export function getCloudflareImagesConfig(): CloudflareImagesConfig {
  const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID
  
  if (!accountHash || !accountId) {
    console.error('Missing Cloudflare Images configuration')
    throw new Error('Cloudflare Images configuration is incomplete')
  }
  
  return { accountHash, accountId }
}

/**
 * 构建 Cloudflare Images URL
 */
export function buildCloudflareImageUrl(imageId: string, variant: string = 'public'): string {
  try {
    const { accountHash } = getCloudflareImagesConfig()
    return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`
  } catch (error) {
    console.error('Failed to build Cloudflare image URL:', error)
    return ''
  }
}

/**
 * 验证是否为有效的 Cloudflare Images URL
 */
export function isValidCloudflareImageUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'imagedelivery.net' && 
           urlObj.pathname.split('/').length === 4 // /accountHash/imageId/variant
  } catch {
    return false
  }
}

/**
 * 从 Cloudflare Images URL 提取图片 ID
 */
export function extractImageIdFromUrl(url: string): string | null {
  if (!isValidCloudflareImageUrl(url)) return null
  
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    return pathParts[2] || null // /accountHash/imageId/variant
  } catch {
    return null
  }
}

/**
 * 修复可能损坏的 Cloudflare Images URL
 */
export function fixCloudflareImageUrl(url: string): string {
  if (!url) return ''
  
  // 如果已经是有效的 Cloudflare Images URL，直接返回
  if (isValidCloudflareImageUrl(url)) return url
  
  // 尝试提取图片 ID 并重新构建 URL
  const imageId = extractImageIdFromUrl(url)
  if (imageId) {
    return buildCloudflareImageUrl(imageId)
  }
  
  // 如果 URL 包含图片 ID 模式，尝试提取
  const idMatch = url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)
  if (idMatch) {
    return buildCloudflareImageUrl(idMatch[0])
  }
  
  console.warn('Unable to fix Cloudflare image URL:', url)
  return url
}

/**
 * 获取图片的不同变体 URL
 */
export function getImageVariants(imageId: string) {
  return {
    public: buildCloudflareImageUrl(imageId, 'public'),
    thumbnail: buildCloudflareImageUrl(imageId, 'thumbnail'),
    small: buildCloudflareImageUrl(imageId, 'small'),
    medium: buildCloudflareImageUrl(imageId, 'medium'),
    large: buildCloudflareImageUrl(imageId, 'large')
  }
}

/**
 * 检查图片是否可访问
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  if (!url) return false
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}