-- 行级安全策略 (Row Level Security) 配置

-- 启用 food_records 表的 RLS
ALTER TABLE food_records ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own food records" ON food_records;
DROP POLICY IF EXISTS "Users can insert their own food records" ON food_records;
DROP POLICY IF EXISTS "Users can update their own food records" ON food_records;
DROP POLICY IF EXISTS "Users can delete their own food records" ON food_records;

-- 用户只能查看自己的食物记录
CREATE POLICY "Users can view their own food records" ON food_records
  FOR SELECT USING (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL
  );

-- 用户只能插入自己的食物记录，并验证数据完整性
CREATE POLICY "Users can insert their own food records" ON food_records
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL AND
    meal_type IN ('breakfast', 'lunch', 'dinner', 'snack') AND
    food_name IS NOT NULL AND
    LENGTH(TRIM(food_name)) > 0 AND
    LENGTH(food_name) <= 255 AND
    weight > 0 AND
    weight <= 10000 AND
    calories > 0 AND
    calories <= 10000 AND
    record_date IS NOT NULL AND
    record_date >= '2020-01-01' AND
    record_date <= CURRENT_DATE + INTERVAL '1 day'
  );

-- 用户只能更新自己的食物记录，并验证数据完整性
CREATE POLICY "Users can update their own food records" ON food_records
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL
  ) WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL AND
    meal_type IN ('breakfast', 'lunch', 'dinner', 'snack') AND
    food_name IS NOT NULL AND
    LENGTH(TRIM(food_name)) > 0 AND
    LENGTH(food_name) <= 255 AND
    weight > 0 AND
    weight <= 10000 AND
    calories > 0 AND
    calories <= 10000 AND
    record_date IS NOT NULL AND
    record_date >= '2020-01-01' AND
    record_date <= CURRENT_DATE + INTERVAL '1 day'
  );

-- 用户只能删除自己的食物记录
CREATE POLICY "Users can delete their own food records" ON food_records
  FOR DELETE USING (
    auth.uid() = user_id AND 
    auth.uid() IS NOT NULL
  );

-- 创建安全函数来验证用户权限
CREATE OR REPLACE FUNCTION auth.check_user_access(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查当前用户是否已认证
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查用户是否访问自己的数据
  IF auth.uid() != target_user_id THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建数据验证函数
CREATE OR REPLACE FUNCTION validate_food_record_data(
  p_meal_type TEXT,
  p_food_name TEXT,
  p_weight DECIMAL,
  p_calories DECIMAL,
  p_record_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 验证餐次类型
  IF p_meal_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack') THEN
    RETURN FALSE;
  END IF;
  
  -- 验证食物名称
  IF p_food_name IS NULL OR LENGTH(TRIM(p_food_name)) = 0 OR LENGTH(p_food_name) > 255 THEN
    RETURN FALSE;
  END IF;
  
  -- 验证重量
  IF p_weight IS NULL OR p_weight <= 0 OR p_weight > 10000 THEN
    RETURN FALSE;
  END IF;
  
  -- 验证卡路里
  IF p_calories IS NULL OR p_calories <= 0 OR p_calories > 10000 THEN
    RETURN FALSE;
  END IF;
  
  -- 验证日期
  IF p_record_date IS NULL OR 
     p_record_date < '2020-01-01' OR 
     p_record_date > CURRENT_DATE + INTERVAL '1 day' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建审计日志表（可选，用于安全监控）
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用审计日志表的 RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- 只有系统管理员可以查看审计日志
CREATE POLICY "Only admins can view audit logs" ON security_audit_log
  FOR SELECT USING (FALSE); -- 暂时禁用，需要管理员角色时再开启

-- 创建审计触发器函数
CREATE OR REPLACE FUNCTION audit_food_record_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 记录数据变更
  INSERT INTO security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建审计触发器
DROP TRIGGER IF EXISTS audit_food_records_trigger ON food_records;
CREATE TRIGGER audit_food_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON food_records
  FOR EACH ROW EXECUTE FUNCTION audit_food_record_changes();

-- 创建索引以提高安全查询性能
CREATE INDEX IF NOT EXISTS idx_food_records_security ON food_records(user_id, record_date, meal_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time ON security_audit_log(user_id, created_at);

-- 创建视图来安全地查询用户数据
CREATE OR REPLACE VIEW user_food_records AS
SELECT 
  fr.id,
  fr.user_id,
  fr.meal_type,
  fr.food_name,
  fr.weight,
  fr.calories,
  fr.image_url,
  fr.image_id,
  fr.record_date,
  fr.created_at,
  fr.updated_at
FROM food_records fr
WHERE fr.user_id = auth.uid();

-- 为视图启用 RLS
ALTER VIEW user_food_records SET (security_barrier = true);

-- 创建安全的存储过程来插入数据
CREATE OR REPLACE FUNCTION secure_insert_food_record(
  p_meal_type TEXT,
  p_food_name TEXT,
  p_weight DECIMAL,
  p_calories DECIMAL,
  p_record_date DATE,
  p_image_url TEXT DEFAULT NULL,
  p_image_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_record_id UUID;
BEGIN
  -- 验证用户已认证
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 验证数据
  IF NOT validate_food_record_data(p_meal_type, p_food_name, p_weight, p_calories, p_record_date) THEN
    RAISE EXCEPTION 'Invalid food record data';
  END IF;
  
  -- 插入数据
  INSERT INTO food_records (
    user_id,
    meal_type,
    food_name,
    weight,
    calories,
    record_date,
    image_url,
    image_id
  ) VALUES (
    auth.uid(),
    p_meal_type,
    TRIM(p_food_name),
    p_weight,
    p_calories,
    p_record_date,
    p_image_url,
    p_image_id
  ) RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;