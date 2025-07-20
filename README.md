# 每日食物记录 - Daily Food Tracker

一个现代化的食物摄入追踪Web应用，帮助用户记录和管理每日饮食习惯。

[![部署状态](https://img.shields.io/badge/部署-Cloudflare%20Workers-orange)](https://food-tracker-app.includeleec-b6f.workers.dev)
[![技术栈](https://img.shields.io/badge/技术栈-Next.js%2015-blue)](https://nextjs.org)
[![数据库](https://img.shields.io/badge/数据库-Supabase-green)](https://supabase.com)

### Vibe Coding
本项目使用 Kiro 和 Claude Code 构建。
Claude Code 我目前使用的是 Claude Code 镜像池: [https://gaccode.com/signup?ref=0FIU5756](https://gaccode.com/signup?ref=0FIU5756)

## 🌟 产品特性

### 核心功能
- **📱 移动优先设计** - 专为移动设备优化的响应式界面
- **🍽️ 多餐次记录** - 支持早餐、中餐、晚餐、加餐的详细记录
- **📊 营养追踪** - 食物重量、卡路里自动计算和统计
- **📸 图片上传** - 支持食物照片上传，基于Cloudflare Images
- **📅 历史查看** - 完整的历史记录查看和编辑功能
- **🔐 安全认证** - 基于Supabase的用户认证系统

### 移动端优化
- **👤 用户头像菜单** - 替代传统汉堡菜单，提供直观的用户操作
- **🎯 触摸友好** - 大按钮设计，支持手势操作
- **📱 自适应布局** - 完美适配各种屏幕尺寸 (320px - 768px)
- **🔄 自动滚动** - 编辑时自动滚动到表单区域
- **💫 浮动按钮** - 食物记录卡片上的浮动编辑/删除按钮

## 🚀 在线访问

- **主域名**: [https://food-tracker-app.includeleec-b6f.workers.dev](https://food-tracker-app.includeleec-b6f.workers.dev)
- **自定义域名**: [https://food.tinycard.xyz](https://food.tinycard.xyz)

### 测试账户
- **邮箱**: includeleec@gmail.com
- **密码**: 123456

## 🛠️ 技术架构

### 前端技术栈
- **Next.js 15.3.5** - React全栈框架，使用App Router
- **React 19** - 最新版本UI库
- **TypeScript 5** - 严格类型检查
- **Tailwind CSS 4** - 实用优先的CSS框架

### 后端服务
- **Supabase** - PostgreSQL数据库 + 实时功能
- **Supabase Auth** - 用户认证和会话管理
- **Row Level Security (RLS)** - 数据库级别的数据隔离

### 部署架构
- **Cloudflare Workers** - 无服务器部署平台
- **OpenNext Cloudflare** - Next.js适配器
- **Cloudflare Images** - 图片存储和CDN加速

### 开发工具
- **Turbopack** - 快速开发构建工具
- **Jest** - 单元测试框架
- **Playwright** - E2E测试框架
- **ESLint** - 代码质量检查

## 📁 项目结构

```
food-tracker-app/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   │   ├── upload/        # 图片上传API
│   │   └── food-records/  # 食物记录API
│   ├── auth/              # 认证页面
│   └── dashboard/         # 主应用页面
├── components/            # React 组件
│   ├── ui/               # 基础UI组件
│   └── food/             # 食物相关组件
├── lib/                   # 工具函数和服务
│   ├── supabase-*        # Supabase客户端
│   ├── validation.ts     # 数据验证
│   └── security-utils.ts # 安全工具
├── types/                 # TypeScript类型定义
├── database/              # 数据库架构和迁移
├── e2e/                   # E2E测试
└── scripts/               # 工具脚本
```

## 🔧 本地开发

### 环境要求
- Node.js 18+
- npm/yarn/pnpm
- Git

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/includeleec/foodtracker.git
cd foodtracker
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare Images 配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCOUNT_HASH=your_account_hash
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=your_account_hash
CLOUDFLARE_IMAGES_TOKEN=your_images_token

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **数据库设置**
```bash
# 在 Supabase SQL 编辑器中执行
# database/schema.sql      - 创建表结构
# database/rls-policies.sql - 设置安全策略
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 可用命令

### 开发命令
```bash
npm run dev          # 启动开发服务器 (Turbopack)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码质量检查
```

### 测试命令
```bash
# 单元测试
npm test             # 运行所有单元测试
npm run test:watch   # 监视模式运行测试
npm run test:coverage # 生成测试覆盖率报告

# E2E测试
npm run test:e2e     # 运行所有E2E测试 (Chrome桌面 + 移动版)
npm run test:e2e:ui  # UI模式运行E2E测试
npm run test:e2e:debug # 调试模式运行E2E测试

# 特定测试
npm test components/food/__tests__/food-record-card.test.tsx  # 运行特定单元测试
npm run test:e2e -- --project=chromium --grep="User can login"  # 运行特定E2E测试
```

### 部署命令
```bash
npm run deploy       # 构建并部署到Cloudflare
npm run preview      # 本地预览构建结果
npm run cf-typegen   # 生成Cloudflare环境类型
```

## 🔒 安全特性

### 数据安全
- **Row Level Security (RLS)** - 用户数据完全隔离
- **JWT Token 验证** - 安全的用户认证
- **速率限制** - API请求频率限制
- **输入验证** - 多层数据验证
- **XSS/CSRF 防护** - 完整的安全头配置

### 图片安全
- **文件类型验证** - 仅允许安全的图片格式
- **文件大小限制** - 最大10MB限制
- **魔数验证** - 验证真实文件类型
- **CDN加速** - Cloudflare Images提供全球加速

## 📊 性能优化

### 前端优化
- **代码分割** - Next.js自动代码分割
- **图片优化** - 支持WebP/AVIF格式
- **懒加载** - 图片和组件按需加载
- **缓存策略** - 智能缓存机制

### 后端优化
- **API缓存** - 5分钟TTL的数据缓存
- **数据库索引** - 优化查询性能
- **边缘计算** - Cloudflare Workers全球分布

## 🧪 测试策略

### 测试覆盖功能

#### 单元测试覆盖
- ✅ **API路由** - Upload API、Food Records API
- ✅ **React组件** - 食物记录卡片、表单、认证组件
- ✅ **安全工具** - XSS防护、SQL注入检测、JWT验证
- ✅ **数据库服务** - 食物记录服务、错误处理
- ✅ **工具函数** - 日期处理、数据验证、缓存管理

#### E2E测试覆盖
- ✅ **用户认证流程** - 登录、登出、会话管理
- ✅ **食物记录CRUD** - 添加、查看、编辑、删除记录
- ✅ **页面导航** - 仪表板、今日记录、历史记录页面
- ✅ **图片上传** - 文件选择、上传界面验证
- ✅ **响应式设计** - 移动端和桌面端适配
- ✅ **数据持久化** - 页面刷新后数据保持
- ✅ **错误处理** - 网络错误、表单验证错误

### 测试环境配置
- **测试环境**: https://food.tinycard.xyz
- **测试账号**: includeleec@gmail.com / 123456
- **浏览器**: Chrome桌面版 + Mobile Chrome
- **框架**: Jest (单元测试) + Playwright (E2E测试)

### 测试结果
- **核心功能测试通过率**: 100% ✅
  - Homepage loads and redirects to auth
  - User can login successfully
  - Dashboard shows main features
- **单元测试**: 45+ 测试用例覆盖主要组件和功能
- **E2E测试**: 12+ 测试场景覆盖完整用户流程

### 运行测试示例
```bash
# 运行核心功能测试（全部通过）
npm run test:e2e -- --project=chromium --grep="Homepage loads and redirects to auth|User can login successfully|Dashboard shows main features"

# 运行所有新的主要功能测试
npm run test:e2e -- --project=chromium e2e/food-tracker-main.spec.ts

# 运行安全相关测试
npm test lib/__tests__/security-utils.test.ts
npm test __tests__/security-comprehensive.test.ts

# 运行特定组件测试
npm test components/food/__tests__/food-record-form.test.tsx
```

## 🚀 部署指南

### Cloudflare Workers 部署

1. **配置 wrangler.toml**
```toml
name = "food-tracker-app"
main = ".open-next/worker.js"
account_id = "your_account_id"
compatibility_date = "2025-03-01"

[vars]
NEXT_PUBLIC_SUPABASE_URL = "your_supabase_url"
# ... 其他环境变量
```

2. **执行部署**
```bash
npm run deploy
```

### 自定义域名配置
1. 在 Cloudflare Dashboard 中添加域名
2. 配置 Workers Routes
3. 设置 SSL/TLS 加密

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的React框架
- [Supabase](https://supabase.com/) - 开源Firebase替代方案
- [Cloudflare](https://cloudflare.com/) - 边缘计算和CDN服务
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先CSS框架

## 📞 联系方式

- **GitHub**: [@includeleec](https://github.com/includeleec)
- **项目地址**: [https://github.com/includeleec/foodtracker](https://github.com/includeleec/foodtracker)
- **在线演示**: [https://food.tinycard.xyz](https://food.tinycard.xyz)

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！