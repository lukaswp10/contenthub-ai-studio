import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVideoUpload } from '../useVideoUpload'

// Mock the hook dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-video-id' }, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-video-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ 
        data: { 
          success: true, 
          upload_url: 'https://api.cloudinary.com/v1_1/test/upload',
          upload_params: { public_id: 'test-public-id' }
        }, 
        error: null 
      })),
    },
  },
}))

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('useVideoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVideoUpload())

    expect(result.current.file).toBeNull()
    expect(result.current.title).toBe('')
    expect(result.current.description).toBe('')
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(0)
    expect(result.current.uploadError).toBeNull()
  })

  it('should set file correctly', () => {
    const { result } = renderHook(() => useVideoUpload())
    const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.setFile(testFile)
    })

    expect(result.current.file).toBe(testFile)
  })

  it('should set title correctly', () => {
    const { result } = renderHook(() => useVideoUpload())

    act(() => {
      result.current.setTitle('Test Video')
    })

    expect(result.current.title).toBe('Test Video')
  })

  it('should set description correctly', () => {
    const { result } = renderHook(() => useVideoUpload())

    act(() => {
      result.current.setDescription('Test Description')
    })

    expect(result.current.description).toBe('Test Description')
  })

  it('should reset upload state correctly', () => {
    const { result } = renderHook(() => useVideoUpload())
    const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.setFile(testFile)
      result.current.setTitle('Test Video')
      result.current.setDescription('Test Description')
    })

    act(() => {
      result.current.resetUpload()
    })

    expect(result.current.file).toBeNull()
    expect(result.current.title).toBe('')
    expect(result.current.description).toBe('')
    expect(result.current.uploadProgress).toBe(0)
    expect(result.current.uploadError).toBeNull()
  })

  it('should validate file type correctly', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

    act(() => {
      result.current.setFile(invalidFile)
      result.current.setTitle('Test Video')
    })

    await act(async () => {
      await result.current.uploadVideo()
    })

    expect(result.current.uploadError).toContain('Formato de arquivo inválido')
  })

  it('should validate file size correctly', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const largeFile = new File(['test'], 'large.mp4', { type: 'video/mp4' })
    // Manually set the size property for testing
    Object.defineProperty(largeFile, 'size', { value: 600 * 1024 * 1024 })

    act(() => {
      result.current.setFile(largeFile)
      result.current.setTitle('Test Video')
    })

    await act(async () => {
      await result.current.uploadVideo()
    })

    expect(result.current.uploadError).toContain('Arquivo muito grande')
  })

  it('should validate required fields', async () => {
    const { result } = renderHook(() => useVideoUpload())

    await act(async () => {
      await result.current.uploadVideo()
    })

    expect(result.current.uploadError).toContain('Arquivo e título são obrigatórios')
  })

  it('should handle successful upload', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.setFile(testFile)
      result.current.setTitle('Test Video')
    })

    await act(async () => {
      const videoId = await result.current.uploadVideo()
      expect(videoId).toBe('test-video-id')
    })

    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(100)
    expect(result.current.uploadError).toBeNull()
  }, 10000) // Increase timeout

  it('should handle upload errors', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })

    // Mock a failed upload by importing and mocking the module
    const { supabase } = await import('@/integrations/supabase/client')
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error('Upload failed'))

    act(() => {
      result.current.setFile(testFile)
      result.current.setTitle('Test Video')
    })

    await act(async () => {
      await result.current.uploadVideo()
    })

    expect(result.current.uploadError).toContain('Upload failed')
    expect(result.current.isUploading).toBe(false)
  })

  it('should handle authentication errors', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })

    // Mock no authenticated user
    const { supabase } = await import('@/integrations/supabase/client')
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ 
      data: { user: null }
    })

    act(() => {
      result.current.setFile(testFile)
      result.current.setTitle('Test Video')
    })

    await act(async () => {
      await result.current.uploadVideo()
    })

    expect(result.current.uploadError).toContain('Usuário não autenticado')
  })
}) 