// 环境变量配置验证

interface Config {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  cloudflare: {
    accountId: string
    accountHash: string
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
    },
    cloudflare: {
      accountId: validateEnvVar('CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID),
      accountHash: validateEnvVar('CLOUDFLARE_ACCOUNT_HASH', process.env.CLOUDFLARE_ACCOUNT_HASH),
      imagesToken: validateEnvVar('CLOUDFLARE_IMAGES_TOKEN', process.env.CLOUDFLARE_IMAGES_TOKEN),
    }
  }

  // Service role key is only needed on the server side
  if (typeof window === 'undefined') {
    config.supabase.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // 检查 Cloudflare Images 配置
    if (!config.cloudflare.accountId || !config.cloudflare.accountHash || !config.cloudflare.imagesToken) {
      console.error('Cloudflare Images configuration is incomplete')
      return false
    }

    console.log('Configuration validation passed')
    return true
  } catch (error) {
    console.error('Configuration validation failed:', error)
    return false
  }
}

// 动态获取允许的源
export function getAllowedOrigins(request?: Request): string[] {
  const baseOrigins = [
    '*.pages.dev', // Cloudflare Pages
    '*.workers.dev', // Cloudflare Workers
    'https://food-tracker-app.includeleec-b6f.workers.dev', // 明确的生产域名
    'https://food.tinycard.xyz', // 自定义域名
    '*.tinycard.xyz' // 允许子域名
  ]

  // 在开发环境中，动态检测端口
  if (process.env.NODE_ENV === 'development') {
    // 从环境变量获取配置的URL
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseOrigins.push(process.env.NEXT_PUBLIC_APP_URL)
    }

    // 从请求头中动态获取主机和端口
    if (request) {
      try {
        const url = new URL(request.url)
        const host = request.headers.get('host') || url.host
        
        if (host) {
          // 支持 http 和 https
          baseOrigins.push(`http://${host}`)
          baseOrigins.push(`https://${host}`)
          
          // 如果是 localhost，也支持 127.0.0.1
          if (host.includes('localhost')) {
            const port = host.split(':')[1]
            if (port) {
              baseOrigins.push(`http://127.0.0.1:${port}`)
              baseOrigins.push(`https://127.0.0.1:${port}`)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse request URL for origin detection:', error)
      }
    }

    // 常见开发端口
    const commonPorts = ['3000', '3001', '3002', '3003', '8000', '8080']
    commonPorts.forEach(port => {
      baseOrigins.push(`http://localhost:${port}`)
      baseOrigins.push(`http://127.0.0.1:${port}`)
    })
  }

  return [...new Set(baseOrigins)] // 去重
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