import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OptimizedImage, FoodImage, FoodImageLarge } from '../optimized-image'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        data-testid="next-image"
        {...props}
      />
    )
  }
})

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
})

describe('OptimizedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render image with basic props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('should show loading state initially', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    // Should show loading spinner
    expect(screen.getByRole('img')).toHaveClass('opacity-0')
  })

  it('should show image after loading', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    
    // Simulate image load
    fireEvent.load(image)

    await waitFor(() => {
      expect(image).toHaveClass('opacity-100')
    })
  })

  it('should show fallback on error', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
        fallback={<div data-testid="fallback">Fallback content</div>}
      />
    )

    const image = screen.getByTestId('next-image')
    
    // Simulate image error
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
    })
  })

  it('should show default fallback when no custom fallback provided', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    
    // Simulate image error
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.getByText('🖼️')).toBeInTheDocument()
    })
  })

  it('should call onLoad callback', async () => {
    const onLoadMock = jest.fn()
    
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
        onLoad={onLoadMock}
      />
    )

    const image = screen.getByTestId('next-image')
    fireEvent.load(image)

    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalledTimes(1)
    })
  })

  it('should call onError callback', async () => {
    const onErrorMock = jest.fn()
    
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
        onError={onErrorMock}
      />
    )

    const image = screen.getByTestId('next-image')
    fireEvent.error(image)

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1)
    })
  })

  it('should setup intersection observer for lazy loading', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={false}
      />
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )
  })

  it('should not setup intersection observer for priority images', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    )

    // Should not call IntersectionObserver for priority images
    expect(mockIntersectionObserver).not.toHaveBeenCalled()
  })

  it('should show lazy loading placeholder', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={false}
      />
    )

    expect(screen.getByText('📷')).toBeInTheDocument()
  })
})

describe('FoodImage', () => {
  it('should render with correct props', () => {
    render(
      <FoodImage
        src="/food-image.jpg"
        alt="Food image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/food-image.jpg')
    expect(image).toHaveAttribute('alt', 'Food image')
  })

  it('should show food fallback on error', async () => {
    render(
      <FoodImage
        src="/food-image.jpg"
        alt="Food image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.getByText('🍽️')).toBeInTheDocument()
    })
  })

  it('should apply custom className', () => {
    render(
      <FoodImage
        src="/food-image.jpg"
        alt="Food image"
        className="custom-class"
        priority={true}
      />
    )

    const container = screen.getByTestId('next-image').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('should show lazy loading placeholder by default', () => {
    render(
      <FoodImage
        src="/food-image.jpg"
        alt="Food image"
      />
    )

    expect(screen.getByText('📷')).toBeInTheDocument()
  })
})

describe('FoodImageLarge', () => {
  it('should render with correct props', () => {
    render(
      <FoodImageLarge
        src="/food-image.jpg"
        alt="Food image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/food-image.jpg')
    expect(image).toHaveAttribute('alt', 'Food image')
  })

  it('should show large image fallback on error', async () => {
    render(
      <FoodImageLarge
        src="/food-image.jpg"
        alt="Food image"
        priority={true}
      />
    )

    const image = screen.getByTestId('next-image')
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.getByText('🖼️')).toBeInTheDocument()
    })
  })

  it('should apply correct styling classes', () => {
    render(
      <FoodImageLarge
        src="/food-image.jpg"
        alt="Food image"
        priority={true}
      />
    )

    const container = screen.getByTestId('next-image').parentElement
    expect(container).toHaveClass('w-full', 'max-h-48', 'object-contain')
  })

  it('should show lazy loading placeholder by default', () => {
    render(
      <FoodImageLarge
        src="/food-image.jpg"
        alt="Food image"
      />
    )

    expect(screen.getByText('📷')).toBeInTheDocument()
  })
})