'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录全局错误
    console.error('Global Error:', error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">系统错误</h1>
            <p className="text-gray-600 mb-4">
              应用遇到了严重错误。请刷新页面或稍后再试。
            </p>
            <div className="space-y-2">
              <button 
                onClick={reset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}