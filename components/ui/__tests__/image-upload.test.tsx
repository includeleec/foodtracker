import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUpload } from '../image-upload'
import { useAuth } from '@/lib/auth-context'
import * as imageUtils from '@/lib/image-utils'

// Mock dependencies
jest.mock('@/lib/auth-context')
jest.mock('@/lib/image-utils')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUploadImage = imageUtils.uploadImage as jest.MockedFunction<typeof imageUtils.uploadImage>
const mockDeleteImage = imageUtils.deleteImage as jest.MockedFunction<typeof imageUtils.deleteImage>
const mockValidateImageFile = imageUtils.validateImageFile as jest.MockedFunction<typeof imageUtils.validateImageFile>
const mockCreateImagePreview = imageUtils.createImagePreview as jest.MockedFunction<typeof imageUtils.createImagePreview>
const mockRevokeImagePreview = imageUtils.revokeImagePreview as jest.MockedFunction<typeof imageUtils.revokeImagePreview>

// Mock user
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  access_token: 'mock-access-token'
}

describe('ImageUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false,
      signOut: jest.fn()
    })

    // Default image utils mocks
    mockValidateImageFile.mockImplementation(() => {})
    mockCreateImagePreview.mockReturnValue('blob:mock-preview-url')
    mockRevokeImagePreview.mockImplementation(() => {})
    mockUploadImage.mockResolvedValue({
      id: 'image-123',
      url: 'https://example.com/image.jpg',
      filename: 'test.jpg'
    })
    mockDeleteImage.mockResolvedValue()
  })

  describe('Rendering', () => {
    it('should render upload area when no image is present', () => {
      render(<ImageUpload />)

      expect(screen.getByText('点击或拖拽上传图片')).toBeInTheDocument()
      expect(screen.getByText(/支持.*格式/)).toBeInTheDocument()
    })

    it('should render current image when provided', () => {
      render(
        <ImageUpload 
          currentImageUrl="https://example.com/current.jpg"
          currentImageId="current-123"
        />
      )

      const image = screen.getByAltText('预览')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/current.jpg')
    })

    it('should show delete button for current image', () => {
      render(
        <ImageUpload 
          currentImageUrl="https://example.com/current.jpg"
          currentImageId="current-123"
        />
      )

      const deleteButton = screen.getByTitle('删除图片')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<ImageUpload disabled />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('File Selection', () => {
    it('should handle file input change', async () => {
      const onUploadSuccess = jest.fn()
      render(<ImageUpload onUploadSuccess={onUploadSuccess} />)

      // Create a test file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Find the hidden file input
      const fileInput = screen.getByRole('button', { hidden: true }) as HTMLInputElement
      
      // Mock the files property
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      // Trigger change event
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(file)
        expect(mockCreateImagePreview).toHaveBeenCalledWith(file)
        expect(mockUploadImage).toHaveBeenCalledWith(
          file,
          mockUser.access_token,
          expect.any(Function)
        )
      })

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalledWith({
          id: 'image-123',
          url: 'https://example.com/image.jpg',
          filename: 'test.jpg'
        })
      })
    })

    it('should handle click to select file', () => {
      render(<ImageUpload />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      
      // Mock click on file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation()

      fireEvent.click(uploadArea!)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not allow file selection when disabled', () => {
      render(<ImageUpload disabled />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation()

      fireEvent.click(uploadArea!)

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag over', () => {
      render(<ImageUpload />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      
      fireEvent.dragOver(uploadArea!, {
        dataTransfer: {
          files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
        }
      })

      expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50')
      expect(screen.getByText('释放以上传图片')).toBeInTheDocument()
    })

    it('should handle drag leave', () => {
      render(<ImageUpload />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      
      // First drag over
      fireEvent.dragOver(uploadArea!)
      expect(uploadArea).toHaveClass('border-blue-500')

      // Then drag leave
      fireEvent.dragLeave(uploadArea!)
      expect(uploadArea).not.toHaveClass('border-blue-500')
    })

    it('should handle file drop', async () => {
      const onUploadSuccess = jest.fn()
      render(<ImageUpload onUploadSuccess={onUploadSuccess} />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [file]
        }
      })

      await waitFor(() => {
        expect(mockValidateImageFile).toHaveBeenCalledWith(file)
        expect(mockUploadImage).toHaveBeenCalledWith(
          file,
          mockUser.access_token,
          expect.any(Function)
        )
      })
    })

    it('should reject unsupported file types on drop', () => {
      const onUploadError = jest.fn()
      render(<ImageUpload onUploadError={onUploadError} />)

      const uploadArea = screen.getByText('点击或拖拽上传图片').closest('div')
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [file]
        }
      })

      expect(onUploadError).toHaveBeenCalledWith('请选择支持的图片格式')
    })
  })

  describe('Upload Process', () => {
    it('should show upload progress', async () => {
      let progressCallback: ((progress: number) => void) | undefined

      mockUploadImage.mockImplementation(async (file, token, onProgress) => {
        progressCallback = onProgress
        // Simulate async upload
        return new Promise((resolve) => {
          setTimeout(() => {
            if (progressCallback) {
              progressCallback(50)
              setTimeout(() => {
                if (progressCallback) progressCallback(100)
                resolve({
                  id: 'image-123',
                  url: 'https://example.com/image.jpg',
                  filename: 'test.jpg'
                })
              }, 100)
            }
          }, 100)
        })
      })

      render(<ImageUpload />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText('上传中...')).toBeInTheDocument()
      })

      // Should show progress
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      })

      // Should complete
      await waitFor(() => {
        expect(screen.getByText('上传成功！')).toBeInTheDocument()
      })
    })

    it('should handle upload errors', async () => {
      const onUploadError = jest.fn()
      mockUploadImage.mockRejectedValue(new imageUtils.ImageUploadError('上传失败'))

      render(<ImageUpload onUploadError={onUploadError} />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('上传失败')).toBeInTheDocument()
        expect(onUploadError).toHaveBeenCalledWith('上传失败')
      })
    })

    it('should handle validation errors', async () => {
      const onUploadError = jest.fn()
      mockValidateImageFile.mockImplementation(() => {
        throw new imageUtils.ImageUploadError('文件太大')
      })

      render(<ImageUpload onUploadError={onUploadError} />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('文件太大')).toBeInTheDocument()
        expect(onUploadError).toHaveBeenCalledWith('文件太大')
      })
    })

    it('should require authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn()
      })

      const onUploadError = jest.fn()
      render(<ImageUpload onUploadError={onUploadError} />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('请先登录')).toBeInTheDocument()
        expect(onUploadError).toHaveBeenCalledWith('请先登录')
      })
    })
  })

  describe('Delete Functionality', () => {
    it('should delete current image', async () => {
      const onDeleteSuccess = jest.fn()
      render(
        <ImageUpload 
          currentImageUrl="https://example.com/current.jpg"
          currentImageId="current-123"
          onDeleteSuccess={onDeleteSuccess}
        />
      )

      const deleteButton = screen.getByTitle('删除图片')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteImage).toHaveBeenCalledWith('current-123', mockUser.access_token)
        expect(onDeleteSuccess).toHaveBeenCalled()
      })
    })

    it('should handle delete errors', async () => {
      const onDeleteError = jest.fn()
      mockDeleteImage.mockRejectedValue(new imageUtils.ImageUploadError('删除失败'))

      render(
        <ImageUpload 
          currentImageUrl="https://example.com/current.jpg"
          currentImageId="current-123"
          onDeleteError={onDeleteError}
        />
      )

      const deleteButton = screen.getByTitle('删除图片')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('删除失败')).toBeInTheDocument()
        expect(onDeleteError).toHaveBeenCalledWith('删除失败')
      })
    })

    it('should show deleting state', async () => {
      mockDeleteImage.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 100)
        })
      })

      render(
        <ImageUpload 
          currentImageUrl="https://example.com/current.jpg"
          currentImageId="current-123"
        />
      )

      const deleteButton = screen.getByTitle('删除图片')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('删除中...')).toBeInTheDocument()
      })
    })
  })

  describe('Custom Props', () => {
    it('should accept custom accepted types', () => {
      render(<ImageUpload acceptedTypes={['image/png']} />)

      expect(screen.getByText(/支持 png 格式/)).toBeInTheDocument()
    })

    it('should accept custom max size', () => {
      render(<ImageUpload maxSizeMB={5} />)

      expect(screen.getByText(/最大 5MB/)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ImageUpload className="custom-class" />)

      const container = screen.getByText('点击或拖拽上传图片').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })
})