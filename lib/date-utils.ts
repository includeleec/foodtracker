// 日期处理和格式化工具函数

// 常量定义
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  DISPLAY_DATE: 'YYYY年MM月DD日',
  MONTH_YEAR: 'YYYY年MM月',
  WEEKDAY: ['日', '一', '二', '三', '四', '五', '六'],
  MONTH_NAMES: [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ],
} as const

// 基础日期函数
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentDateTime(): string {
  return new Date().toISOString()
}

export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

export function parseDate(dateString: string): Date | null {
  if (!isValidDateString(dateString)) {
    return null
  }
  return new Date(dateString + 'T00:00:00.000Z')
}

// 日期格式化函数
export function formatDate(date: Date | string, format: 'iso' | 'display' | 'month-year' = 'display'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()

  switch (format) {
    case 'iso':
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    case 'display':
      return `${year}年${month}月${day}日`
    case 'month-year':
      return `${year}年${month}月`
    default:
      return formatDate(dateObj, 'display')
  }
}

export function formatDateWithWeekday(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const weekday = DATE_FORMATS.WEEKDAY[dateObj.getDay()]
  const formattedDate = formatDate(dateObj, 'display')
  
  return `${formattedDate} 星期${weekday}`
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateStr = formatDate(dateObj, 'iso')
  const todayStr = formatDate(today, 'iso')
  const yesterdayStr = formatDate(yesterday, 'iso')
  const tomorrowStr = formatDate(tomorrow, 'iso')

  if (dateStr === todayStr) {
    return '今天'
  } else if (dateStr === yesterdayStr) {
    return '昨天'
  } else if (dateStr === tomorrowStr) {
    return '明天'
  } else {
    return formatDate(dateObj, 'display')
  }
}

// 日期计算函数
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  dateObj.setDate(dateObj.getDate() + days)
  return dateObj
}

export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days)
}

export function getStartOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
}

export function getEndOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
}

export function getStartOfWeek(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  const day = dateObj.getDay()
  const diff = dateObj.getDate() - day
  return new Date(dateObj.setDate(diff))
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getMonthCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDate = getStartOfWeek(firstDay)
  
  const days: Date[] = []
  let currentDate = new Date(startDate)
  
  // 生成6周的日期（42天），确保覆盖整个月份视图
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return days
}

// 日期比较函数
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  return formatDate(date1, 'iso') === formatDate(date2, 'iso')
}

export function isToday(date: Date | string): boolean {
  return isSameDate(date, new Date())
}

export function isYesterday(date: Date | string): boolean {
  const yesterday = subtractDays(new Date(), 1)
  return isSameDate(date, yesterday)
}

export function isTomorrow(date: Date | string): boolean {
  const tomorrow = addDays(new Date(), 1)
  return isSameDate(date, tomorrow)
}

export function isInCurrentMonth(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.getFullYear() === today.getFullYear() && 
         dateObj.getMonth() === today.getMonth()
}

export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return dateObj < today
}

export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  return dateObj > today
}

// 日期范围函数
export function getDateRange(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  const dates: string[] = []
  const currentDate = new Date(start)
  
  while (currentDate <= end) {
    dates.push(formatDate(currentDate, 'iso'))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

export function getWeekDateRange(date: Date | string): { start: string; end: string } {
  const startOfWeek = getStartOfWeek(date)
  const endOfWeek = addDays(startOfWeek, 6)
  
  return {
    start: formatDate(startOfWeek, 'iso'),
    end: formatDate(endOfWeek, 'iso')
  }
}

export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  
  return {
    start: formatDate(start, 'iso'),
    end: formatDate(end, 'iso')
  }
}

// 时区处理函数
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function convertToLocalDate(utcDateString: string): Date {
  return new Date(utcDateString)
}

export function convertToUTCString(localDate: Date): string {
  return localDate.toISOString()
}

// 日期输入辅助函数
export function getDateInputValue(date: Date | string): string {
  return formatDate(date, 'iso')
}

export function parseDateInputValue(value: string): Date | null {
  return parseDate(value)
}

// 日期验证函数
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  if (!start || !end) {
    return false
  }
  
  return start <= end
}

export function isReasonableFoodRecordDate(date: string): boolean {
  const recordDate = parseDate(date)
  if (!recordDate) {
    return false
  }
  
  const today = new Date()
  const oneYearAgo = subtractDays(today, 365)
  const oneWeekFromNow = addDays(today, 7)
  
  return recordDate >= oneYearAgo && recordDate <= oneWeekFromNow
}