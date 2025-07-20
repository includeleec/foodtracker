# 食物追踪应用测试文档

## 测试概述

本项目包含完整的测试套件，覆盖应用的主要功能，包括单元测试、集成测试和端到端测试。

## 测试环境配置

### 测试环境
- **生产环境**: https://food.tinycard.xyz
- **测试账号**: includeleec@gmail.com / 123456
- **浏览器**: Chrome (桌面版和移动版)

### 测试框架
- **单元测试**: Jest + React Testing Library
- **E2E测试**: Playwright
- **测试环境**: Node.js jest-environment

## 测试结构

### 单元测试覆盖

#### API路由测试
- ✅ **Upload API** (`app/api/upload/__tests__/route.test.ts`)
  - 图片上传成功流程
  - 认证和授权验证
  - 文件类型和大小验证
  - 错误处理和安全检查
  - CORS预检请求处理

- ✅ **Food Records API** (`app/api/food-records/__tests__/route.test.ts`)
  - CRUD操作测试
  - 用户数据隔离验证
  - 输入验证和清理

#### 组件测试
- ✅ **FoodRecordCard** (`components/food/__tests__/food-record-card.test.tsx`)
  - 食物记录卡片渲染
  - 编辑和删除功能
  - 加载状态和错误处理
  - 餐次类型样式

- ✅ **FoodRecordForm** (`components/food/__tests__/food-record-form.integration.test.tsx`)
  - 表单验证和提交
  - 新建和编辑记录
  - 错误处理和用户反馈
  - 加载状态管理

- ✅ **Authentication Components** (`components/auth/__tests__/`)
  - 登录注册表单
  - 用户资料管理
  - 路由保护

- ✅ **UI Components** (`components/ui/__tests__/`)
  - 图片优化组件
  - 移动端导航
  - 对话框和表单字段
  - 响应式设计

#### 工具函数测试
- ✅ **安全工具** (`lib/__tests__/security-utils.test.ts`, `__tests__/security-comprehensive.test.ts`)
  - XSS防护和HTML转义
  - SQL注入检测
  - JWT格式验证
  - 请求来源验证
  - 速率限制

- ✅ **数据服务** (`lib/__tests__/food-record-service.test.ts`)
  - 数据库操作封装
  - 错误处理和重试机制
  - 数据验证和清理

- ✅ **工具函数** (`lib/__tests__/`)
  - 日期处理工具
  - 数据格式化
  - 缓存管理
  - 图片处理

### E2E测试覆盖

#### 主要功能测试 (`e2e/food-tracker-main.spec.ts`)
- ✅ **首页和导航**
  - 页面加载和标题验证
  - 认证状态检查
  - 导航菜单功能

- ✅ **用户认证流程**
  - 登录成功验证
  - 错误处理和用户反馈
  - 登出功能

- ✅ **食物记录管理**
  - 添加新记录
  - 查看和编辑记录
  - 删除记录
  - 数据持久化验证

- ✅ **日历和历史记录**
  - 食物日历显示
  - 历史记录查看
  - 日期选择功能

- ✅ **图片上传功能**
  - 上传界面验证
  - 文件选择和预览

- ✅ **移动端适配**
  - 移动导航测试
  - 响应式布局验证
  - 触摸交互

- ✅ **数据持久化**
  - 页面刷新后数据保持
  - 会话管理

- ✅ **错误处理**
  - 网络错误处理
  - 表单验证错误
  - 加载状态显示

## 运行测试

### 单元测试
```bash
# 运行所有单元测试
npm test

# 运行特定测试文件
npm test components/food/__tests__/food-record-card.test.tsx

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式运行测试
npm run test:watch
```

### E2E测试
```bash
# 运行所有E2E测试 (仅Chrome桌面和移动版)
npm run test:e2e

# 运行特定E2E测试
npm run test:e2e -- --grep "User can login"

# 调试模式运行E2E测试
npm run test:e2e:debug

# UI模式运行E2E测试
npm run test:e2e:ui
```

### 安全测试
```bash
# 运行安全相关测试
npm test lib/__tests__/security-utils.test.ts
npm test __tests__/security-comprehensive.test.ts

# 运行集成安全测试
npm test __tests__/security-integration.test.ts
```

## 测试配置

### Jest配置
- 环境: jsdom (组件测试) 和 node (API测试)
- 模块映射: `@/*` 指向项目根目录
- 测试文件模式: `**/__tests__/**/*.test.{ts,tsx}`

### Playwright配置
- 浏览器: Chromium (桌面版) 和 Mobile Chrome
- 基础URL: https://food.tinycard.xyz
- 超时设置: 导航30秒，操作10秒
- 失败时截图和录像

## 测试最佳实践

### 单元测试
1. **隔离测试**: 每个测试独立运行，不依赖其他测试
2. **模拟依赖**: 使用Jest mocks模拟外部依赖
3. **数据驱动**: 使用测试数据集验证多种场景
4. **错误场景**: 确保错误处理路径被测试

### E2E测试
1. **真实用户场景**: 模拟实际用户操作流程
2. **等待策略**: 正确等待页面加载和异步操作
3. **选择器稳定性**: 使用稳定的选择器避免脆弱测试
4. **数据清理**: 测试后清理测试数据

### 安全测试
1. **输入验证**: 测试各种恶意输入
2. **认证授权**: 验证访问控制
3. **数据保护**: 确保敏感数据安全
4. **CORS和CSP**: 验证安全头配置

## 持续集成

### 自动化测试
- 每次代码提交触发单元测试
- 部署前运行完整E2E测试套件
- 定期运行安全扫描

### 测试报告
- 单元测试覆盖率报告
- E2E测试执行结果
- 性能基准测试
- 安全漏洞扫描

## 故障排除

### 常见问题

1. **测试超时**
   - 增加超时设置
   - 检查网络连接
   - 优化异步操作等待

2. **选择器失效**
   - 更新页面选择器
   - 使用更稳定的选择器
   - 添加测试标识符

3. **认证失败**
   - 验证测试账号状态
   - 检查JWT token格式
   - 确认环境配置

4. **数据不一致**
   - 清理测试数据
   - 重置数据库状态
   - 检查数据隔离

## 测试维护

### 定期更新
- 随功能更新测试用例
- 重构过时的测试代码
- 更新测试依赖包
- 优化测试性能

### 测试数据管理
- 维护测试账号
- 更新测试数据集
- 清理历史测试数据
- 监控测试环境状态

---

**注意**: 所有测试都应该在独立环境中运行，不应影响生产数据。测试账号仅用于测试目的，请勿用于实际数据录入。