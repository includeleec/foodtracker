-- 用户表 (users) - 由 Supabase Auth 自动管理
-- 这里只需要创建食物记录表

-- 食物记录表 (food_records)
CREATE TABLE food_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name VARCHAR(255) NOT NULL,
  weight DECIMAL(8,2) NOT NULL,
  calories DECIMAL(8,2),
  image_url VARCHAR(500),
  image_id VARCHAR(255),
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_food_records_user_date ON food_records(user_id, record_date);
CREATE INDEX idx_food_records_user_meal ON food_records(user_id, meal_type);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 food_records 表创建更新时间触发器
CREATE TRIGGER update_food_records_updated_at 
    BEFORE UPDATE ON food_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();