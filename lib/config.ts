// 环境变量配置验证

interface Config {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  cloudflare?: {
    accountId: string
    imagesToken: string
  }
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getConfig(): Config {
  const config: Config = {
    supabase: {
      url: validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKey: validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    }
  }

  // Service role key is only needed on the server side
  if (typeof window === 'undefined') {
    config.supabase.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  // Cloudflare Images config (optional for now)
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_IMAGES_TOKEN) {
    config.cloudflare = {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      imagesToken: process.env.CLOUDFLARE_IMAGES_TOKEN,
    }
  }

  return config
}

// 验证配置是否完整
export function validateConfig(): boolean {
  try {
    const config = getConfig()
    
    // 检查 Supabase 配置
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error('Supabase configuration is incomplete')
      return false
    }

    // 检查 URL 格式
    try {
      new URL(config.supabase.url)
    } catch {
      console.error('Invalid Supabase URL format')
      return false
    }

    console.log('Configuration validation passed')
    return true
  } catch (error) {
    console.error('Configuration validation failed:', error)
    return false
  }
}

// 开发环境配置检查
export function checkDevConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const hasPlaceholders = 
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase') ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('your_supabase')

    if (hasPlaceholders) {
      console.warn(`
⚠️  警告: 检测到占位符环境变量
请按照以下步骤配置 Supabase:

1. 访问 https://supabase.com 创建新项目
2. 在项目设置中获取 URL 和 API 密钥
3. 更新 .env.local 文件中的环境变量
4. 在 Supabase SQL 编辑器中执行 database/schema.sql
5. 执行 database/rls-policies.sql 设置安全策略

详细说明请查看 database/README.md
      `)
    }
  }
}