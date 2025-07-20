import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HistoryPage from '../page'
import { FoodRecordService } from '@/lib/database'
import { getCurrentDate } from '@/lib/date-utils'
import { AuthProvider } from '@/lib/auth-context'

// Mock useAuth hook
jest.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com' },
    signOut: jest.fn()
  })
}))

// Mock the database service
jest.mock('@/lib/database', () => ({
  FoodRecordService: {
    getFoodRecordsByDate: jest.fn()
  }
}))

// Mock client API
jest.mock('@/lib/client-api', () => ({
  ClientAPI: {
    getFoodRecordsByDate: jest.fn()
  }
}))

// Mock the calendar component
jest.mock('@/components/calendar', () => ({
  FoodCalendar: ({ selectedDate, onDateSelect }: any) => (
    <div data-testid="food-calendar">
      <div>Selected: {selectedDate}</div>
      <button onClick={() => onDateSelect('2024-01-10')}>
        Select 2024-01-10
      </button>
    </div>
  )
}))

// Mock the food records display component
jest.mock('@/components/food', () => ({
  FoodRecordsDisplay: ({ records, showActions }: any) => (
    <div data-testid="food-records-display">
      <div>Records count: {records.length}</div>
      <div>Show actions: {showActions ? 'true' : 'false'}</div>
      {records.map((record: any) => (
        <div key={record.id} data-testid={`record-${record.id}`}>
          {record.food_name}
        </div>
      ))}
    </div>
  )
}))

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  getCurrentDate: jest.fn(),
  formatDateWithWeekday: jest.fn()
}))

const mockGetFoodRecordsByDate = FoodRecordService.getFoodRecordsByDate as jest.MockedFunction<typeof FoodRecordService.getFoodRecordsByDate>
const mockGetCurrentDate = getCurrentDate as jest.MockedFunction<typeof getCurrentDate>
const mockFormatDateWithWeekday = require('@/lib/date-utils').formatDateWithWeekday as jest.MockedFunction<any>

// Mock date to a fixed date for testing
const MOCK_DATE = new Date('2024-01-15T00:00:00.000Z')

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(MOCK_DATE)
    
    mockGetCurrentDate.mockReturnValue('2024-01-15')
    mockFormatDateWithWeekday.mockImplementation((date: string) => `${date} 星期一`)
    mockGetFoodRecordsByDate.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render page title and description', () => {
    render(<HistoryPage />)
    
    expect(screen.getByText('📅 历史记录')).toBeInTheDocument()
    expect(screen.getByText('查看过往的饮食记录，追踪您的健康历程')).toBeInTheDocument()
  })

  it('should render calendar and records display', async () => {
    // Mock with some records so the display component renders
    const mockRecords = [
      {
        id: '1',
        food_name: '苹果',
        meal_type: 'breakfast' as const,
        weight: 100,
        calories: 52,
        record_date: '2024-01-15',
        user_id: 'user1',
        image_url: null,
        image_id: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z'
      }
    ]
    mockGetFoodRecordsByDate.mockResolvedValue(mockRecords)
    
    render(<HistoryPage />)
    
    expect(screen.getByTestId('food-calendar')).toBeInTheDocument()
    
    // Wait for loading to complete and records display to appear
    await waitFor(() => {
      expect(screen.getByTestId('food-records-display')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should load records for current date on mount', async () => {
    render(<HistoryPage />)
    
    await waitFor(() => {
      expect(mockGetFoodRecordsByDate).toHaveBeenCalledWith('2024-01-15')
    })
  })

  it('should display selected date with weekday', async () => {
    render(<HistoryPage />)
    
    await waitFor(() => {
      expect(mockFormatDateWithWeekday).toHaveBeenCalledWith('2024-01-15')
      expect(screen.getByText('2024-01-15 星期一')).toBeInTheDocument()
    })
  })

  it('should load records when date is selected', async () => {
    const mockRecords = [
      {
        id: '1',
        food_name: '苹果',
        meal_type: 'breakfast' as const,
        weight: 100,
        calories: 52,
        record_date: '2024-01-10',
        user_id: 'user1',
        image_url: null,
        image_id: null,
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-10T08:00:00Z'
      }
    ]
    
    mockGetFoodRecordsByDate.mockResolvedValue(mockRecords)
    
    render(<HistoryPage />)
    
    // Click to select a different date
    const selectButton = screen.getByText('Select 2024-01-10')
    fireEvent.click(selectButton)
    
    await waitFor(() => {
      expect(mockGetFoodRecordsByDate).toHaveBeenCalledWith('2024-01-10')
    })
    
    await waitFor(() => {
      expect(screen.getByText('Records count: 1')).toBeInTheDocument()
      expect(screen.getByTestId('record-1')).toBeInTheDocument()
    })
  })

  it('should show empty state when no records', async () => {
    mockGetFoodRecordsByDate.mockResolvedValue([])
    
    render(<HistoryPage />)
    
    await waitFor(() => {
      expect(screen.getByText('这一天还没有记录')).toBeInTheDocument()
      expect(screen.getByText('选择其他日期查看历史记录')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    mockGetFoodRecordsByDate.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<HistoryPage />)
    
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should show error state and retry button', async () => {
    const errorMessage = '网络错误'
    mockGetFoodRecordsByDate.mockRejectedValue(new Error(errorMessage))
    
    render(<HistoryPage />)
    
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    const retryButton = screen.getByText('重试')
    expect(retryButton).toBeInTheDocument()
    
    // Test retry functionality
    mockGetFoodRecordsByDate.mockResolvedValue([])
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(mockGetFoodRecordsByDate).toHaveBeenCalledTimes(2)
    })
  })

  it('should hide actions in food records display', async () => {
    // Mock with some records so the display component renders
    const mockRecords = [
      {
        id: '1',
        food_name: '苹果',
        meal_type: 'breakfast' as const,
        weight: 100,
        calories: 52,
        record_date: '2024-01-15',
        user_id: 'user1',
        image_url: null,
        image_id: null,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T08:00:00Z'
      }
    ]
    mockGetFoodRecordsByDate.mockResolvedValue(mockRecords)
    
    render(<HistoryPage />)
    
    // Wait for loading to complete and records display to appear
    await waitFor(() => {
      expect(screen.getByTestId('food-records-display')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    expect(screen.getByText('Show actions: false')).toBeInTheDocument()
  })

  it('should have back to today button in empty state', async () => {
    mockGetFoodRecordsByDate.mockResolvedValue([])
    
    render(<HistoryPage />)
    
    await waitFor(() => {
      const backToTodayButton = screen.getByText('回到今天')
      expect(backToTodayButton).toBeInTheDocument()
      
      fireEvent.click(backToTodayButton)
      
      expect(screen.getByText('Selected: 2024-01-15')).toBeInTheDocument()
    })
  })

  it('should update selected date when calendar date is selected', async () => {
    render(<HistoryPage />)
    
    // Initially shows current date
    expect(screen.getByText('Selected: 2024-01-15')).toBeInTheDocument()
    
    // Select a different date
    const selectButton = screen.getByText('Select 2024-01-10')
    fireEvent.click(selectButton)
    
    // Should update to new date
    expect(screen.getByText('Selected: 2024-01-10')).toBeInTheDocument()
  })

  it('should display records with correct props', async () => {
    const mockRecords = [
      {
        id: '1',
        food_name: '苹果',
        meal_type: 'breakfast' as const,
        weight: 100,
        calories: 52,
        record_date: '2024-01-10',
        user_id: 'user1',
        image_url: null,
        image_id: null,
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-10T08:00:00Z'
      },
      {
        id: '2',
        food_name: '香蕉',
        meal_type: 'lunch' as const,
        weight: 120,
        calories: 89,
        record_date: '2024-01-10',
        user_id: 'user1',
        image_url: null,
        image_id: null,
        created_at: '2024-01-10T12:00:00Z',
        updated_at: '2024-01-10T12:00:00Z'
      }
    ]
    
    mockGetFoodRecordsByDate.mockResolvedValue(mockRecords)
    
    render(<HistoryPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Records count: 2')).toBeInTheDocument()
      expect(screen.getByText('Show actions: false')).toBeInTheDocument()
      expect(screen.getByTestId('record-1')).toBeInTheDocument()
      expect(screen.getByTestId('record-2')).toBeInTheDocument()
    })
  })
})