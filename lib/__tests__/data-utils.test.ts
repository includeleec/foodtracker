// 数据处理工具函数单元测试

import { describe, it, expect } from '@jest/globals'
import {
  groupRecordsByMeal,
  groupRecordsByDate,
  createDailyRecords,
  calculateTotalCalories,
  calculateMealCalories,
  calculateDailyCaloriesByMeal,
  calculateNutritionStats,
  calculateWeeklyAverage,
  calculateMonthlyAverage,
  filterRecordsByDateRange,
  filterRecordsByMealType,
  filterRecordsByDate,
  sortRecordsByTime,
  sortRecordsByCalories,
  createCalendarDays,
  createMonthData,
  validateFoodRecord,
  cleanFoodRecordData,
  exportRecordsToCSV,
  searchRecords,
  findRecordById,
  findRecordsByFoodName,
  aggregateRecordsByWeek,
  compareNutritionStats
} from '../data-utils'
import type { FoodRecord, MealType } from '../../types/database'

// 测试数据
const mockRecords: FoodRecord[] = [
  {
    id: '1',
    user_id: 'user1',
    meal_type: 'breakfast',
    food_name: '苹果',
    weight: 100,
    calories: 52,
    image_url: null,
    image_id: null,
    record_date: '2024-01-15',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    meal_type: 'lunch',
    food_name: '鸡胸肉',
    weight: 150,
    calories: 248,
    image_url: null,
    image_id: null,
    record_date: '2024-01-15',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: '3',
    user_id: 'user1',
    meal_type: 'dinner',
    food_name: '米饭',
    weight: 200,
    calories: 260,
    image_url: null,
    image_id: null,
    record_date: '2024-01-15',
    created_at: '2024-01-15T18:00:00Z',
    updated_at: '2024-01-15T18:00:00Z'
  },
  {
    id: '4',
    user_id: 'user1',
    meal_type: 'breakfast',
    food_name: '香蕉',
    weight: 120,
    calories: 108,
    image_url: null,
    image_id: null,
    record_date: '2024-01-16',
    created_at: '2024-01-16T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z'
  }
]

describe('数据分组和处理函数', () => {
  describe('groupRecordsByMeal', () => {
    it('应该按餐次分组记录', () => {
      const grouped = groupRecordsByMeal(mockRecords)
      
      expect(grouped.breakfast).toHaveLength(2)
      expect(grouped.lunch).toHaveLength(1)
      expect(grouped.dinner).toHaveLength(1)
      expect(grouped.snack).toHaveLength(0)
      
      expect(grouped.breakfast[0].food_name).toBe('苹果')
      expect(grouped.breakfast[1].food_name).toBe('香蕉')
      expect(grouped.lunch[0].food_name).toBe('鸡胸肉')
      expect(grouped.dinner[0].food_name).toBe('米饭')
    })

    it('应该处理空数组', () => {
      const grouped = groupRecordsByMeal([])
      expect(grouped.breakfast).toHaveLength(0)
      expect(grouped.lunch).toHaveLength(0)
      expect(grouped.dinner).toHaveLength(0)
      expect(grouped.snack).toHaveLength(0)
    })
  })

  describe('groupRecordsByDate', () => {
    it('应该按日期分组记录', () => {
      const grouped = groupRecordsByDate(mockRecords)
      
      expect(grouped['2024-01-15']).toHaveLength(3)
      expect(grouped['2024-01-16']).toHaveLength(1)
      
      expect(grouped['2024-01-15'][0].food_name).toBe('苹果')
      expect(grouped['2024-01-16'][0].food_name).toBe('香蕉')
    })
  })

  describe('createDailyRecords', () => {
    it('应该创建每日记录汇总', () => {
      const todayRecords = mockRecords.filter(r => r.record_date === '2024-01-15')
      const daily = createDailyRecords('2024-01-15', todayRecords)
      
      expect(daily.date).toBe('2024-01-15')
      expect(daily.breakfast).toHaveLength(1)
      expect(daily.lunch).toHaveLength(1)
      expect(daily.dinner).toHaveLength(1)
      expect(daily.snack).toHaveLength(0)
      expect(daily.totalCalories).toBe(560) // 52 + 248 + 260
    })
  })
})

describe('卡路里计算函数', () => {
  describe('calculateTotalCalories', () => {
    it('应该计算总卡路里', () => {
      const total = calculateTotalCalories(mockRecords)
      expect(total).toBe(668) // 52 + 248 + 260 + 108
    })

    it('应该处理空数组', () => {
      expect(calculateTotalCalories([])).toBe(0)
    })
  })

  describe('calculateMealCalories', () => {
    it('应该计算特定餐次的卡路里', () => {
      const breakfastCalories = calculateMealCalories(mockRecords, 'breakfast')
      expect(breakfastCalories).toBe(160) // 52 + 108
      
      const lunchCalories = calculateMealCalories(mockRecords, 'lunch')
      expect(lunchCalories).toBe(248)
      
      const snackCalories = calculateMealCalories(mockRecords, 'snack')
      expect(snackCalories).toBe(0)
    })
  })

  describe('calculateDailyCaloriesByMeal', () => {
    it('应该计算每餐的卡路里分布', () => {
      const breakdown = calculateDailyCaloriesByMeal(mockRecords)
      
      expect(breakdown.breakfast).toBe(160)
      expect(breakdown.lunch).toBe(248)
      expect(breakdown.dinner).toBe(260)
      expect(breakdown.snack).toBe(0)
    })
  })
})

describe('统计分析函数', () => {
  describe('calculateNutritionStats', () => {
    it('应该计算营养统计数据', () => {
      const stats = calculateNutritionStats(mockRecords)
      
      expect(stats.totalCalories).toBe(668)
      expect(stats.mealBreakdown.breakfast).toBe(160)
      expect(stats.mealBreakdown.lunch).toBe(248)
      expect(stats.mealBreakdown.dinner).toBe(260)
      expect(stats.mealBreakdown.snack).toBe(0)
      expect(stats.averageCaloriesPerMeal).toBe(223) // 668 / 3 餐 ≈ 223
    })

    it('应该处理空记录', () => {
      const stats = calculateNutritionStats([])
      expect(stats.totalCalories).toBe(0)
      expect(stats.averageCaloriesPerMeal).toBe(0)
    })
  })

  describe('calculateWeeklyAverage', () => {
    it('应该计算周平均卡路里', () => {
      const dailyRecords = [
        createDailyRecords('2024-01-15', mockRecords.slice(0, 3)),
        createDailyRecords('2024-01-16', mockRecords.slice(3))
      ]
      
      const average = calculateWeeklyAverage(dailyRecords)
      expect(average).toBe(334) // (560 + 108) / 2 = 334
    })

    it('应该处理空数组', () => {
      expect(calculateWeeklyAverage([])).toBe(0)
    })
  })
})

describe('数据过滤函数', () => {
  describe('filterRecordsByDateRange', () => {
    it('应该按日期范围过滤记录', () => {
      const filtered = filterRecordsByDateRange(mockRecords, '2024-01-15', '2024-01-15')
      expect(filtered).toHaveLength(3)
      
      const allFiltered = filterRecordsByDateRange(mockRecords, '2024-01-15', '2024-01-16')
      expect(allFiltered).toHaveLength(4)
    })
  })

  describe('filterRecordsByMealType', () => {
    it('应该按餐次类型过滤记录', () => {
      const breakfast = filterRecordsByMealType(mockRecords, 'breakfast')
      expect(breakfast).toHaveLength(2)
      expect(breakfast.every(r => r.meal_type === 'breakfast')).toBe(true)
    })
  })

  describe('filterRecordsByDate', () => {
    it('应该按日期过滤记录', () => {
      const filtered = filterRecordsByDate(mockRecords, '2024-01-15')
      expect(filtered).toHaveLength(3)
      expect(filtered.every(r => r.record_date === '2024-01-15')).toBe(true)
    })
  })
})

describe('数据排序函数', () => {
  describe('sortRecordsByTime', () => {
    it('应该按时间排序记录', () => {
      const sorted = sortRecordsByTime(mockRecords)
      
      // 应该按日期、餐次、创建时间排序
      expect(sorted[0].record_date).toBe('2024-01-15')
      expect(sorted[0].meal_type).toBe('breakfast')
      expect(sorted[1].meal_type).toBe('lunch')
      expect(sorted[2].meal_type).toBe('dinner')
      expect(sorted[3].record_date).toBe('2024-01-16')
    })
  })

  describe('sortRecordsByCalories', () => {
    it('应该按卡路里降序排序', () => {
      const sorted = sortRecordsByCalories(mockRecords, true)
      expect(sorted[0].calories).toBe(260) // 米饭
      expect(sorted[1].calories).toBe(248) // 鸡胸肉
      expect(sorted[2].calories).toBe(108) // 香蕉
      expect(sorted[3].calories).toBe(52)  // 苹果
    })

    it('应该按卡路里升序排序', () => {
      const sorted = sortRecordsByCalories(mockRecords, false)
      expect(sorted[0].calories).toBe(52)  // 苹果
      expect(sorted[1].calories).toBe(108) // 香蕉
      expect(sorted[2].calories).toBe(248) // 鸡胸肉
      expect(sorted[3].calories).toBe(260) // 米饭
    })
  })
})

describe('日历数据处理函数', () => {
  describe('createCalendarDays', () => {
    it('应该创建日历天数据', () => {
      const recordDates = ['2024-01-15', '2024-01-16']
      const calendarDays = createCalendarDays(2024, 1, recordDates)
      
      expect(calendarDays).toHaveLength(42) // 6周 * 7天
      
      // 找到有记录的日期
      const day15 = calendarDays.find(d => d.date === '2024-01-15')
      const day16 = calendarDays.find(d => d.date === '2024-01-16')
      const day17 = calendarDays.find(d => d.date === '2024-01-17')
      
      expect(day15?.hasRecords).toBe(true)
      expect(day16?.hasRecords).toBe(true)
      expect(day17?.hasRecords).toBe(false)
    })
  })

  describe('createMonthData', () => {
    it('应该创建月份数据', () => {
      const monthData = createMonthData(2024, 1, mockRecords)
      
      expect(monthData.year).toBe(2024)
      expect(monthData.month).toBe(1)
      expect(monthData.days).toHaveLength(42)
      
      const day15 = monthData.days.find(d => d.date === '2024-01-15')
      const day16 = monthData.days.find(d => d.date === '2024-01-16')
      
      expect(day15?.hasRecords).toBe(true)
      expect(day15?.totalCalories).toBe(560)
      expect(day16?.hasRecords).toBe(true)
      expect(day16?.totalCalories).toBe(108)
    })
  })
})

describe('数据验证和清理函数', () => {
  describe('validateFoodRecord', () => {
    it('应该验证有效的食物记录', () => {
      const validRecord = {
        food_name: '苹果',
        meal_type: 'breakfast' as MealType,
        weight: 100,
        calories: 52,
        record_date: '2024-01-15'
      }
      
      expect(validateFoodRecord(validRecord)).toBe(true)
    })

    it('应该拒绝无效的食物记录', () => {
      expect(validateFoodRecord({})).toBe(false)
      expect(validateFoodRecord({ food_name: '苹果' })).toBe(false)
      expect(validateFoodRecord({ 
        food_name: '苹果', 
        meal_type: 'breakfast' as MealType,
        weight: 0,
        calories: 52,
        record_date: '2024-01-15'
      })).toBe(false)
    })
  })

  describe('cleanFoodRecordData', () => {
    it('应该清理食物记录数据', () => {
      const dirtyRecord = {
        food_name: '  苹果  ',
        weight: 100.567,
        calories: 52.8
      }
      
      const cleaned = cleanFoodRecordData(dirtyRecord)
      expect(cleaned.food_name).toBe('苹果')
      expect(cleaned.weight).toBe(100.57) // 保留两位小数
      expect(cleaned.calories).toBe(53)   // 取整
    })
  })
})

describe('数据导出函数', () => {
  describe('exportRecordsToCSV', () => {
    it('应该导出为 CSV 格式', () => {
      const csv = exportRecordsToCSV(mockRecords.slice(0, 2))
      const lines = csv.split('\n')
      
      expect(lines[0]).toContain('日期')
      expect(lines[0]).toContain('餐次')
      expect(lines[0]).toContain('食物名称')
      expect(lines[1]).toContain('2024-01-15')
      expect(lines[1]).toContain('早餐')
      expect(lines[1]).toContain('苹果')
      expect(lines[2]).toContain('中餐')
      expect(lines[2]).toContain('鸡胸肉')
    })
  })
})

describe('搜索和查找函数', () => {
  describe('searchRecords', () => {
    it('应该按食物名称搜索记录', () => {
      const results = searchRecords(mockRecords, '苹果')
      expect(results).toHaveLength(1)
      expect(results[0].food_name).toBe('苹果')
    })

    it('应该支持部分匹配', () => {
      const results = searchRecords(mockRecords, '鸡')
      expect(results).toHaveLength(1)
      expect(results[0].food_name).toBe('鸡胸肉')
    })

    it('应该忽略大小写', () => {
      const results = searchRecords(mockRecords, '苹')
      expect(results).toHaveLength(1)
    })

    it('应该处理空查询', () => {
      const results = searchRecords(mockRecords, '')
      expect(results).toHaveLength(mockRecords.length)
    })
  })

  describe('findRecordById', () => {
    it('应该按 ID 查找记录', () => {
      const record = findRecordById(mockRecords, '1')
      expect(record?.food_name).toBe('苹果')
    })

    it('应该返回 undefined 对于不存在的 ID', () => {
      const record = findRecordById(mockRecords, 'nonexistent')
      expect(record).toBeUndefined()
    })
  })

  describe('findRecordsByFoodName', () => {
    it('应该按食物名称查找记录', () => {
      const records = findRecordsByFoodName(mockRecords, '苹果')
      expect(records).toHaveLength(1)
      expect(records[0].food_name).toBe('苹果')
    })
  })
})

describe('数据聚合函数', () => {
  describe('aggregateRecordsByWeek', () => {
    it('应该按周聚合记录', () => {
      const aggregated = aggregateRecordsByWeek(mockRecords)
      const weeks = Object.keys(aggregated)
      
      expect(weeks.length).toBeGreaterThan(0)
      expect(weeks[0]).toMatch(/^\d{4}-W\d{2}$/) // 格式: 2024-W03
    })
  })
})

describe('数据比较函数', () => {
  describe('compareNutritionStats', () => {
    it('应该比较营养统计数据', () => {
      const current = {
        totalCalories: 600,
        mealBreakdown: { breakfast: 200, lunch: 200, dinner: 200, snack: 0 },
        averageCaloriesPerMeal: 200
      }
      
      const previous = {
        totalCalories: 500,
        mealBreakdown: { breakfast: 150, lunch: 150, dinner: 200, snack: 0 },
        averageCaloriesPerMeal: 167
      }
      
      const comparison = compareNutritionStats(current, previous)
      
      expect(comparison.totalCaloriesChange).toBe(100)
      expect(comparison.averageCaloriesChange).toBe(33)
      expect(comparison.percentageChange).toBe(20) // (600-500)/500 * 100 = 20%
    })

    it('应该处理零除法', () => {
      const current = { totalCalories: 100, mealBreakdown: { breakfast: 100, lunch: 0, dinner: 0, snack: 0 }, averageCaloriesPerMeal: 100 }
      const previous = { totalCalories: 0, mealBreakdown: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }, averageCaloriesPerMeal: 0 }
      
      const comparison = compareNutritionStats(current, previous)
      expect(comparison.percentageChange).toBe(0)
    })
  })
})