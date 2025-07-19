// 重试配置接口
export interface RetryConfig {
  maxAttempts: number
  delay: number
  backoff: 'linear' | 'exponential'
  retryCondition?: (error: any) => boolean
}

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  retryCondition: (error) => {
    // 重试网络错误和服务器错误
    if (error?.name === 'NetworkError') return true
    if (error?.status >= 500) return true
    if (error?.code === 'NETWORK_ERROR') return true
    if (error?.message?.includes('fetch')) return true
    return false
  }
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 计算重试延迟
export function calculateDelay(attempt: number, config: RetryConfig): number {
  if (config.backoff === 'exponential') {
    return config.delay * Math.pow(2, attempt - 1)
  }
  return config.delay * attempt
}

// 通用重试函数
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: any

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 检查是否应该重试
      if (attempt === finalConfig.maxAttempts || !finalConfig.retryCondition?.(error)) {
        throw error
      }

      // 计算延迟并等待
      const delayMs = calculateDelay(attempt, finalConfig)
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms:`, error)
      await delay(delayMs)
    }
  }

  throw lastError
}

// 网络请求重试包装器
export async function fetchWithRetry(
  url: string, 
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options)
    
    // 检查响应状态
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).status = response.status
      ;(error as any).response = response
      throw error
    }
    
    return response
  }, retryConfig)
}

// API 调用重试包装器
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(apiCall, {
    ...DEFAULT_RETRY_CONFIG,
    retryCondition: (error) => {
      // API 特定的重试条件
      if (error?.status === 429) return true // 限流
      if (error?.status >= 500) return true // 服务器错误
      if (error?.name === 'NetworkError') return true
      if (error?.code === 'NETWORK_ERROR') return true
      return false
    },
    ...retryConfig
  })
}