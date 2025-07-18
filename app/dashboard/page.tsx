'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 今日记录卡片 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📝</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    今日记录
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    记录今天的饮食
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button
                onClick={() => router.push('/dashboard/today')}
                className="w-full"
              >
                开始记录
              </Button>
            </div>
          </div>
        </div>

        {/* 历史记录卡片 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    历史记录
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    查看过往记录
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button
                onClick={() => router.push('/dashboard/history')}
                variant="outline"
                className="w-full"
              >
                查看历史
              </Button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    数据统计
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    饮食分析报告
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                即将推出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 快速开始指南 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          快速开始
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
              1
            </span>
            <span>点击"开始记录"按钮，添加您的第一条食物记录</span>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
              2
            </span>
            <span>选择餐次类型（早餐、中餐、晚餐、加餐）</span>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
              3
            </span>
            <span>填写食物名称、重量、卡路里，可选择上传食物图片</span>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
              4
            </span>
            <span>保存记录，系统会自动计算当日总卡路里</span>
          </div>
        </div>
      </div>
    </div>
  )
}