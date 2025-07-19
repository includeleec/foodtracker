# 安全文档

## 概述

本文档描述了每日食物记录应用的安全实现和最佳实践。应用采用了多层安全防护措施，确保用户数据的安全性和隐私性。

## 安全架构

### 1. 认证和授权

#### Supabase Auth 集成
- 使用 Supabase Auth 进行用户注册和登录
- JWT 令牌用于 API 认证
- 自动令牌刷新机制
- 安全的密码策略

#### API 路由保护
- 所有敏感 API 路由都需要有效的 JWT 令牌
- JWT 格式验证防止恶意令牌
- 用户身份验证失败时返回适当的错误响应

### 2. 数据安全

#### 行级安全策略 (RLS)
- 启用 Supabase RLS 确保数据隔离
- 用户只能访问自己的食物记录
- 数据库级别的权限控制
- 审计日志记录所有数据变更

#### 数据验证
- 服务器端数据验证
- 输入清理和转义
- 数据类型和范围验证
- SQL 注入防护

### 3. Web 安全

#### XSS 防护
- HTML 内容转义
- 用户输入清理
- Content Security Policy (CSP)
- X-XSS-Protection 头部

#### CSRF 防护
- 请求来源验证
- 安全头部设置
- SameSite Cookie 策略

#### 安全头部
```typescript
{
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': '...',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

### 4. 文件上传安全

#### 文件验证
- 文件类型白名单验证
- 文件大小限制 (10MB)
- 文件名安全检查
- 魔数验证防止文件类型伪造

#### Cloudflare Images 集成
- 安全的图片存储和处理
- 自动图片优化
- CDN 分发
- 访问控制

### 5. 速率限制

#### API 速率限制
- 通用 API: 100 请求/15分钟
- 图片上传: 20 请求/15分钟
- 基于 IP 地址的限制
- 自动清理过期条目

### 6. 错误处理

#### 安全错误响应
- 不泄露敏感信息的错误消息
- 统一的错误格式
- 适当的 HTTP 状态码
- 错误日志记录

## 安全实现

### 1. 安全工具函数

#### XSS 防护
```typescript
// HTML 转义
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// 输入清理
export function sanitizeInput(input: string): string {
  const withoutTags = input.replace(/<[^>]*>/g, '')
  return withoutTags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*[^;\s]+/gi, '')
    .trim()
}
```

#### SQL 注入防护
```typescript
export function validateSqlInput(input: string): boolean {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(';|--;|\|\||\/\*|\*\/)/g
  ]
  return !sqlInjectionPatterns.some(pattern => pattern.test(input))
}
```

#### 文件上传验证
```typescript
export function validateFileUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 文件大小检查
  if (file.size > 10 * 1024 * 1024) {
    errors.push('文件大小超过限制 (10MB)')
  }
  
  // 文件类型检查
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    errors.push(`不支持的文件类型: ${file.type}`)
  }
  
  return { valid: errors.length === 0, errors }
}
```

### 2. RLS 策略

#### 食物记录表策略
```sql
-- 用户只能查看自己的记录
CREATE POLICY "Users can view their own food records" ON food_records
  FOR SELECT USING (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL
  );

-- 用户只能插入自己的记录，并验证数据完整性
CREATE POLICY "Users can insert their own food records" ON food_records
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL AND
    meal_type IN ('breakfast', 'lunch', 'dinner', 'snack') AND
    food_name IS NOT NULL AND
    LENGTH(TRIM(food_name)) > 0 AND
    weight > 0 AND weight <= 10000 AND
    calories > 0 AND calories <= 10000
  );
```

### 3. API 安全中间件

```typescript
async function securityMiddleware(request: NextRequest): Promise<void> {
  // 验证请求来源
  if (!validateRequestOrigin(request, allowedOrigins)) {
    throw new Error('Invalid request origin')
  }
  
  // 速率限制
  const clientIp = request.headers.get('cf-connecting-ip') || 'unknown'
  const rateLimit = checkRateLimit(`api:${clientIp}`, 100, 15 * 60 * 1000)
  
  if (!rateLimit.allowed) {
    throw new Error('Rate limit exceeded')
  }
}
```

## 安全测试

### 1. 单元测试
- 安全工具函数测试
- 输入验证测试
- 文件上传安全测试

### 2. 集成测试
- API 安全测试
- 认证流程测试
- RLS 策略测试

### 3. 安全扫描
- 自动化安全扫描脚本
- 依赖漏洞检查
- 代码安全模式检查

### 运行安全测试
```bash
# 运行安全工具测试
npm test -- lib/__tests__/security-utils.test.ts

# 运行安全集成测试
npm test -- __tests__/security-integration.test.ts

# 运行安全扫描
npx tsx scripts/security-scan.ts
```

## 安全配置

### 1. 环境变量
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare Images 配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_IMAGES_TOKEN=your_images_token
```

### 2. Next.js 安全配置
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
          // ... 其他安全头部
        ]
      }
    ]
  }
}
```

## 安全最佳实践

### 1. 开发阶段
- 使用 TypeScript 进行类型安全
- 实施严格的代码审查
- 定期更新依赖包
- 使用安全的编码模式

### 2. 部署阶段
- 使用 HTTPS
- 配置安全头部
- 启用 Cloudflare 安全功能
- 监控安全日志

### 3. 运维阶段
- 定期安全扫描
- 监控异常活动
- 及时应用安全补丁
- 备份和恢复计划

## 安全事件响应

### 1. 检测
- 自动化监控和告警
- 异常行为检测
- 日志分析

### 2. 响应
- 事件分类和优先级
- 快速隔离和修复
- 用户通知

### 3. 恢复
- 系统恢复验证
- 安全加固
- 事后分析和改进

## 合规性

### 1. 数据保护
- 用户数据加密
- 数据最小化原则
- 数据保留政策

### 2. 隐私保护
- 用户同意管理
- 数据访问控制
- 隐私政策透明度

## 联系方式

如果发现安全漏洞，请通过以下方式联系：
- 邮箱: security@example.com
- 加密通信: 使用 PGP 密钥

## 更新日志

- 2024-01-01: 初始安全实现
- 2024-01-15: 添加 RLS 策略增强
- 2024-01-30: 实施文件上传安全检查