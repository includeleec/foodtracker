'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 可以在这里添加错误报告服务
    // reportError(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

// 默认错误回退组件
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">出现了错误</h1>
        <p className="text-gray-600 mb-4">
          很抱歉，应用遇到了意外错误。请尝试刷新页面或联系技术支持。
        </p>
        <details className="text-left mb-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            查看错误详情
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n${error.stack}`}
          </pre>
        </details>
        <div className="space-y-2">
          <Button onClick={resetError} className="w-full">
            重试
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            刷新页面
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // 可以在这里触发错误边界
    throw error
  }
}