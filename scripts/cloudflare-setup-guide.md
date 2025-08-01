# Cloudflare Images API 配置指南

## 问题诊断结果

当前错误：`Unable to authenticate request (Code: 10001)`

这表明 Cloudflare Images API Token 存在问题。

## 解决方案

### 1. 创建新的 API Token

访问 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)

### 2. 创建自定义 Token

点击 "Create Token" → "Custom token"

### 3. 配置权限

**Token 名称**: `Food Tracker Images API`

**权限**:
- `Account` → `Cloudflare Images:Edit`
- `Zone Resources` → `Include All zones` (或选择特定域名)

**Account Resources**:
- `Include` → `All accounts` (或选择特定账户)

**IP Address Filtering**: 留空（允许所有IP）

**TTL**: 根据需要设置（建议1年）

### 4. 获取 Token

创建后复制 Token 值，格式类似：`1234567890abcdef1234567890abcdef12345678`

### 5. 更新环境变量

在 `.env.local` 文件中更新：

```env
CLOUDFLARE_IMAGES_TOKEN=你的新token值
```

### 6. 验证配置

运行测试脚本：
```bash
node scripts/test-cloudflare-images.js
```

## 重要注意事项

1. **权限范围**: 确保 Token 有 `Cloudflare Images:Edit` 权限
2. **账户访问**: Token 必须能访问包含 Images 的账户
3. **Token 安全**: 不要将 Token 提交到代码仓库
4. **过期时间**: 定期更新 Token 以确保安全

## 备选方案

如果自定义 Token 不工作，可以尝试使用 "Edit Cloudflare Images" 预设模板。

## 常见问题

### Q: 为什么会出现认证错误？
A: 可能的原因：
- Token 权限不足
- Token 已过期
- 账户ID不匹配
- Token 格式错误

### Q: 如何验证 Token 是否有效？
A: 运行诊断脚本 `node scripts/test-cloudflare-images.js`

### Q: 生产环境如何配置？
A: 在 Cloudflare Workers 的环境变量中设置相同的变量名。