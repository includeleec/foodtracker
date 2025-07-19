import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Toast, SuccessToast, ErrorToast } from '../toast'

// Mock timers
jest.useFakeTimers()

describe('Toast', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('renders success toast correctly', () => {
    render(<Toast type="success" message="操作成功" />)
    
    expect(screen.getByText('操作成功')).toBeInTheDocument()
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('renders error toast correctly', () => {
    render(<Toast type="error" message="操作失败" />)
    
    expect(screen.getByText('操作失败')).toBeInTheDocument()
    expect(screen.getByText('❌')).toBeInTheDocument()
  })

  it('renders with title and message', () => {
    render(<Toast type="info" title="提示" message="这是一条信息" />)
    
    expect(screen.getByText('提示')).toBeInTheDocument()
    expect(screen.getByText('这是一条信息')).toBeInTheDocument()
    expect(screen.getByText('ℹ️')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<Toast type="success" message="测试消息" onClose={onClose} />)
    
    const closeButton = screen.getByLabelText('关闭')
    fireEvent.click(closeButton)
    
    // 等待动画完成
    jest.advanceTimersByTime(300)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('auto closes after duration', async () => {
    const onClose = jest.fn()
    render(<Toast type="success" message="测试消息" duration={1000} onClose={onClose} />)
    
    // 快进时间
    jest.advanceTimersByTime(1000)
    
    // 等待动画完成
    jest.advanceTimersByTime(300)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('does not auto close when duration is 0', () => {
    const onClose = jest.fn()
    render(<Toast type="success" message="测试消息" duration={0} onClose={onClose} />)
    
    // 快进时间
    jest.advanceTimersByTime(5000)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies correct styling for different types', () => {
    const { rerender } = render(<Toast type="success" message="成功" />)
    let container = screen.getByText('成功').closest('.border')
    expect(container).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')

    rerender(<Toast type="error" message="错误" />)
    container = screen.getByText('错误').closest('.border')
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')

    rerender(<Toast type="warning" message="警告" />)
    container = screen.getByText('警告').closest('.border')
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800')

    rerender(<Toast type="info" message="信息" />)
    container = screen.getByText('信息').closest('.border')
    expect(container).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
  })
})

describe('SuccessToast', () => {
  it('renders success toast', () => {
    render(<SuccessToast message="操作成功" />)
    
    expect(screen.getByText('操作成功')).toBeInTheDocument()
    expect(screen.getByText('✅')).toBeInTheDocument()
  })
})

describe('ErrorToast', () => {
  it('renders error toast', () => {
    render(<ErrorToast message="操作失败" />)
    
    expect(screen.getByText('操作失败')).toBeInTheDocument()
    expect(screen.getByText('❌')).toBeInTheDocument()
  })
})