'use client'

import React, { useState, useRef, useCallback } from 'react'
import { uploadImage, deleteImage, validateImageFile, createImagePreview, revokeImagePreview, ImageUploadError } from '@/lib/image-utils'
import { useAuth } from '@/lib/auth-context'

interface ImageUploadProps {
  onUploadSuccess?: (result: { id: string; url: string; filename: string }) => void
  onUploadError?: (error: string) => void
  onDeleteSuccess?: () => void
  onDeleteError?: (error: string) => void
  currentImageUrl?: string
  currentImageId?: string
  disabled?: boolean
  className?: string
  maxSizeMB?: number
  acceptedTypes?: string[]
}

interface UploadState {
  isUploading: boolean
  isDeleting: boolean
  progress: number
  error: string | null
  previewUrl: string | null
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  onDeleteError,
  currentImageUrl,
  currentImageId,
  disabled = false,
  className = '',
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: ImageUploadProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isDeleting: false,
    progress: 0,
    error: null,
    previewUrl: null
  })

  // 重置状态
  const resetState = useCallback(() => {
    setUploadState(prev => ({
      ...prev,
      error: null,
      progress: 0
    }))
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) {
      const error = '请先登录'
      setUploadState(prev => ({ ...prev, error }))
      onUploadError?.(error)
      return
    }

    resetState()

    try {
      // 验证文件
      validateImageFile(file)

      // 创建预览
      const previewUrl = createImagePreview(file)
      setUploadState(prev => ({ 
        ...prev, 
        previewUrl,
        isUploading: true 
      }))

      // 上传文件
      const result = await uploadImage(
        file,
        user.access_token,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }))
        }
      )

      // 清理预览URL
      revokeImagePreview(previewUrl)

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        previewUrl: null,
        progress: 100
      }))

      onUploadSuccess?.(result)

    } catch (error) {
      if (uploadState.previewUrl) {
        revokeImagePreview(uploadState.previewUrl)
      }

      const errorMessage = error instanceof ImageUploadError 
        ? error.message 
        : '上传失败，请重试'

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        previewUrl: null,
        error: errorMessage
      }))

      onUploadError?.(errorMessage)
    }
  }, [user, uploadState.previewUrl, onUploadSuccess, onUploadError, resetState])

  // 处理文件删除
  const handleDelete = useCallback(async () => {
    if (!user || !currentImageId) {
      return
    }

    setUploadState(prev => ({ ...prev, isDeleting: true, error: null }))

    try {
      await deleteImage(currentImageId, user.access_token)
      
      setUploadState(prev => ({ ...prev, isDeleting: false }))
      onDeleteSuccess?.()

    } catch (error) {
      const errorMessage = error instanceof ImageUploadError 
        ? error.message 
        : '删除失败，请重试'

      setUploadState(prev => ({
        ...prev,
        isDeleting: false,
        error: errorMessage
      }))

      onDeleteError?.(errorMessage)
    }
  }, [user, currentImageId, onDeleteSuccess, onDeleteError])

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || uploadState.isUploading) {
      return
    }

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => acceptedTypes.includes(file.type))

    if (imageFile) {
      handleFileSelect(imageFile)
    } else {
      const error = '请选择支持的图片格式'
      setUploadState(prev => ({ ...prev, error }))
      onUploadError?.(error)
    }
  }, [disabled, uploadState.isUploading, acceptedTypes, handleFileSelect, onUploadError])

  // 处理点击上传
  const handleClick = useCallback(() => {
    if (!disabled && !uploadState.isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, uploadState.isUploading])

  // 处理文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [handleFileSelect])

  const hasCurrentImage = currentImageUrl && !uploadState.previewUrl
  const showPreview = uploadState.previewUrl || hasCurrentImage
  const isLoading = uploadState.isUploading || uploadState.isDeleting

  return (
    <div className={`relative ${className}`}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* 上传区域 - 响应式设计 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer
          transition-colors duration-200 min-h-[120px] md:min-h-[160px]
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 active:border-blue-400'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${showPreview ? 'border-solid border-gray-200' : ''}
        `}
      >
        {/* 图片预览 */}
        {showPreview && (
          <div className="relative">
            {uploadState.previewUrl ? (
              <img
                src={uploadState.previewUrl}
                alt="预览"
                className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
              />
            ) : (
              <img
                src={currentImageUrl}
                alt="预览"
                className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
                loading="lazy"
              />
            )}
            
            {/* 删除按钮 */}
            {hasCurrentImage && !isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="删除图片"
              >
                ×
              </button>
            )}

            {/* 上传进度覆盖层 */}
            {uploadState.isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="mb-2">上传中...</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <div className="text-sm mt-1">{uploadState.progress}%</div>
                </div>
              </div>
            )}

            {/* 删除进度覆盖层 */}
            {uploadState.isDeleting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white">删除中...</div>
              </div>
            )}
          </div>
        )}

        {/* 上传提示 - 响应式文本 */}
        {!showPreview && (
          <div className="py-6 md:py-8">
            <div className="text-3xl md:text-4xl text-gray-400 mb-3 md:mb-4">📷</div>
            <div className="text-base md:text-lg font-medium text-gray-700 mb-2">
              {isDragOver ? '释放以上传图片' : '点击或拖拽上传图片'}
            </div>
            <div className="text-xs md:text-sm text-gray-500 px-2">
              支持 {acceptedTypes.map(type => type.split('/')[1]).join(', ')} 格式，
              最大 {maxSizeMB}MB
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && !showPreview && (
          <div className="py-8">
            <div className="text-4xl text-gray-400 mb-4">⏳</div>
            <div className="text-lg font-medium text-gray-700">
              {uploadState.isUploading ? '上传中...' : '删除中...'}
            </div>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {uploadState.error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {uploadState.error}
        </div>
      )}

      {/* 成功信息 */}
      {uploadState.progress === 100 && !uploadState.error && !uploadState.isUploading && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
          上传成功！
        </div>
      )}
    </div>
  )
}