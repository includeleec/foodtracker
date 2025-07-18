// 性能监控和优化工具

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  // 初始化性能观察器
  private initializeObservers() {
    if (typeof window === 'undefined') return

    // 观察导航时间
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, 'timing')
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'timing')
              this.recordMetric('first_paint', navEntry.responseEnd - navEntry.fetchStart, 'timing')
            }
          }
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)
      } catch (error) {
        console.warn('Navigation observer not supported:', error)
      }

      // 观察资源加载时间
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming
              if (resourceEntry.name.includes('api/')) {
                this.recordMetric('api_request_time', resourceEntry.duration, 'timing')
              } else if (resourceEntry.name.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
                this.recordMetric('image_load_time', resourceEntry.duration, 'timing')
              }
            }
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (error) {
        console.warn('Resource observer not supported:', error)
      }

      // 观察 Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.recordMetric('largest_contentful_paint', lastEntry.startTime, 'timing')
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP observer not supported:', error)
      }

      // 观察 First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('first_input_delay', entry.processingStart - entry.startTime, 'timing')
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('FID observer not supported:', error)
      }
    }
  }

  // 记录性能指标
  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'gauge') {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      type
    })

    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  // 测量函数执行时间
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration, 'timing')
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration, 'timing')
      throw error
    }
  }

  // 测量同步函数执行时间
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration, 'timing')
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration, 'timing')
      throw error
    }
  }

  // 获取性能统计
  getStats(): {
    averages: Record<string, number>
    counts: Record<string, number>
    recent: PerformanceMetric[]
  } {
    const averages: Record<string, number> = {}
    const counts: Record<string, number> = {}

    // 计算平均值和计数
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = []
      }
      groups[metric.name].push(metric.value)
      return groups
    }, {} as Record<string, number[]>)

    Object.entries(metricGroups).forEach(([name, values]) => {
      counts[name] = values.length
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    })

    // 获取最近的指标
    const recent = this.metrics.slice(-50)

    return { averages, counts, recent }
  }

  // 获取 Web Vitals 指标
  getWebVitals(): {
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
    fcp?: number // First Contentful Paint
    ttfb?: number // Time to First Byte
  } {
    const stats = this.getStats()
    return {
      lcp: stats.averages.largest_contentful_paint,
      fid: stats.averages.first_input_delay,
      fcp: stats.averages.first_paint,
      ttfb: stats.averages.page_load_time
    }
  }

  // 清理观察器
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  // 导出性能数据
  exportData(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      stats: this.getStats(),
      webVitals: this.getWebVitals(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }, null, 2)
  }
}

// 单例实例
export const performanceMonitor = new PerformanceMonitor()

// React Hook for performance monitoring
import { useEffect, useState } from 'react'

export function usePerformanceMonitoring() {
  const [stats, setStats] = useState(performanceMonitor.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats())
    }, 5000) // 每5秒更新一次

    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    webVitals: performanceMonitor.getWebVitals(),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor)
  }
}

// 性能优化建议
export function getPerformanceRecommendations(stats: ReturnType<typeof performanceMonitor.getStats>) {
  const recommendations: string[] = []

  if (stats.averages.page_load_time > 3000) {
    recommendations.push('页面加载时间过长，考虑优化资源加载')
  }

  if (stats.averages.api_request_time > 1000) {
    recommendations.push('API 请求时间过长，考虑添加缓存或优化查询')
  }

  if (stats.averages.image_load_time > 2000) {
    recommendations.push('图片加载时间过长，考虑压缩图片或使用懒加载')
  }

  if (stats.averages.largest_contentful_paint > 2500) {
    recommendations.push('LCP 指标较差，考虑优化关键资源加载')
  }

  if (stats.averages.first_input_delay > 100) {
    recommendations.push('FID 指标较差，考虑减少主线程阻塞')
  }

  return recommendations
}

// 内存使用监控
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null
  }

  const memory = (performance as any).memory
  return {
    used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
    total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
  }
}

// 网络状态监控
export function getNetworkInfo(): {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
} | null {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return null
  }

  const connection = (navigator as any).connection
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  }
}