import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-600 mb-6">
          抱歉，您访问的页面不存在或已被移动。
        </p>
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button className="w-full">
              返回仪表板
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}