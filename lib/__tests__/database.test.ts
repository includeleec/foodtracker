// 数据库配置测试

import { describe, it, expect, beforeAll } from '@jest/globals'

// 模拟环境变量
const mockEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
  CLOUDFLARE_IMAGES_TOKEN: 'test-images-token'
}

describe('Database Configuration', () => {
  beforeAll(() => {
    // 设置测试环境变量
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value
    })
  })

  it('should validate required environment variables', () => {
    const { getConfig } = require('../config')
    
    expect(() => getConfig()).not.toThrow()
    
    const config = getConfig()
    expect(config.supabase.url).toBe(mockEnvVars.NEXT_PUBLIC_SUPABASE_URL)
    expect(config.supabase.anonKey).toBe(mockEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  })

  it('should throw error for missing environment variables', () => {
    // 临时删除环境变量
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    
    const { getConfig } = require('../config')
    
    expect(() => getConfig()).toThrow('Missing required environment variable')
    
    // 恢复环境变量
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  })

  it('should validate Supabase URL format', () => {
    const { validateConfig } = require('../config')
    
    expect(validateConfig()).toBe(true)
  })
})

describe('Database Types', () => {
  it('should have correct type exports', () => {
    const types = require('../../types/database')
    
    // 验证类型定义文件可以正确导入
    expect(types).toBeDefined()
    
    // 在 TypeScript 中，接口在运行时不存在，所以我们只验证模块可以加载
    expect(typeof types).toBe('object')
  })
})

describe('Database Service', () => {
  it('should export FoodRecordService class', () => {
    // 由于我们没有实际的 Supabase 连接，这里只测试类的存在
    const { FoodRecordService } = require('../database')
    
    expect(FoodRecordService).toBeDefined()
    expect(typeof FoodRecordService.getFoodRecordsByDate).toBe('function')
    expect(typeof FoodRecordService.createFoodRecord).toBe('function')
    expect(typeof FoodRecordService.updateFoodRecord).toBe('function')
    expect(typeof FoodRecordService.deleteFoodRecord).toBe('function')
  })

  it('should export AuthService class', () => {
    const { AuthService } = require('../database')
    
    expect(AuthService).toBeDefined()
    expect(typeof AuthService.getCurrentUser).toBe('function')
    expect(typeof AuthService.signUp).toBe('function')
    expect(typeof AuthService.signIn).toBe('function')
    expect(typeof AuthService.signOut).toBe('function')
  })
})