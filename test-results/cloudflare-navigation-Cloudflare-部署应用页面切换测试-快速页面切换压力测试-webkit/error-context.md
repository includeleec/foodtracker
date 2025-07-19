# Page snapshot

```yaml
- banner:
  - text: 🍽️
  - heading "每日食物记录" [level=1]
  - text: I 欢迎回来 includeleec@gmail.com
  - button "👋 退出登录"
- navigation:
  - link "🏠 仪表板":
    - /url: /dashboard
  - link "📝 今日记录":
    - /url: /dashboard/today
  - link "📅 历史记录":
    - /url: /dashboard/history
- main:
  - text: 📝
  - term: 今日记录
  - definition: 记录今天的饮食
  - button "开始记录"
  - text: 📅
  - term: 历史记录
  - definition: 查看过往记录
  - button "查看历史"
  - text: 📊
  - term: 数据统计
  - definition: 饮食分析报告
  - button "即将推出" [disabled]
  - heading "快速开始" [level=3]
  - text: 1 点击"开始记录"按钮，添加您的第一条食物记录 2 选择餐次类型（早餐、中餐、晚餐、加餐） 3 填写食物名称、重量、卡路里，可选择上传食物图片 4 保存记录，系统会自动计算当日总卡路里
- alert
```