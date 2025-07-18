import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

// 创建一个会抛出错误的组件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// 自定义错误回退组件
const CustomErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div>
    <h1>Custom Error</h1>
    <p>{error.message}</p>
    <button onClick={resetError}>Custom Reset</button>
  </div>
)

describe('ErrorBoundary', () => {
  // 抑制控制台错误输出
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('应该正常渲染子组件当没有错误时', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('应该显示默认错误界面当子组件抛出错误时', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('出现了错误')).toBeInTheDocument()
    expect(screen.getByText('很抱歉，应用遇到了意外错误。请尝试刷新页面或联系技术支持。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
  })

  it('应该显示自定义错误界面当提供了fallback组件时', () => {
    render(
      <ErrorBoundary fallback={CustomErrorFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom Reset' })).toBeInTheDocument()
  })

  it('应该能够重置错误状态', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // 确认错误界面显示
    expect(screen.getByText('出现了错误')).toBeInTheDocument()

    // 点击重试按钮
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    // 重新渲染不抛出错误的组件
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('应该显示错误详情在开发模式下', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // 点击查看错误详情
    const detailsButton = screen.getByText('查看错误详情')
    fireEvent.click(detailsButton)

    expect(screen.getByText('Test error')).toBeInTheDocument()
  })
})