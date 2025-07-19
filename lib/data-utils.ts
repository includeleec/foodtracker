// 数据处理和统计工具函数

import type { 
  FoodRecord, 
  DailyRecords, 
  MealType, 
  NutritionStats,
  CalendarDay,
  MonthData
} from '../types/database'
import { formatDate, getCurrentDate, getMonthCalendarDays } from './date-utils'

// 数据分组和处理函数
export function groupRecordsByMeal(records: FoodRecord[]): Record<MealType, FoodRecord[]> {
  const grouped: Record<MealType, FoodRecord[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  }

  records.forEach(record => {
    if (grouped[record.meal_type]) {
      grouped[record.meal_type].push(record)
    }
  })

  return grouped
}

export function groupRecordsByDate(records: FoodRecord[]): Record<string, FoodRecord[]> {
  return records.reduce((acc, record) => {
    const date = record.record_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(record)
    return acc
  }, {} as Record<string, FoodRecord[]>)
}

export function createDailyRecords(date: string, records: FoodRecord[]): DailyRecords {
  const mealGroups = groupRecordsByMeal(records)
  const totalCalories = calculateTotalCalories(records)

  return {
    date,
    breakfast: mealGroups.breakfast,
    lunch: mealGroups.lunch,
    dinner: mealGroups.dinner,
    snack: mealGroups.snack,
    totalCalories
  }
}

// 卡路里计算函数
export function calculateTotalCalories(records: FoodRecord[]): number {
  return records.reduce((total, record) => total + record.calories, 0)
}

export function calculateMealCalories(records: FoodRecord[], mealType: MealType): number {
  return records
    .filter(record => record.meal_type === mealType)
    .reduce((total, record) => total + record.calories, 0)
}

export function calculateDailyCaloriesByMeal(records: FoodRecord[]): Record<MealType, number> {
  const mealGroups = groupRecordsByMeal(records)
  
  return {
    breakfast: calculateTotalCalories(mealGroups.breakfast),
    lunch: calculateTotalCalories(mealGroups.lunch),
    dinner: calculateTotalCalories(mealGroups.dinner),
    snack: calculateTotalCalories(mealGroups.snack)
  }
}

// 统计分析函数
export function calculateNutritionStats(records: FoodRecord[]): NutritionStats {
  const totalCalories = calculateTotalCalories(records)
  const mealBreakdown = calculateDailyCaloriesByMeal(records)
  
  const totalMeals = Object.values(mealBreakdown).filter(calories => calories > 0).length
  const averageCaloriesPerMeal = totalMeals > 0 ? totalCalories / totalMeals : 0

  return {
    totalCalories,
    mealBreakdown,
    averageCaloriesPerMeal: Math.round(averageCaloriesPerMeal)
  }
}

export function calculateWeeklyAverage(dailyRecords: DailyRecords[]): number {
  if (dailyRecords.length === 0) return 0
  
  const totalCalories = dailyRecords.reduce((sum, day) => sum + day.totalCalories, 0)
  return Math.round(totalCalories / dailyRecords.length)
}

export function calculateMonthlyAverage(dailyRecords: DailyRecords[]): number {
  return calculateWeeklyAverage(dailyRecords) // 同样的计算逻辑
}

// 数据过滤函数
export function filterRecordsByDateRange(
  records: FoodRecord[], 
  startDate: string, 
  endDate: string
): FoodRecord[] {
  return records.filter(record => 
    record.record_date >= startDate && record.record_date <= endDate
  )
}

export function filterRecordsByMealType(records: FoodRecord[], mealType: MealType): FoodRecord[] {
  return records.filter(record => record.meal_type === mealType)
}

export function filterRecordsByDate(records: FoodRecord[], date: string): FoodRecord[] {
  return records.filter(record => record.record_date === date)
}

// 数据排序函数
export function sortRecordsByTime(records: FoodRecord[]): FoodRecord[] {
  return [...records].sort((a, b) => {
    // 首先按日期排序
    const dateComparison = a.record_date.localeCompare(b.record_date)
    if (dateComparison !== 0) return dateComparison
    
    // 然后按餐次排序
    const mealOrder: Record<MealType, number> = {
      breakfast: 1,
      lunch: 2,
      dinner: 3,
      snack: 4
    }
    const mealComparison = mealOrder[a.meal_type] - mealOrder[b.meal_type]
    if (mealComparison !== 0) return mealComparison
    
    // 最后按创建时间排序
    return a.created_at.localeCompare(b.created_at)
  })
}

export function sortRecordsByCalories(records: FoodRecord[], descending = true): FoodRecord[] {
  return [...records].sort((a, b) => 
    descending ? b.calories - a.calories : a.calories - b.calories
  )
}

// 日历数据处理函数
export function createCalendarDays(
  year: number, 
  month: number, 
  recordDates: string[]
): CalendarDay[] {
  const calendarDates = getMonthCalendarDays(year, month)
  const recordDateSet = new Set(recordDates)
  
  return calendarDates.map(date => {
    const dateString = formatDate(date, 'iso')
    return {
      date: dateString,
      hasRecords: recordDateSet.has(dateString)
    }
  })
}

export function createMonthData(
  year: number, 
  month: number, 
  records: FoodRecord[]
): MonthData {
  const recordsByDate = groupRecordsByDate(records)
  const calendarDates = getMonthCalendarDays(year, month)
  
  const days: CalendarDay[] = calendarDates.map(date => {
    const dateString = formatDate(date, 'iso')
    const dayRecords = recordsByDate[dateString] || []
    const totalCalories = calculateTotalCalories(dayRecords)
    
    return {
      date: dateString,
      hasRecords: dayRecords.length > 0,
      totalCalories: totalCalories > 0 ? totalCalories : undefined
    }
  })

  return {
    year,
    month,
    days
  }
}

// 数据验证和清理函数
export function validateFoodRecord(record: Partial<FoodRecord>): boolean {
  return !!(
    record.food_name &&
    record.meal_type &&
    typeof record.weight === 'number' &&
    typeof record.calories === 'number' &&
    record.record_date &&
    record.weight > 0 &&
    record.calories > 0
  )
}

export function cleanFoodRecordData(record: Partial<FoodRecord>): Partial<FoodRecord> {
  return {
    ...record,
    food_name: record.food_name?.trim(),
    weight: record.weight ? Math.round(record.weight * 100) / 100 : record.weight, // 保留两位小数
    calories: record.calories ? Math.round(record.calories) : record.calories, // 卡路里取整
  }
}

// 数据导出函数
export function exportRecordsToCSV(records: FoodRecord[]): string {
  const headers = ['日期', '餐次', '食物名称', '重量(g)', '卡路里', '创建时间']
  const mealTypeMap: Record<MealType, string> = {
    breakfast: '早餐',
    lunch: '中餐',
    dinner: '晚餐',
    snack: '加餐'
  }
  
  const rows = records.map(record => [
    record.record_date,
    mealTypeMap[record.meal_type],
    record.food_name,
    record.weight.toString(),
    record.calories.toString(),
    new Date(record.created_at).toLocaleString('zh-CN')
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  return csvContent
}

// 搜索和查找函数
export function searchRecords(records: FoodRecord[], query: string): FoodRecord[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return records
  
  return records.filter(record =>
    record.food_name.toLowerCase().includes(lowerQuery)
  )
}

export function findRecordById(records: FoodRecord[], id: string): FoodRecord | undefined {
  return records.find(record => record.id === id)
}

export function findRecordsByFoodName(records: FoodRecord[], foodName: string): FoodRecord[] {
  return records.filter(record => 
    record.food_name.toLowerCase().includes(foodName.toLowerCase())
  )
}

// 数据聚合函数
export function aggregateRecordsByWeek(records: FoodRecord[]): Record<string, DailyRecords[]> {
  // 这里简化实现，实际应用中可能需要更复杂的周聚合逻辑
  const recordsByDate = groupRecordsByDate(records)
  const weeks: Record<string, DailyRecords[]> = {}
  
  Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
    const weekKey = getWeekKey(date)
    if (!weeks[weekKey]) {
      weeks[weekKey] = []
    }
    weeks[weekKey].push(createDailyRecords(date, dayRecords))
  })
  
  return weeks
}

function getWeekKey(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const weekNumber = getWeekNumber(date)
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 数据比较函数
export function compareNutritionStats(
  current: NutritionStats, 
  previous: NutritionStats
): {
  totalCaloriesChange: number
  averageCaloriesChange: number
  percentageChange: number
} {
  const totalCaloriesChange = current.totalCalories - previous.totalCalories
  const averageCaloriesChange = current.averageCaloriesPerMeal - previous.averageCaloriesPerMeal
  const percentageChange = previous.totalCalories > 0 
    ? ((current.totalCalories - previous.totalCalories) / previous.totalCalories) * 100 
    : 0

  return {
    totalCaloriesChange,
    averageCaloriesChange,
    percentageChange: Math.round(percentageChange * 100) / 100
  }
}