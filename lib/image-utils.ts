// 图片上传工具函数

export interface UploadResult {
  id: string
  url: string
  filename: string
}

export interface UploadError {
  message: string
  code?: string
}

export class ImageUploadError extends Error {
  code?: string
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ImageUploadError'
    this.code = code
  }
}

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/gif'
]

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

// 验证图片文件
export function validateImageFile(file: File): void {
  if (!file) {
    throw new ImageUploadError('请选择要上传的文件')
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      `不支持的文件格式。支持的格式: ${SUPPORTED_IMAGE_TYPES.map(type => type.split('/')[1]).join(', ')}`
    )
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new ImageUploadError(
      `文件大小超过限制。最大允许 ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`
    )
  }
}

// 上传图片到服务器
export async function uploadImage(
  file: File,
  authToken: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // 验证文件
  validateImageFile(file)

  const formData = new FormData()
  formData.append('file', file)

  try {
    // 创建 XMLHttpRequest 以支持进度回调
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        })
      }

      // 监听请求完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              resolve(response.data)
            } else {
              reject(new ImageUploadError(response.error || '上传失败'))
            }
          } catch (error) {
            reject(new ImageUploadError('服务器响应格式错误'))
          }
        } else {
          reject(new ImageUploadError(`上传失败: ${xhr.status} ${xhr.statusText}`))
        }
      })

      // 监听请求错误
      xhr.addEventListener('error', () => {
        reject(new ImageUploadError('网络错误，请检查网络连接'))
      })

      // 监听请求超时
      xhr.addEventListener('timeout', () => {
        reject(new ImageUploadError('上传超时，请重试'))
      })

      // 配置请求
      xhr.open('POST', '/api/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
      xhr.timeout = 30000 // 30秒超时

      // 发送请求
      xhr.send(formData)
    })

  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw error
    }
    throw new ImageUploadError('上传过程中发生未知错误')
  }
}

// 删除 Cloudflare Images 中的图片
export async function deleteImage(
  imageId: string,
  authToken: string
): Promise<void> {
  try {
    const response = await fetch(`/api/upload/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new ImageUploadError(`删除失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new ImageUploadError(result.error || '删除失败')
    }

  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw error
    }
    throw new ImageUploadError('删除过程中发生未知错误')
  }
}

// 生成图片预览 URL
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

// 清理图片预览 URL
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}

// 压缩图片 (可选功能)
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // 设置画布尺寸
      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height)

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new ImageUploadError('图片压缩失败'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      reject(new ImageUploadError('图片加载失败'))
    }

    img.src = createImagePreview(file)
  })
}