import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarDay } from '../calendar-day'

describe('CalendarDay', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render date number correctly', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    fireEvent.click(dayElement)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should call onClick when Enter key is pressed', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    fireEvent.keyDown(dayElement, { key: 'Enter' })
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should call onClick when Space key is pressed', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    fireEvent.keyDown(dayElement, { key: ' ' })
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick for other keys', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    fireEvent.keyDown(dayElement, { key: 'Tab' })
    
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should show selected state', () => {
    render(<CalendarDay date="2024-01-15" isSelected={true} onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement).toHaveAttribute('aria-pressed', 'true')
    expect(dayElement).toHaveClass('bg-blue-500')
  })

  it('should show today state', () => {
    render(<CalendarDay date="2024-01-15" isToday={true} onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement).toHaveClass('border-blue-500')
  })

  it('should show current month styling', () => {
    render(<CalendarDay date="2024-01-15" isCurrentMonth={true} onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement.className).toContain('text-gray-900')
  })

  it('should show non-current month styling', () => {
    render(<CalendarDay date="2024-01-15" isCurrentMonth={false} onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement.className).toContain('text-gray-400')
    expect(dayElement.className).toContain('bg-gray-50')
  })

  it('should render children content', () => {
    render(
      <CalendarDay date="2024-01-15" onClick={mockOnClick}>
        <div data-testid="child-content">Test Content</div>
      </CalendarDay>
    )
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement).toHaveAttribute('aria-label', '选择日期 2024-01-15')
    expect(dayElement).toHaveAttribute('tabIndex', '0')
  })

  it('should apply custom className', () => {
    render(<CalendarDay date="2024-01-15" onClick={mockOnClick} className="custom-class" />)
    
    const dayElement = screen.getByRole('button')
    expect(dayElement).toHaveClass('custom-class')
  })

  it('should show today indicator dot when isToday is true and not selected', () => {
    render(<CalendarDay date="2024-01-15" isToday={true} isSelected={false} onClick={mockOnClick} />)
    
    // The today indicator is a small dot at the bottom
    const dayElement = screen.getByRole('button')
    const todayDot = dayElement.querySelector('.bg-blue-500.rounded-full')
    expect(todayDot).toBeInTheDocument()
  })

  it('should not show today indicator when selected', () => {
    render(<CalendarDay date="2024-01-15" isToday={true} isSelected={true} onClick={mockOnClick} />)
    
    // When selected, the today indicator should not be shown
    const dayElement = screen.getByRole('button')
    const todayDots = dayElement.querySelectorAll('.bg-blue-500.rounded-full')
    // Should not have the small indicator dot (the selected background is different)
    expect(todayDots.length).toBe(0)
  })
})