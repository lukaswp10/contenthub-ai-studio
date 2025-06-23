import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    },
  },
}))

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock File API
global.File = class MockFile {
  name: string
  size: number
  type: string

  constructor(bits: any[], name: string, options?: any) {
    this.name = name
    this.size = options?.size || 1024
    this.type = options?.type || 'video/mp4'
  }
} as any

// Mock FileReader
global.FileReader = class MockFileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload.call(this, { target: { result: 'data:video/mp4;base64,mock' } } as any)
      }
    }, 0)
  }
} as any 