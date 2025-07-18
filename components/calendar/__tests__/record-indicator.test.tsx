import { render, screen } from '@testing-library/react'
import { RecordIndicator } from '../record-indicator'

describe('RecordIndicator', () => {
  it('should show gray dot when no records', () => {
    const { container } = render(<RecordIndicator hasRecords={false} />)
    
    const indicator = container.querySelector('.bg-gray-300')
    expect(indicator).toBeInTheDocument()
  })

  it('should show blue dot when has records', () => {
    const { container } = render(<RecordIndicator hasRecords={true} />)
    
    const indicator = container.querySelector('.bg-blue-500')
    expect(indicator).toBeInTheDocument()
  })

  it('should display total calories when provided', () => {
    render(<RecordIndicator hasRecords={true} totalCalories={1500} />)
    
    expect(screen.getByText('999+')).toBeInTheDocument()
  })

  it('should display 999+ for calories over 999', () => {
    render(<RecordIndicator hasRecords={true} totalCalories={1200} />)
    
    expect(screen.getByText('999+')).toBeInTheDocument()
  })

  it('should not display calories when hasRecords is false', () => {
    render(<RecordIndicator hasRecords={false} totalCalories={1500} />)
    
    expect(screen.queryByText('1500')).not.toBeInTheDocument()
  })

  it('should not display calories when totalCalories is undefined', () => {
    render(<RecordIndicator hasRecords={true} />)
    
    // Should only show the blue dot, no text
    const textElements = screen.queryAllByText(/\d+/)
    expect(textElements).toHaveLength(0)
  })

  it('should apply custom className', () => {
    const { container } = render(
      <RecordIndicator hasRecords={true} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should handle zero calories', () => {
    render(<RecordIndicator hasRecords={true} totalCalories={0} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should handle edge case of exactly 999 calories', () => {
    render(<RecordIndicator hasRecords={true} totalCalories={999} />)
    
    expect(screen.getByText('999')).toBeInTheDocument()
    expect(screen.queryByText('999+')).not.toBeInTheDocument()
  })

  it('should handle edge case of exactly 1000 calories', () => {
    render(<RecordIndicator hasRecords={true} totalCalories={1000} />)
    
    expect(screen.getByText('999+')).toBeInTheDocument()
    expect(screen.queryByText('1000')).not.toBeInTheDocument()
  })
})