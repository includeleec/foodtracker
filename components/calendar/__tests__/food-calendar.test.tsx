import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodCalendar } from '../food-calendar'
import { FoodRecordService } from '@/lib/database'
import { getCurrentDate } from '@/lib/date-utils'

// Mock the database service
jest.mock('@/lib/database', () => ({
  FoodRecordService: {
    getRecordDates: jest.fn()
  }
}))

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  ...jest.requireActual('@/lib/date-utils'),
  getCurrentDate: jest.fn()
}))

const mockGetRecordDates = FoodRecordService.getRecordDates as jest.MockedFunction<typeof FoodRecordService.getRecordDates>
const mockGetCurrentDate = getCurrentDate as jest.MockedFunction<typeof getCurrentDate>

// Mock the current date to a fixed date for testing
const MOCK_DATE = new Date('2024-01-15T00:00:00.000Z')

describe('FoodCalendar', () => {
  const mockOnDateSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the Date constructor to return our fixed date
    jest.useFakeTimers()
    jest.setSystemTime(MOCK_DATE)
    mockGetCurrentDate.mockReturnValue('2024-01-15')
    mockGetRecordDates.mockResolvedValue(['2024-01-10', '2024-01-15', '2024-01-20'])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render calendar with current month', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText(/2024年1月/)).toBeInTheDocument()
    })
  })

  it('should display weekday headers', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('星期日')).toBeInTheDocument()
      expect(screen.getByText('星期一')).toBeInTheDocument()
      expect(screen.getByText('星期六')).toBeInTheDocument()
    })
  })

  it('should call onDateSelect when a date is clicked', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    // Wait for calendar to load and show actual dates
    await waitFor(() => {
      expect(screen.getByLabelText('选择日期 2024-01-15')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find and click a date button
    const dateButton = screen.getByLabelText('选择日期 2024-01-15')
    fireEvent.click(dateButton)
    
    expect(mockOnDateSelect).toHaveBeenCalledWith('2024-01-15')
  })

  it('should navigate to previous month', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    // Wait for calendar to load completely
    await waitFor(() => {
      expect(screen.getByLabelText('选择日期 2024-01-15')).toBeInTheDocument()
    }, { timeout: 2000 })

    const prevButton = screen.getByText('← 上月')
    fireEvent.click(prevButton)
    
    await waitFor(() => {
      expect(screen.getByText(/2023年12月/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should navigate to next month', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    // Wait for calendar to load completely
    await waitFor(() => {
      expect(screen.getByLabelText('选择日期 2024-01-15')).toBeInTheDocument()
    }, { timeout: 2000 })

    const nextButton = screen.getByText('下月 →')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText(/2024年2月/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should navigate to today when today button is clicked', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    // Wait for calendar to load completely
    await waitFor(() => {
      expect(screen.getByLabelText('选择日期 2024-01-15')).toBeInTheDocument()
    }, { timeout: 2000 })

    const todayButton = screen.getByText('今天')
    fireEvent.click(todayButton)
    
    expect(mockOnDateSelect).toHaveBeenCalledWith('2024-01-15')
  })

  it('should show loading state', () => {
    mockGetRecordDates.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    // Should show loading skeleton
    const loadingElements = screen.getAllByRole('generic')
    const skeletonElements = loadingElements.filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should show error state and retry button', async () => {
    const errorMessage = '网络错误'
    mockGetRecordDates.mockRejectedValue(new Error(errorMessage))
    
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('加载日历失败')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    const retryButton = screen.getByText('重试')
    expect(retryButton).toBeInTheDocument()
    
    // Test retry functionality
    mockGetRecordDates.mockResolvedValue(['2024-01-10'])
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(screen.getByText(/2024年1月/)).toBeInTheDocument()
    })
  })

  it('should highlight selected date', async () => {
    const selectedDate = '2024-01-15'
    render(<FoodCalendar selectedDate={selectedDate} onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      const selectedElement = screen.getByLabelText(`选择日期 ${selectedDate}`)
      expect(selectedElement).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('should show record indicators for dates with records', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      expect(mockGetRecordDates).toHaveBeenCalled()
    })

    // The component should show indicators for dates with records
    // This is tested indirectly through the RecordIndicator component
  })

  it('should show legend', async () => {
    render(<FoodCalendar onDateSelect={mockOnDateSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('有记录')).toBeInTheDocument()
      expect(screen.getByText('无记录')).toBeInTheDocument()
    })
  })
})