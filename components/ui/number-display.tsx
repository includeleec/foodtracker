/**
 * 数值显示组件 - 专门用于展示热量、体重等数值信息
 */

'use client'

import React, { useEffect, useState } from 'react'
import { numberDisplayVariants, type NumberDisplayVariants } from '@/lib/component-variants'
import { cn } from '@/lib/utils'

interface NumberDisplayProps extends NumberDisplayVariants {
  value: number
  unit?: string
  label?: string
  precision?: number
  animated?: boolean
  className?: string
  prefix?: string
  suffix?: string
}

export function NumberDisplay({
  value,
  unit,
  label,
  precision = 0,
  animated = false,
  type = 'default',
  size = 'default',
  className,
  prefix,
  suffix
}: NumberDisplayProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value)

  // 数字动画效果
  useEffect(() => {
    if (animated && value !== displayValue) {
      const duration = 800 // 动画持续时间
      const steps = 60 // 动画步数
      const stepValue = (value - displayValue) / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(prev => prev + stepValue)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [value, displayValue, animated])

  const formattedValue = displayValue.toFixed(precision)

  return (
    <div className={cn('text-center', className)}>
      {label && (
        <div className="text-sm text-gray-600 mb-1 font-medium">
          {label}
        </div>
      )}
      
      <div className="flex items-baseline justify-center gap-1">
        {prefix && (
          <span className="text-gray-500 text-sm">{prefix}</span>
        )}
        
        <span className={cn(
          numberDisplayVariants({ type, size }),
          animated && 'transition-all duration-100'
        )}>
          {formattedValue}
        </span>
        
        {unit && (
          <span className={cn(
            'text-gray-500 font-normal',
            size === 'sm' && 'text-xs',
            size === 'default' && 'text-sm', 
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg',
            size === '2xl' && 'text-xl',
            size === '3xl' && 'text-2xl'
          )}>
            {unit}
          </span>
        )}
        
        {suffix && (
          <span className="text-gray-500 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  )
}

/**
 * 热量显示组件 - 专门用于显示热量值
 */
interface CaloriesDisplayProps {
  calories: number
  target?: number
  size?: NumberDisplayVariants['size']
  showProgress?: boolean
  animated?: boolean
  className?: string
}

export function CaloriesDisplay({
  calories,
  target,
  size = '2xl',
  showProgress = false,
  animated = true,
  className
}: CaloriesDisplayProps) {
  const percentage = target ? Math.min((calories / target) * 100, 100) : 0

  return (
    <div className={cn('space-y-3', className)}>
      <NumberDisplay
        value={calories}
        unit="卡路里"
        type="calories"
        size={size}
        animated={animated}
        className="text-center"
      />
      
      {showProgress && target && (
        <div className="space-y-2">
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-1000 ease-out',
                percentage >= 100 
                  ? 'bg-accent-success' 
                  : percentage >= 80 
                    ? 'bg-accent-warning'
                    : 'bg-accent-calories'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* 进度文字 */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>已摄入: {calories}</span>
            <span>目标: {target}</span>
          </div>
          
          {/* 完成度百分比 */}
          <div className="text-center">
            <span className={cn(
              'text-sm font-medium',
              percentage >= 100 ? 'text-accent-success' : 'text-gray-600'
            )}>
              完成度: {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 统计卡片组件 - 用于显示各种统计数值
 */
interface StatsCardProps {
  title: string
  value: number
  unit: string
  trend?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
  }
  icon?: React.ReactNode
  type?: NumberDisplayVariants['type']
  className?: string
}

export function StatsCard({
  title,
  value,
  unit,
  trend,
  icon,
  type = 'default',
  className
}: StatsCardProps) {
  const getTrendColor = (trendType: 'increase' | 'decrease' | 'neutral') => {
    switch (trendType) {
      case 'increase': return 'text-accent-success'
      case 'decrease': return 'text-accent-error'
      case 'neutral': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getTrendIcon = (trendType: 'increase' | 'decrease' | 'neutral') => {
    switch (trendType) {
      case 'increase': return '↗️'
      case 'decrease': return '↘️'
      case 'neutral': return '➡️'
      default: return '➡️'
    }
  }

  return (
    <div className={cn(
      'p-6 rounded-card bg-surface border border-gray-200',
      'hover:shadow-md transition-all duration-200',
      className
    )}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className="text-2xl opacity-80">{icon}</div>
        )}
      </div>
      
      {/* 主要数值 */}
      <NumberDisplay
        value={value}
        unit={unit}
        type={type}
        size="xl"
        animated={true}
        className="mb-4"
      />
      
      {/* 趋势信息 */}
      {trend && (
        <div className={cn(
          'flex items-center text-sm',
          getTrendColor(trend.type)
        )}>
          <span className="mr-1">
            {getTrendIcon(trend.type)}
          </span>
          <span className="font-medium">
            {Math.abs(trend.value).toFixed(1)} {unit}
          </span>
          <span className="text-gray-500 ml-1">
            ({trend.period})
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * 环形进度组件 - 用于显示热量完成度等圆形进度
 */
interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
  className?: string
  color?: string
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  children,
  className,
  color = '#F6B74A'
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* 中心内容 */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}