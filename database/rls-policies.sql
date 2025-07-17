-- 行级安全策略 (Row Level Security) 配置

-- 启用 food_records 表的 RLS
ALTER TABLE food_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的食物记录
CREATE POLICY "Users can view their own food records" ON food_records
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的食物记录
CREATE POLICY "Users can insert their own food records" ON food_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的食物记录
CREATE POLICY "Users can update their own food records" ON food_records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的食物记录
CREATE POLICY "Users can delete their own food records" ON food_records
  FOR DELETE USING (auth.uid() = user_id);