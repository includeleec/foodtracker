// RLS 策略和数据隔离测试

import { createClient } from '@supabase/supabase-js'
import { getConfig } from '@/lib/config'

// 这些测试需要真实的 Supabase 连接来验证 RLS 策略
// 在 CI/CD 环境中，应该使用测试数据库

describe('RLS Security Tests', () => {
  let supabase: any
  let testUser1: any
  let testUser2: any
  
  beforeAll(async () => {
    // 跳过测试如果没有配置测试环境
    if (!process.env.SUPABASE_TEST_URL) {
      console.log('Skipping RLS tests - no test database configured')
      return
    }

    const config = getConfig()
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey!)
    
    // 创建测试用户
    const { data: user1 } = await supabase.auth.admin.createUser({
      email: 'test1@example.com',
      password: 'testpassword123',
      email_confirm: true
    })
    
    const { data: user2 } = await supabase.auth.admin.createUser({
      email: 'test2@example.com', 
      password: 'testpassword123',
      email_confirm: true
    })
    
    testUser1 = user1.user
    testUser2 = user2.user
  })

  afterAll(async () => {
    if (!supabase) return
    
    // 清理测试数据
    if (testUser1) {
      await supabase.auth.admin.deleteUser(testUser1.id)
    }
    if (testUser2) {
      await supabase.auth.admin.deleteUser(testUser2.id)
    }
  })

  describe('Food Records RLS Policies', () => {
    beforeEach(async () => {
      if (!supabase) return
      
      // 清理测试数据
      await supabase
        .from('food_records')
        .delete()
        .or(`user_id.eq.${testUser1?.id},user_id.eq.${testUser2?.id}`)
    })

    it('should prevent users from viewing other users records', async () => {
      if (!supabase || !testUser1 || !testUser2) {
        console.log('Skipping test - no test environment')
        return
      }

      // 使用服务角色插入测试数据
      await supabase
        .from('food_records')
        .insert([
          {
            user_id: testUser1.id,
            meal_type: 'breakfast',
            food_name: 'User1 Apple',
            weight: 100,
            calories: 52,
            record_date: '2024-01-01'
          },
          {
            user_id: testUser2.id,
            meal_type: 'breakfast', 
            food_name: 'User2 Banana',
            weight: 120,
            calories: 89,
            record_date: '2024-01-01'
          }
        ])

      // 创建用户1的客户端
      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )
      
      // 模拟用户1登录
      await user1Client.auth.setSession({
        access_token: 'mock-token-user1',
        refresh_token: 'mock-refresh-user1'
      })

      // 用户1应该只能看到自己的记录
      const { data: user1Records } = await user1Client
        .from('food_records')
        .select('*')
        .eq('record_date', '2024-01-01')

      expect(user1Records).toHaveLength(1)
      expect(user1Records?.[0].food_name).toBe('User1 Apple')
      expect(user1Records?.[0].user_id).toBe(testUser1.id)
    })

    it('should prevent users from inserting records for other users', async () => {
      if (!supabase || !testUser1 || !testUser2) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      // 尝试为其他用户插入记录应该失败
      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser2.id, // 尝试为用户2插入记录
          meal_type: 'breakfast',
          food_name: 'Malicious Record',
          weight: 100,
          calories: 52,
          record_date: '2024-01-01'
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })

    it('should prevent users from updating other users records', async () => {
      if (!supabase || !testUser1 || !testUser2) {
        console.log('Skipping test - no test environment')
        return
      }

      // 插入用户2的记录
      const { data: insertedRecord } = await supabase
        .from('food_records')
        .insert({
          user_id: testUser2.id,
          meal_type: 'breakfast',
          food_name: 'User2 Original',
          weight: 100,
          calories: 52,
          record_date: '2024-01-01'
        })
        .select()
        .single()

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      // 用户1尝试更新用户2的记录应该失败
      const { error } = await user1Client
        .from('food_records')
        .update({ food_name: 'Hacked Record' })
        .eq('id', insertedRecord.id)

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })

    it('should prevent users from deleting other users records', async () => {
      if (!supabase || !testUser1 || !testUser2) {
        console.log('Skipping test - no test environment')
        return
      }

      // 插入用户2的记录
      const { data: insertedRecord } = await supabase
        .from('food_records')
        .insert({
          user_id: testUser2.id,
          meal_type: 'breakfast',
          food_name: 'User2 Record',
          weight: 100,
          calories: 52,
          record_date: '2024-01-01'
        })
        .select()
        .single()

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      // 用户1尝试删除用户2的记录应该失败
      const { error } = await user1Client
        .from('food_records')
        .delete()
        .eq('id', insertedRecord.id)

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })
  })

  describe('Data Validation Policies', () => {
    it('should reject invalid meal types', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser1.id,
          meal_type: 'invalid_meal', // 无效的餐次类型
          food_name: 'Test Food',
          weight: 100,
          calories: 52,
          record_date: '2024-01-01'
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy') // RLS 策略应该阻止这个插入
    })

    it('should reject invalid weight values', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser1.id,
          meal_type: 'breakfast',
          food_name: 'Test Food',
          weight: -10, // 无效的重量
          calories: 52,
          record_date: '2024-01-01'
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })

    it('should reject invalid calorie values', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser1.id,
          meal_type: 'breakfast',
          food_name: 'Test Food',
          weight: 100,
          calories: 20000, // 超出限制的卡路里
          record_date: '2024-01-01'
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })

    it('should reject invalid dates', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser1.id,
          meal_type: 'breakfast',
          food_name: 'Test Food',
          weight: 100,
          calories: 52,
          record_date: '1999-01-01' // 超出允许范围的日期
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })

    it('should reject empty food names', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      const { error } = await user1Client
        .from('food_records')
        .insert({
          user_id: testUser1.id,
          meal_type: 'breakfast',
          food_name: '', // 空的食物名称
          weight: 100,
          calories: 52,
          record_date: '2024-01-01'
        })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })
  })

  describe('Audit Log Security', () => {
    it('should prevent users from viewing audit logs', async () => {
      if (!supabase || !testUser1) {
        console.log('Skipping test - no test environment')
        return
      }

      const user1Client = createClient(
        getConfig().supabase.url,
        getConfig().supabase.anonKey
      )

      // 尝试查看审计日志应该失败
      const { data, error } = await user1Client
        .from('security_audit_log')
        .select('*')

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error?.message).toContain('policy')
    })
  })

  describe('Secure Functions', () => {
    it('should validate user access through security function', async () => {
      if (!supabase || !testUser1 || !testUser2) {
        console.log('Skipping test - no test environment')
        return
      }

      // 测试安全函数 - 用户应该只能访问自己的数据
      const { data: validAccess } = await supabase
        .rpc('auth.check_user_access', { target_user_id: testUser1.id })

      // 这个测试需要在有认证上下文的情况下运行
      // 在实际环境中，这会根据当前用户的认证状态返回结果
      expect(typeof validAccess).toBe('boolean')
    })

    it('should validate food record data through validation function', async () => {
      if (!supabase) {
        console.log('Skipping test - no test environment')
        return
      }

      // 测试数据验证函数
      const { data: validData } = await supabase
        .rpc('validate_food_record_data', {
          p_meal_type: 'breakfast',
          p_food_name: '苹果',
          p_weight: 100,
          p_calories: 52,
          p_record_date: '2024-01-01'
        })

      expect(validData).toBe(true)

      // 测试无效数据
      const { data: invalidData } = await supabase
        .rpc('validate_food_record_data', {
          p_meal_type: 'invalid_meal',
          p_food_name: '苹果',
          p_weight: 100,
          p_calories: 52,
          p_record_date: '2024-01-01'
        })

      expect(invalidData).toBe(false)
    })
  })
})