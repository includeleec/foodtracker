# 数据库设置指南

## Supabase 项目设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 记录项目的 URL 和 API 密钥

### 2. 配置环境变量

在 `.env.local` 文件中设置以下变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

在 `.dev.vars` 文件中设置相同的变量用于 Cloudflare Workers 开发。

### 3. 执行数据库迁移

在 Supabase 项目的 SQL 编辑器中执行以下文件：

1. 首先执行 `schema.sql` 创建表结构
2. 然后执行 `rls-policies.sql` 设置行级安全策略

### 4. 验证设置

确保以下功能正常工作：
- 用户注册和登录
- 数据库连接
- RLS 策略生效

## 数据库结构

### food_records 表

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID (外键到 auth.users) |
| meal_type | VARCHAR(20) | 餐次类型 (breakfast/lunch/dinner/snack) |
| food_name | VARCHAR(255) | 食物名称 |
| weight | DECIMAL(8,2) | 重量 |
| calories | DECIMAL(8,2) | 卡路里 |
| image_url | VARCHAR(500) | 图片URL (可选) |
| image_id | VARCHAR(255) | 图片ID (可选) |
| record_date | DATE | 记录日期 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 索引

- `idx_food_records_user_date`: 用户ID和日期的复合索引
- `idx_food_records_user_meal`: 用户ID和餐次类型的复合索引

### RLS 策略

- 用户只能查看、插入、更新和删除自己的食物记录
- 所有操作都基于 `auth.uid() = user_id` 的条件