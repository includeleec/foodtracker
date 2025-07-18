import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DashboardPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  it('should render dashboard cards', () => {
    render(<DashboardPage />)

    expect(screen.getByText('今日记录')).toBeInTheDocument()
    expect(screen.getByText('记录今天的饮食')).toBeInTheDocument()
    expect(screen.getByText('历史记录')).toBeInTheDocument()
    expect(screen.getByText('查看过往记录')).toBeInTheDocument()
    expect(screen.getByText('数据统计')).toBeInTheDocument()
    expect(screen.getByText('饮食分析报告')).toBeInTheDocument()
  })

  it('should render quick start guide', () => {
    render(<DashboardPage />)

    expect(screen.getByText('快速开始')).toBeInTheDocument()
    expect(screen.getByText(/点击"开始记录"按钮/)).toBeInTheDocument()
    expect(screen.getByText(/选择餐次类型/)).toBeInTheDocument()
    expect(screen.getByText(/填写食物名称、重量、卡路里/)).toBeInTheDocument()
    expect(screen.getByText(/保存记录，系统会自动计算/)).toBeInTheDocument()
  })

  it('should navigate to today page when clicking start recording button', () => {
    render(<DashboardPage />)

    const startButton = screen.getByText('开始记录')
    fireEvent.click(startButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/today')
  })

  it('should navigate to history page when clicking view history button', () => {
    render(<DashboardPage />)

    const historyButton = screen.getByText('查看历史')
    fireEvent.click(historyButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/history')
  })

  it('should have statistics button disabled', () => {
    render(<DashboardPage />)

    const statsButton = screen.getByText('即将推出')
    expect(statsButton).toBeDisabled()
  })

  it('should display card icons', () => {
    render(<DashboardPage />)

    // Check for emoji icons in the cards
    expect(screen.getByText('📝')).toBeInTheDocument()
    expect(screen.getByText('📅')).toBeInTheDocument()
    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  it('should have proper card structure', () => {
    render(<DashboardPage />)

    // Check that cards have proper styling classes
    const cards = screen.getAllByRole('generic').filter(el => 
      el.className.includes('bg-white') && el.className.includes('shadow')
    )
    expect(cards).toHaveLength(3)
  })

  it('should display numbered steps in quick start guide', () => {
    render(<DashboardPage />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should have responsive grid layout', () => {
    render(<DashboardPage />)

    const gridContainer = screen.getByText('今日记录').closest('.grid')
    expect(gridContainer).toHaveClass('grid', 'gap-6', 'md:grid-cols-2', 'lg:grid-cols-3')
  })
})