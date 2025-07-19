import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResult {
  success: boolean
  user?: User | null
  error?: AuthError
}

export class AuthService {
  /**
   * 用户注册
   */
  static async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            code: error.message
          }
        }
      }

      return {
        success: true,
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: '注册失败，请稍后重试'
        }
      }
    }
  }

  /**
   * 用户登录
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            code: error.message
          }
        }
      }

      return {
        success: true,
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: '登录失败，请稍后重试'
        }
      }
    }
  }

  /**
   * 用户登出
   */
  static async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: {
            message: '登出失败，请稍后重试'
          }
        }
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: '登出失败，请稍后重试'
        }
      }
    }
  }

  /**
   * 获取当前用户
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      return null
    }
  }

  /**
   * 获取当前会话
   */
  static async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      return null
    }
  }

  /**
   * 监听认证状态变化
   */
  static onAuthStateChange(callback: (user: User | null, session?: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // 处理不同的认证事件
      switch (event) {
        case 'SIGNED_IN':
          callback(session?.user ?? null, session)
          break
        case 'SIGNED_OUT':
          callback(null, null)
          break
        case 'TOKEN_REFRESHED':
          callback(session?.user ?? null, session)
          break
        case 'USER_UPDATED':
          callback(session?.user ?? null, session)
          break
        default:
          callback(session?.user ?? null, session)
      }
    })
  }

  /**
   * 将 Supabase 错误消息转换为中文
   */
  private static getErrorMessage(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': '邮箱或密码错误',
      'Email not confirmed': '请先验证您的邮箱',
      'User already registered': '该邮箱已被注册',
      'Password should be at least 6 characters': '密码至少需要6个字符',
      'Invalid email': '邮箱格式不正确',
      'Signup is disabled': '注册功能已禁用',
      'Email rate limit exceeded': '邮件发送频率过高，请稍后重试',
      'Too many requests': '请求过于频繁，请稍后重试'
    }

    return errorMap[errorMessage] || '操作失败，请稍后重试'
  }
}