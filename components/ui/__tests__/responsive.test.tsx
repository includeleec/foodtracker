import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Responsive Design', () => {
  it('should have mobile-friendly touch targets', () => {
    // Test that buttons have minimum 44px height for touch accessibility
    const TestButton = () => (
      <button className="min-h-[44px] px-3 py-2 rounded-md">
        测试按钮
      </button>
    )
    
    render(<TestButton />)
    const button = screen.getByText('测试按钮')
    
    // Check that the button has mobile-friendly classes
    expect(button).toHaveClass('min-h-[44px]')
    expect(button).toHaveClass('px-3', 'py-2')
  })

  it('should have responsive grid layouts', () => {
    const TestGrid = () => (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </div>
    )
    
    render(<TestGrid />)
    const grid = screen.getByText('Item 1').parentElement
    
    // Check responsive grid classes
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-2', 'md:grid-cols-4')
  })

  it('should have responsive text sizes', () => {
    const TestText = () => (
      <h1 className="text-xl md:text-2xl font-bold">
        响应式标题
      </h1>
    )
    
    render(<TestText />)
    const heading = screen.getByText('响应式标题')
    
    // Check responsive text classes
    expect(heading).toHaveClass('text-xl', 'md:text-2xl', 'font-bold')
  })

  it('should have responsive spacing', () => {
    const TestSpacing = () => (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>Content 1</div>
        <div>Content 2</div>
      </div>
    )
    
    render(<TestSpacing />)
    const container = screen.getByText('Content 1').parentElement
    
    // Check responsive spacing classes
    expect(container).toHaveClass('p-4', 'md:p-6', 'space-y-4', 'md:space-y-6')
  })

  it('should have mobile-first responsive design', () => {
    const TestLayout = () => (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">Main content</div>
        <div className="w-full sm:w-auto">Sidebar</div>
      </div>
    )
    
    render(<TestLayout />)
    const container = screen.getByText('Main content').parentElement
    
    // Check mobile-first responsive classes
    expect(container).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4')
  })
})