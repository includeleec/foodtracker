-- 迁移：将卡路里字段改为可选
-- 执行日期：2024-07-20
-- 描述：移除 calories 字段的 NOT NULL 约束，使其可选

-- 修改表结构，允许 calories 字段为 NULL
ALTER TABLE food_records ALTER COLUMN calories DROP NOT NULL;

-- 添加注释说明字段为可选
COMMENT ON COLUMN food_records.calories IS '食物卡路里（可选字段）';