'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ButtonLoading } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { AuthService } from '@/lib/auth'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSuccess?: () => void
  onModeChange?: (mode: 'login' | 'register') => void
}

export function AuthForm({ mode, onSuccess, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // 表单验证
    if (!email || !password) {
      setError('请填写所有必填字段')
      setIsLoading(false)
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      setIsLoading(false)
      return
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      setIsLoading(false)
      return
    }

    try {
      let result
      if (mode === 'login') {
        result = await AuthService.signIn(email, password)
      } else {
        result = await AuthService.signUp(email, password)
      }

      if (result.success) {
        if (mode === 'register') {
          // 显示成功消息
          setSuccess('注册成功！请检查您的邮箱并点击验证链接完成注册。')
          // 清空表单
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        } else {
          onSuccess?.()
        }
      } else {
        setError(result.error?.message || '操作失败，请稍后重试')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('网络连接错误，请检查网络后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6">
          {mode === 'login' ? '登录' : '注册'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              disabled={isLoading}
              className="mt-1 h-11" // 增加高度以便移动端操作
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              disabled={isLoading}
              className="mt-1 h-11"
            />
          </div>

          {mode === 'register' && (
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                required
                disabled={isLoading}
                className="mt-1 h-11"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <ButtonLoading text={mode === 'login' ? '登录中...' : '注册中...'} />
            ) : (
              mode === 'login' ? '登录' : '注册'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => onModeChange?.(mode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
            disabled={isLoading}
          >
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>
    </div>
  )
}