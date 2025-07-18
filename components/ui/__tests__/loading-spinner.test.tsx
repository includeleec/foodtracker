import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, PageLoading, ContentLoading, ButtonLoading } from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', '加载中')
  })

  it('renders with custom text', () => {
    const customText = '正在处理...'
    render(<LoadingSpinner text={customText} />)
    
    expect(screen.getByText(customText)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', customText)
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4')

    rerender(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8')

    rerender(<LoadingSpinner size="xl" />)
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12')
  })

  it('applies correct color classes', () => {
    const { rerender } = render(<LoadingSpinner color="blue" />)
    expect(screen.getByRole('status')).toHaveClass('border-blue-600')

    rerender(<LoadingSpinner color="gray" />)
    expect(screen.getByRole('status')).toHaveClass('border-gray-600')

    rerender(<LoadingSpinner color="white" />)
    expect(screen.getByRole('status')).toHaveClass('border-white')
  })
})

describe('PageLoading', () => {
  it('renders page loading component', () => {
    render(<PageLoading />)
    
    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    const customText = '页面加载中...'
    render(<PageLoading text={customText} />)
    
    expect(screen.getByText(customText)).toBeInTheDocument()
  })
})

describe('ContentLoading', () => {
  it('renders content loading component', () => {
    render(<ContentLoading />)
    
    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-loading'
    render(<ContentLoading className={customClass} />)
    
    const container = screen.getByRole('status').parentElement?.parentElement
    expect(container).toHaveClass(customClass)
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'py-8')
  })
})

describe('ButtonLoading', () => {
  it('renders button loading component', () => {
    render(<ButtonLoading />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with text', () => {
    const text = '提交中...'
    render(<ButtonLoading text={text} />)
    
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})