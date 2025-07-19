'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { fixCloudflareImageUrl, isValidCloudflareImageUrl } from '@/lib/cloudflare-images'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) {
  // 修复和验证图片 URL
  const fixedSrc = src ? fixCloudflareImageUrl(src) : src
  
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // 如果是优先级图片，直接显示
  const [currentSrc, setCurrentSrc] = useState(fixedSrc)
  const imgRef = useRef<HTMLDivElement>(null)

  // 监听src变化，重新设置currentSrc
  useEffect(() => {
    const newFixedSrc = src ? fixCloudflareImageUrl(src) : src
    if (newFixedSrc !== currentSrc) {
      setCurrentSrc(newFixedSrc)
      setHasError(false)
      setIsLoading(true)
    }
  }, [src, currentSrc])

  // 懒加载逻辑
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [priority, isInView])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    console.warn('Image failed to load:', currentSrc)
    
    // 如果当前是修复后的URL失败了，尝试原始URL
    if (currentSrc === fixedSrc && fixedSrc !== src) {
      console.log('Trying original URL:', src)
      setCurrentSrc(src)
      setIsLoading(true)
      return
    }
    
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // 生成低质量占位符
  const generateBlurDataURL = (width: number, height: number) => {
    if (blurDataURL) return blurDataURL
    
    // 生成简单的灰色占位符
    const canvas = document.createElement('canvas')
    canvas.width = width || 40
    canvas.height = height || 40
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return canvas.toDataURL()
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {hasError ? (
        // 错误状态显示回退内容
        fallback || (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">🖼️</span>
          </div>
        )
      ) : isInView ? (
        // 图片加载
        <>
          <Image
            src={currentSrc}
            alt={alt}
            fill={!width && !height}
            width={width}
            height={height}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            sizes={sizes}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={placeholder === 'blur' ? generateBlurDataURL(width || 40, height || 40) : undefined}
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {/* 加载状态覆盖层 */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        // 懒加载占位符
        <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
          <span className="text-gray-400">📷</span>
        </div>
      )}
    </div>
  )
}

// 预设尺寸的优化图片组件
export function FoodImage({ 
  src, 
  alt, 
  className,
  priority = false 
}: { 
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={64}
      height={64}
      className={cn('rounded-lg object-cover', className)}
      sizes="64px"
      quality={80}
      priority={priority}
      placeholder="blur"
      fallback={
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-2xl">🍽️</span>
        </div>
      }
    />
  )
}

// 大图预览组件
export function FoodImageLarge({ 
  src, 
  alt, 
  className,
  priority = false 
}: { 
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('w-full max-h-48 object-contain', className)}
      sizes="(max-width: 768px) 100vw, 50vw"
      quality={85}
      priority={priority}
      placeholder="blur"
      fallback={
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-4xl">🖼️</span>
        </div>
      }
    />
  )
}