// 日期工具函数单元测试

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  getCurrentDate,
  getCurrentDateTime,
  isValidDateString,
  parseDate,
  formatDate,
  formatDateWithWeekday,
  formatRelativeDate,
  addDays,
  subtractDays,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getDaysInMonth,
  getMonthCalendarDays,
  isSameDate,
  isToday,
  isYesterday,
  isTomorrow,
  isInCurrentMonth,
  isPastDate,
  isFutureDate,
  getDateRange,
  getWeekDateRange,
  getMonthDateRange,
  getLocalTimezone,
  convertToLocalDate,
  convertToUTCString,
  getDateInputValue,
  parseDateInputValue,
  isValidDateRange,
  isReasonableFoodRecordDate,
  DATE_FORMATS
} from '../date-utils'

// 模拟当前日期为 2024-01-15
const mockDate = new Date('2024-01-15T12:00:00.000Z')

describe('基础日期函数', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getCurrentDate', () => {
    it('应该返回当前日期的 ISO 格式', () => {
      const result = getCurrentDate()
      expect(result).toBe('2024-01-15')
    })
  })

  describe('getCurrentDateTime', () => {
    it('应该返回当前日期时间的 ISO 格式', () => {
      const result = getCurrentDateTime()
      expect(result).toBe('2024-01-15T12:00:00.000Z')
    })
  })

  describe('isValidDateString', () => {
    it('应该验证有效的日期字符串', () => {
      expect(isValidDateString('2024-01-15')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2000-02-29')).toBe(true) // 闰年
    })

    it('应该拒绝无效的日期字符串', () => {
      expect(isValidDateString('')).toBe(false)
      expect(isValidDateString('2024-13-01')).toBe(false)
      expect(isValidDateString('2024-01-32')).toBe(false)
      expect(isValidDateString('24-01-15')).toBe(false)
      expect(isValidDateString('2024/01/15')).toBe(false)
      expect(isValidDateString('invalid')).toBe(false)
    })
  })

  describe('parseDate', () => {
    it('应该解析有效的日期字符串', () => {
      const result = parseDate('2024-01-15')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe('2024-01-15T00:00:00.000Z')
    })

    it('应该返回 null 对于无效的日期字符串', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('2024-13-01')).toBeNull()
    })
  })
})

describe('日期格式化函数', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T12:00:00.000Z')

    it('应该格式化为 ISO 格式', () => {
      expect(formatDate(testDate, 'iso')).toBe('2024-01-15')
      expect(formatDate('2024-01-15', 'iso')).toBe('2024-01-15')
    })

    it('应该格式化为显示格式', () => {
      expect(formatDate(testDate, 'display')).toBe('2024年1月15日')
      expect(formatDate(testDate)).toBe('2024年1月15日') // 默认格式
    })

    it('应该格式化为月年格式', () => {
      expect(formatDate(testDate, 'month-year')).toBe('2024年1月')
    })

    it('应该处理无效日期', () => {
      expect(formatDate(new Date('invalid'))).toBe('')
      expect(formatDate('invalid')).toBe('')
    })
  })

  describe('formatDateWithWeekday', () => {
    it('应该包含星期信息', () => {
      const monday = new Date('2024-01-15T12:00:00.000Z') // 星期一
      expect(formatDateWithWeekday(monday)).toBe('2024年1月15日 星期一')
    })
  })

  describe('formatRelativeDate', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('应该返回相对日期描述', () => {
      expect(formatRelativeDate('2024-01-15')).toBe('今天')
      expect(formatRelativeDate('2024-01-14')).toBe('昨天')
      expect(formatRelativeDate('2024-01-16')).toBe('明天')
      expect(formatRelativeDate('2024-01-13')).toBe('2024年1月13日')
    })
  })
})

describe('日期计算函数', () => {
  describe('addDays', () => {
    it('应该正确添加天数', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, 5)
      expect(formatDate(result, 'iso')).toBe('2024-01-20')
    })

    it('应该处理跨月份', () => {
      const date = new Date('2024-01-30')
      const result = addDays(date, 5)
      expect(formatDate(result, 'iso')).toBe('2024-02-04')
    })

    it('应该处理字符串输入', () => {
      const result = addDays('2024-01-15', 3)
      expect(formatDate(result, 'iso')).toBe('2024-01-18')
    })
  })

  describe('subtractDays', () => {
    it('应该正确减去天数', () => {
      const date = new Date('2024-01-15')
      const result = subtractDays(date, 5)
      expect(formatDate(result, 'iso')).toBe('2024-01-10')
    })
  })

  describe('getStartOfMonth', () => {
    it('应该返回月初日期', () => {
      const date = new Date('2024-01-15')
      const result = getStartOfMonth(date)
      expect(formatDate(result, 'iso')).toBe('2024-01-01')
    })
  })

  describe('getEndOfMonth', () => {
    it('应该返回月末日期', () => {
      const date = new Date('2024-01-15')
      const result = getEndOfMonth(date)
      expect(formatDate(result, 'iso')).toBe('2024-01-31')
    })

    it('应该处理二月', () => {
      const date = new Date('2024-02-15')
      const result = getEndOfMonth(date)
      expect(formatDate(result, 'iso')).toBe('2024-02-29') // 2024是闰年
    })
  })

  describe('getDaysInMonth', () => {
    it('应该返回正确的月份天数', () => {
      expect(getDaysInMonth(2024, 1)).toBe(31) // 一月
      expect(getDaysInMonth(2024, 2)).toBe(29) // 二月（闰年）
      expect(getDaysInMonth(2023, 2)).toBe(28) // 二月（平年）
      expect(getDaysInMonth(2024, 4)).toBe(30) // 四月
    })
  })

  describe('getMonthCalendarDays', () => {
    it('应该返回日历视图的所有日期', () => {
      const days = getMonthCalendarDays(2024, 1)
      expect(days).toHaveLength(42) // 6周 * 7天
      expect(formatDate(days[0], 'iso')).toBe('2023-12-31') // 上月末
      expect(formatDate(days[days.length - 1], 'iso')).toBe('2024-02-10') // 下月初
    })
  })
})

describe('日期比较函数', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('isSameDate', () => {
    it('应该正确比较相同日期', () => {
      expect(isSameDate('2024-01-15', '2024-01-15')).toBe(true)
      expect(isSameDate(new Date('2024-01-15'), '2024-01-15')).toBe(true)
      expect(isSameDate('2024-01-15', '2024-01-16')).toBe(false)
    })
  })

  describe('isToday', () => {
    it('应该正确识别今天', () => {
      expect(isToday('2024-01-15')).toBe(true)
      expect(isToday('2024-01-14')).toBe(false)
      expect(isToday(new Date('2024-01-15'))).toBe(true)
    })
  })

  describe('isYesterday', () => {
    it('应该正确识别昨天', () => {
      expect(isYesterday('2024-01-14')).toBe(true)
      expect(isYesterday('2024-01-15')).toBe(false)
      expect(isYesterday('2024-01-13')).toBe(false)
    })
  })

  describe('isTomorrow', () => {
    it('应该正确识别明天', () => {
      expect(isTomorrow('2024-01-16')).toBe(true)
      expect(isTomorrow('2024-01-15')).toBe(false)
      expect(isTomorrow('2024-01-17')).toBe(false)
    })
  })

  describe('isInCurrentMonth', () => {
    it('应该正确识别当前月份', () => {
      expect(isInCurrentMonth('2024-01-01')).toBe(true)
      expect(isInCurrentMonth('2024-01-31')).toBe(true)
      expect(isInCurrentMonth('2024-02-01')).toBe(false)
      expect(isInCurrentMonth('2023-01-15')).toBe(false)
    })
  })

  describe('isPastDate', () => {
    it('应该正确识别过去日期', () => {
      expect(isPastDate('2024-01-14')).toBe(true)
      expect(isPastDate('2024-01-15')).toBe(false)
      expect(isPastDate('2024-01-16')).toBe(false)
    })
  })

  describe('isFutureDate', () => {
    it('应该正确识别未来日期', () => {
      expect(isFutureDate('2024-01-16')).toBe(true)
      expect(isFutureDate('2024-01-15')).toBe(false)
      expect(isFutureDate('2024-01-14')).toBe(false)
    })
  })
})

describe('日期范围函数', () => {
  describe('getDateRange', () => {
    it('应该生成日期范围', () => {
      const range = getDateRange('2024-01-15', '2024-01-18')
      expect(range).toEqual([
        '2024-01-15',
        '2024-01-16',
        '2024-01-17',
        '2024-01-18'
      ])
    })

    it('应该处理单日范围', () => {
      const range = getDateRange('2024-01-15', '2024-01-15')
      expect(range).toEqual(['2024-01-15'])
    })
  })

  describe('getWeekDateRange', () => {
    it('应该返回周日期范围', () => {
      const range = getWeekDateRange('2024-01-15') // 星期一
      expect(range.start).toBe('2024-01-14') // 星期日
      expect(range.end).toBe('2024-01-20') // 星期六
    })
  })

  describe('getMonthDateRange', () => {
    it('应该返回月日期范围', () => {
      const range = getMonthDateRange(2024, 1)
      expect(range.start).toBe('2024-01-01')
      expect(range.end).toBe('2024-01-31')
    })
  })
})

describe('时区处理函数', () => {
  describe('getLocalTimezone', () => {
    it('应该返回本地时区', () => {
      const timezone = getLocalTimezone()
      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
    })
  })

  describe('convertToLocalDate', () => {
    it('应该转换 UTC 字符串为本地日期', () => {
      const result = convertToLocalDate('2024-01-15T12:00:00.000Z')
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('convertToUTCString', () => {
    it('应该转换本地日期为 UTC 字符串', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = convertToUTCString(date)
      expect(result).toBe('2024-01-15T12:00:00.000Z')
    })
  })
})

describe('日期输入辅助函数', () => {
  describe('getDateInputValue', () => {
    it('应该返回适合输入框的日期值', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      expect(getDateInputValue(date)).toBe('2024-01-15')
      expect(getDateInputValue('2024-01-15')).toBe('2024-01-15')
    })
  })

  describe('parseDateInputValue', () => {
    it('应该解析输入框的日期值', () => {
      const result = parseDateInputValue('2024-01-15')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe('2024-01-15T00:00:00.000Z')
    })

    it('应该返回 null 对于无效输入', () => {
      expect(parseDateInputValue('invalid')).toBeNull()
    })
  })
})

describe('日期验证函数', () => {
  describe('isValidDateRange', () => {
    it('应该验证有效的日期范围', () => {
      expect(isValidDateRange('2024-01-15', '2024-01-20')).toBe(true)
      expect(isValidDateRange('2024-01-15', '2024-01-15')).toBe(true)
    })

    it('应该拒绝无效的日期范围', () => {
      expect(isValidDateRange('2024-01-20', '2024-01-15')).toBe(false)
      expect(isValidDateRange('invalid', '2024-01-15')).toBe(false)
      expect(isValidDateRange('2024-01-15', 'invalid')).toBe(false)
    })
  })

  describe('isReasonableFoodRecordDate', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('应该接受合理的食物记录日期', () => {
      expect(isReasonableFoodRecordDate('2024-01-15')).toBe(true) // 今天
      expect(isReasonableFoodRecordDate('2024-01-14')).toBe(true) // 昨天
      expect(isReasonableFoodRecordDate('2023-02-01')).toBe(true) // 一年内
      expect(isReasonableFoodRecordDate('2024-01-20')).toBe(true) // 一周内的未来
    })

    it('应该拒绝不合理的食物记录日期', () => {
      expect(isReasonableFoodRecordDate('2022-01-15')).toBe(false) // 超过一年
      expect(isReasonableFoodRecordDate('2024-02-01')).toBe(false) // 超过一周的未来
      expect(isReasonableFoodRecordDate('invalid')).toBe(false) // 无效日期
    })
  })
})

describe('常量定义', () => {
  it('应该定义正确的日期格式常量', () => {
    expect(DATE_FORMATS.ISO_DATE).toBe('YYYY-MM-DD')
    expect(DATE_FORMATS.DISPLAY_DATE).toBe('YYYY年MM月DD日')
    expect(DATE_FORMATS.WEEKDAY).toHaveLength(7)
    expect(DATE_FORMATS.WEEKDAY[0]).toBe('日')
    expect(DATE_FORMATS.MONTH_NAMES).toHaveLength(12)
    expect(DATE_FORMATS.MONTH_NAMES[0]).toBe('一月')
  })
})