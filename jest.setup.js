// Jest setup file
// Add any global test setup here
require('@testing-library/jest-dom')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Supabase client for tests
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
    },
  },
}))

// Mock AuthService
jest.mock('./lib/auth', () => ({
  AuthService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    getSession: jest.fn().mockResolvedValue(null),
    signUp: jest.fn().mockResolvedValue({ success: true }),
    signIn: jest.fn().mockResolvedValue({ success: true }),
    signOut: jest.fn().mockResolvedValue({ success: true }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
  },
}))

// Mock window.alert (only in browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'alert', {
    writable: true,
    value: jest.fn(),
  })
}

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id'
process.env.CLOUDFLARE_IMAGES_TOKEN = 'test-images-token'