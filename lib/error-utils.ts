// 错误处理工具函数

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  stack?: string
}

export class CustomError extends Error {
  public code: string
  public details?: any
  public timestamp: Date

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'CustomError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

// 错误代码常量
export const ERROR_CODES = {
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // 认证错误
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // 服务器错误
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // 业务逻辑错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  OPERATION_FAILED: 'OPERATION_FAILED',
  
  // 文件上传错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // 未知错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// 错误消息映射
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败，请检查您的网络设置',
  [ERROR_CODES.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  [ERROR_CODES.CONNECTION_ERROR]: '连接服务器失败，请稍后重试',
  
  [ERROR_CODES.AUTH_ERROR]: '身份验证失败，请重新登录',
  [ERROR_CODES.UNAUTHORIZED]: '您没有权限执行此操作',
  [ERROR_CODES.FORBIDDEN]: '访问被拒绝',
  
  [ERROR_CODES.VALIDATION_ERROR]: '输入数据验证失败',
  [ERROR_CODES.INVALID_INPUT]: '输入数据格式不正确',
  
  [ERROR_CODES.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ERROR_CODES.DATABASE_ERROR]: '数据库操作失败',
  
  [ERROR_CODES.RESOURCE_NOT_FOUND]: '请求的资源不存在',
  [ERROR_CODES.DUPLICATE_RESOURCE]: '资源已存在',
  [ERROR_CODES.OPERATION_FAILED]: '操作失败，请重试',
  
  [ERROR_CODES.FILE_TOO_LARGE]: '文件大小超出限制',
  [ERROR_CODES.INVALID_FILE_TYPE]: '不支持的文件类型',
  [ERROR_CODES.UPLOAD_FAILED]: '文件上传失败',
  
  [ERROR_CODES.UNKNOWN_ERROR]: '发生未知错误，请稍后重试'
}

// 错误分类函数
export function categorizeError(error: any): AppError {
  const timestamp = new Date()
  
  // 网络错误
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      details: error,
      timestamp
    }
  }
  
  // HTTP 状态码错误
  if (error?.status || error?.response?.status) {
    const status = error.status || error.response.status
    
    switch (status) {
      case 401:
        return {
          code: ERROR_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
          details: error,
          timestamp
        }
      case 403:
        return {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
          details: error,
          timestamp
        }
      case 404:
        return {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: ERROR_MESSAGES[ERROR_CODES.RESOURCE_NOT_FOUND],
          details: error,
          timestamp
        }
      case 409:
        return {
          code: ERROR_CODES.DUPLICATE_RESOURCE,
          message: ERROR_MESSAGES[ERROR_CODES.DUPLICATE_RESOURCE],
          details: error,
          timestamp
        }
      case 422:
        return {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
          details: error,
          timestamp
        }
      case 429:
        return {
          code: ERROR_CODES.TIMEOUT_ERROR,
          message: '请求过于频繁，请稍后重试',
          details: error,
          timestamp
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: ERROR_CODES.SERVER_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          details: error,
          timestamp
        }
    }
  }
  
  // 自定义错误
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack
    }
  }
  
  // 验证错误
  if (error?.name === 'ValidationError' || error?.code === 'VALIDATION_ERROR') {
    return {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: error.message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
      details: error,
      timestamp
    }
  }
  
  // 超时错误
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
    return {
      code: ERROR_CODES.TIMEOUT_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
      details: error,
      timestamp
    }
  }
  
  // 默认未知错误
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error?.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: error,
    timestamp,
    stack: error?.stack
  }
}

// 错误处理函数
export function handleError(error: any, context?: string): AppError {
  const appError = categorizeError(error)
  
  // 记录错误日志
  console.error(`Error in ${context || 'unknown context'}:`, {
    code: appError.code,
    message: appError.message,
    details: appError.details,
    timestamp: appError.timestamp,
    stack: appError.stack
  })
  
  // 在生产环境中，可以发送错误到监控服务
  if (process.env.NODE_ENV === 'production') {
    // reportErrorToService(appError, context)
  }
  
  return appError
}

// 用户友好的错误消息
export function getUserFriendlyMessage(error: any): string {
  const appError = categorizeError(error)
  return appError.message
}

// 判断是否为可重试的错误
export function isRetryableError(error: any): boolean {
  const appError = categorizeError(error)
  
  const retryableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.CONNECTION_ERROR,
    ERROR_CODES.SERVER_ERROR
  ]
  
  return retryableCodes.includes(appError.code as any)
}

// 错误报告函数（可以集成第三方服务）
export function reportError(error: AppError, context?: string, userId?: string) {
  // 这里可以集成 Sentry、LogRocket 等错误监控服务
  console.error('Error Report:', {
    ...error,
    context,
    userId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  })
}