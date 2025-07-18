#!/usr/bin/env tsx
// 安全漏洞扫描脚本

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface SecurityIssue {
  type: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  file: string
  line?: number
  message: string
  recommendation: string
}

class SecurityScanner {
  private issues: SecurityIssue[] = []
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  // 扫描硬编码的敏感信息
  scanHardcodedSecrets(): void {
    console.log('🔍 扫描硬编码敏感信息...')
    
    const sensitivePatterns = [
      {
        pattern: /(?:password|pwd|pass)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        message: '发现可能的硬编码密码',
        type: 'critical' as const
      },
      {
        pattern: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"][^'"]{16,}['"]/gi,
        message: '发现可能的硬编码 API 密钥',
        type: 'critical' as const
      },
      {
        pattern: /(?:token|jwt)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
        message: '发现可能的硬编码令牌',
        type: 'high' as const
      },
      {
        pattern: /(?:database|db)[_-]?(?:url|uri|connection)\s*[:=]\s*['"][^'"]+['"]/gi,
        message: '发现可能的硬编码数据库连接字符串',
        type: 'high' as const
      }
    ]

    this.scanFiles(['.ts', '.tsx', '.js', '.jsx', '.json'], (filePath, content) => {
      sensitivePatterns.forEach(({ pattern, message, type }) => {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          // 跳过测试文件和示例文件
          if (filePath.includes('test') || filePath.includes('example') || filePath.includes('.env.example')) {
            continue
          }

          this.addIssue({
            type,
            category: 'Hardcoded Secrets',
            file: filePath,
            message,
            recommendation: '使用环境变量或安全的密钥管理系统存储敏感信息'
          })
        }
      })
    })
  }

  // 扫描不安全的依赖
  scanDependencies(): void {
    console.log('🔍 扫描依赖安全漏洞...')
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        // 运行 npm audit
        try {
          execSync('npm audit --audit-level=moderate --json', { 
            cwd: this.projectRoot,
            stdio: 'pipe'
          })
        } catch (error: any) {
          if (error.stdout) {
            const auditResult = JSON.parse(error.stdout.toString())
            if (auditResult.vulnerabilities) {
              Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
                this.addIssue({
                  type: this.mapSeverity(vuln.severity),
                  category: 'Dependency Vulnerability',
                  file: 'package.json',
                  message: `依赖 ${pkg} 存在 ${vuln.severity} 级别安全漏洞: ${vuln.title}`,
                  recommendation: `运行 npm audit fix 或更新到安全版本`
                })
              })
            }
          }
        }
      }
    } catch (error) {
      console.warn('无法运行依赖安全扫描:', error)
    }
  }

  // 扫描不安全的代码模式
  scanUnsafePatterns(): void {
    console.log('🔍 扫描不安全的代码模式...')
    
    const unsafePatterns = [
      {
        pattern: /eval\s*\(/gi,
        message: '使用了 eval() 函数，存在代码注入风险',
        type: 'critical' as const,
        recommendation: '避免使用 eval()，使用更安全的替代方案'
      },
      {
        pattern: /innerHTML\s*=\s*[^;]+[+]/gi,
        message: '动态设置 innerHTML 可能导致 XSS 攻击',
        type: 'high' as const,
        recommendation: '使用 textContent 或经过清理的 HTML'
      },
      {
        pattern: /document\.write\s*\(/gi,
        message: '使用 document.write() 可能导致 XSS 攻击',
        type: 'high' as const,
        recommendation: '使用现代 DOM 操作方法'
      },
      {
        pattern: /dangerouslySetInnerHTML/gi,
        message: '使用 dangerouslySetInnerHTML 存在 XSS 风险',
        type: 'medium' as const,
        recommendation: '确保内容已经过适当的清理和验证'
      },
      {
        pattern: /Math\.random\(\)/gi,
        message: 'Math.random() 不适用于安全相关的随机数生成',
        type: 'medium' as const,
        recommendation: '对于安全用途，使用 crypto.getRandomValues()'
      }
    ]

    this.scanFiles(['.ts', '.tsx', '.js', '.jsx'], (filePath, content) => {
      unsafePatterns.forEach(({ pattern, message, type, recommendation }) => {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          this.addIssue({
            type,
            category: 'Unsafe Code Pattern',
            file: filePath,
            message,
            recommendation
          })
        }
      })
    })
  }

  // 扫描缺失的安全头部
  scanSecurityHeaders(): void {
    console.log('🔍 扫描安全头部配置...')
    
    const requiredHeaders = [
      'X-XSS-Protection',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ]

    // 检查 Next.js 配置
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts')
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8')
      
      requiredHeaders.forEach(header => {
        if (!content.includes(header)) {
          this.addIssue({
            type: 'medium',
            category: 'Missing Security Header',
            file: 'next.config.ts',
            message: `缺少安全头部: ${header}`,
            recommendation: `在 Next.js 配置中添加 ${header} 头部`
          })
        }
      })
    }

    // 检查 API 路由是否设置了安全头部
    this.scanFiles(['.ts'], (filePath, content) => {
      if (filePath.includes('/api/') && content.includes('NextResponse')) {
        const hasSecurityHeaders = requiredHeaders.some(header => 
          content.includes(header) || content.includes('getSecurityHeaders')
        )
        
        if (!hasSecurityHeaders) {
          this.addIssue({
            type: 'medium',
            category: 'Missing Security Header',
            file: filePath,
            message: 'API 路由缺少安全头部',
            recommendation: '在 API 响应中添加安全头部'
          })
        }
      }
    })
  }

  // 扫描认证和授权问题
  scanAuthIssues(): void {
    console.log('🔍 扫描认证和授权问题...')
    
    this.scanFiles(['.ts', '.tsx'], (filePath, content) => {
      // 检查是否有未保护的 API 路由
      if (filePath.includes('/api/') && content.includes('export async function')) {
        if (!content.includes('auth') && !content.includes('validateUser')) {
          this.addIssue({
            type: 'high',
            category: 'Missing Authentication',
            file: filePath,
            message: 'API 路由可能缺少身份验证',
            recommendation: '确保所有敏感 API 路由都有适当的身份验证'
          })
        }
      }

      // 检查是否有硬编码的用户角色或权限
      if (/role\s*[:=]\s*['"]admin['"]|isAdmin\s*[:=]\s*true/gi.test(content)) {
        this.addIssue({
          type: 'medium',
          category: 'Hardcoded Authorization',
          file: filePath,
          message: '发现硬编码的用户角色或权限',
          recommendation: '使用动态的权限检查系统'
        })
      }
    })
  }

  // 扫描 SQL 注入风险
  scanSqlInjection(): void {
    console.log('🔍 扫描 SQL 注入风险...')
    
    this.scanFiles(['.ts', '.tsx'], (filePath, content) => {
      // 检查字符串拼接的 SQL 查询
      const sqlPatterns = [
        /['"`]\s*\+\s*[^+]+\s*\+\s*['"`]/g, // 字符串拼接
        /\$\{[^}]+\}/g // 模板字符串插值
      ]

      sqlPatterns.forEach(pattern => {
        if (pattern.test(content) && /SELECT|INSERT|UPDATE|DELETE/gi.test(content)) {
          this.addIssue({
            type: 'high',
            category: 'SQL Injection Risk',
            file: filePath,
            message: '可能存在 SQL 注入风险的查询构造',
            recommendation: '使用参数化查询或 ORM 来防止 SQL 注入'
          })
        }
      })
    })
  }

  // 扫描文件和目录
  private scanFiles(extensions: string[], callback: (filePath: string, content: string) => void): void {
    const scanDir = (dir: string): void => {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // 跳过某些目录
          if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            continue
          }
          scanDir(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(item)
          if (extensions.includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8')
              const relativePath = path.relative(this.projectRoot, fullPath)
              callback(relativePath, content)
            } catch (error) {
              console.warn(`无法读取文件 ${fullPath}:`, error)
            }
          }
        }
      }
    }

    scanDir(this.projectRoot)
  }

  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue)
  }

  private mapSeverity(severity: string): SecurityIssue['type'] {
    switch (severity.toLowerCase()) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'moderate': return 'medium'
      case 'low': return 'low'
      default: return 'info'
    }
  }

  // 运行所有扫描
  async runAllScans(): Promise<void> {
    console.log('🚀 开始安全扫描...\n')
    
    this.scanHardcodedSecrets()
    this.scanDependencies()
    this.scanUnsafePatterns()
    this.scanSecurityHeaders()
    this.scanAuthIssues()
    this.scanSqlInjection()
    
    this.generateReport()
  }

  // 生成报告
  private generateReport(): void {
    console.log('\n📊 安全扫描报告')
    console.log('='.repeat(50))
    
    if (this.issues.length === 0) {
      console.log('✅ 未发现安全问题！')
      return
    }

    // 按严重程度分组
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = []
      acc[issue.type].push(issue)
      return acc
    }, {} as Record<string, SecurityIssue[]>)

    const severityOrder: SecurityIssue['type'][] = ['critical', 'high', 'medium', 'low', 'info']
    const severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: '💡',
      info: 'ℹ️'
    }

    let totalIssues = 0
    
    severityOrder.forEach(severity => {
      const issues = groupedIssues[severity]
      if (!issues || issues.length === 0) return
      
      console.log(`\n${severityEmojis[severity]} ${severity.toUpperCase()} (${issues.length} 个问题)`)
      console.log('-'.repeat(30))
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category}] ${issue.message}`)
        console.log(`   文件: ${issue.file}`)
        console.log(`   建议: ${issue.recommendation}`)
        console.log()
      })
      
      totalIssues += issues.length
    })

    console.log(`\n📈 总计发现 ${totalIssues} 个安全问题`)
    
    // 生成 JSON 报告
    const reportPath = path.join(this.projectRoot, 'security-report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalIssues,
      issues: this.issues
    }, null, 2))
    
    console.log(`📄 详细报告已保存到: ${reportPath}`)
    
    // 如果有严重或高危问题，退出码为 1
    const hasCriticalIssues = this.issues.some(issue => 
      issue.type === 'critical' || issue.type === 'high'
    )
    
    if (hasCriticalIssues) {
      console.log('\n❌ 发现严重安全问题，请及时修复！')
      process.exit(1)
    }
  }
}

// 主函数
async function main() {
  const projectRoot = process.cwd()
  const scanner = new SecurityScanner(projectRoot)
  
  try {
    await scanner.runAllScans()
  } catch (error) {
    console.error('安全扫描失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { SecurityScanner }