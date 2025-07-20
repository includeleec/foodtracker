'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台或错误报告服务
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">💥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">应用出错了</h1>
        <p className="text-gray-600 mb-4">
          很抱歉，应用遇到了意外错误。我们已经记录了这个问题，请尝试重新加载。
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              开发模式 - 查看错误详情
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="space-y-2">
          <button 
            onClick={reset} 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}