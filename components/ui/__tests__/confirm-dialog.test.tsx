import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmDialog } from '../confirm-dialog'

// Mock Button component
jest.mock('../button', () => {
  return {
    Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${variant} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
})

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}))

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: '确认操作',
    message: '您确定要执行此操作吗？'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('确认操作')).toBeInTheDocument()
    expect(screen.getByText('您确定要执行此操作吗？')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('确认操作')).not.toBeInTheDocument()
  })

  it('renders default buttons', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('确认')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('renders custom button texts', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="删除"
        cancelText="保留"
      />
    )

    expect(screen.getByText('删除')).toBeInTheDocument()
    expect(screen.getByText('保留')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when dialog content clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const dialogContent = screen.getByText('确认操作')
    fireEvent.click(dialogContent)

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key pressed', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />)

    expect(screen.getByText('处理中...')).toBeInTheDocument()
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />)

    const confirmButton = screen.getByText('处理中...')
    const cancelButton = screen.getByText('取消')

    expect(confirmButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('prevents closing when loading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />)

    // Try backdrop click
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).not.toHaveBeenCalled()

    // Try Escape key
    fireEvent.keyDown(backdrop, { key: 'Escape' })
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  describe('variant styles', () => {
    it('renders danger variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />)

      const icon = screen.getByText('⚠️')
      expect(icon).toBeInTheDocument()

      const confirmButton = screen.getByText('确认')
      expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white')
    })

    it('renders warning variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />)

      const icon = screen.getByText('⚠️')
      expect(icon).toBeInTheDocument()

      const confirmButton = screen.getByText('确认')
      expect(confirmButton).toHaveClass('bg-yellow-600', 'hover:bg-yellow-700', 'text-white')
    })

    it('renders info variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />)

      const icon = screen.getByText('ℹ️')
      expect(icon).toBeInTheDocument()

      const confirmButton = screen.getByText('确认')
      expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white')
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} className="custom-class" />
    )

    const dialog = container.querySelector('.custom-class')
    expect(dialog).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'dialog-message')

    const title = screen.getByText('确认操作')
    expect(title).toHaveAttribute('id', 'dialog-title')

    const message = screen.getByText('您确定要执行此操作吗？')
    expect(message).toHaveAttribute('id', 'dialog-message')
  })

  it('handles multiple rapid clicks correctly', async () => {
    render(<ConfirmDialog {...defaultProps} />)

    const confirmButton = screen.getByText('确认')
    
    // Click multiple times rapidly
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    // Should only be called once per click
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(3)
  })

  it('prevents interaction during loading state', () => {
    const onClose = jest.fn()
    const onConfirm = jest.fn()

    render(
      <ConfirmDialog
        {...defaultProps}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={true}
      />
    )

    // Try to interact with buttons
    const confirmButton = screen.getByText('处理中...')
    const cancelButton = screen.getByText('取消')

    fireEvent.click(confirmButton)
    fireEvent.click(cancelButton)

    // Should not call handlers when disabled
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})