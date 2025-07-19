# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Overview

**Daily Food Tracker App** - A web application for tracking daily food intake and managing dietary habits. Users can record meals (breakfast, lunch, dinner, snacks) with details including food name, weight, calories, and photos.

**Target Users**: Individuals monitoring daily food consumption for health, fitness, or dietary management.

**Core Philosophy**: Simplicity first, mobile-responsive, data security, performance-focused.

## Technology Stack

### Core Framework
- **Next.js 15.3.5** - React-based full-stack framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Strict typing throughout the codebase
- **Tailwind CSS 4** - Utility-first CSS framework for styling

### Backend & Database
- **Supabase** - PostgreSQL database with built-in authentication
- **Supabase Auth** - User registration, login, and session management
- **Row Level Security (RLS)** - Database-level user data isolation

### Deployment & Infrastructure
- **Cloudflare Workers** - Serverless deployment platform
- **OpenNext Cloudflare** - Next.js adapter for Cloudflare deployment
- **Cloudflare Images** - Image storage and optimization service

### Development Tools
- **Turbopack** - Fast development bundler (Next.js dev mode)
- **Jest** - Unit testing framework with Next.js integration
- **Wrangler** - Cloudflare Workers CLI for deployment
- **ESLint** - Code linting with Next.js configuration

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build production application
npm run start        # Start production server locally
npm run lint         # Run ESLint checks
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run test:e2e     # Run E2E tests with Playwright
```

### Deployment
```bash
npm run deploy       # Build and deploy to Cloudflare
npm run preview      # Build and preview deployment locally
npm run cf-typegen   # Generate Cloudflare environment types
```

### Security Testing
```bash
npm test -- lib/__tests__/security-utils.test.ts    # Security utilities
npm test -- __tests__/security-integration.test.ts  # Security integration
npx tsx scripts/security-scan.ts                    # Security scan
```

### Diagnostic Scripts
```bash
node scripts/test-cloudflare-images.js              # Test Cloudflare Images API
node scripts/diagnose-cloudflare-issue.js           # Diagnose deployment issues
```

## Project Structure

```
food-tracker-app/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes (upload, food-records)
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Main application pages
├── components/            # React components
│   ├── ui/               # Base UI components (optimized-image, mobile-nav)
│   └── food/             # Food-related components
├── lib/                   # Shared utilities and services
│   ├── cloudflare-images.ts # Cloudflare Images utilities
│   └── security-utils.ts  # Enhanced security functions
├── types/                 # TypeScript type definitions
├── database/              # Database schema and migrations
├── scripts/               # Diagnostic and utility scripts
├── e2e/                   # Playwright E2E tests
├── test-results/          # Test output directory
├── public/                # Static assets
├── __tests__/             # Test files (co-located with source)
└── .env.local             # Environment variables
```

### Key Directories

#### `/app` - Next.js App Router
- **Route segments** as folders
- **Layouts** for shared UI
- **API routes** in `/app/api`

#### `/lib` - Core Business Logic
- **Service Classes**: Database operations (`FoodRecordService`, `AuthService`)
- **Utilities**: Helper functions (`data-utils.ts`, `date-utils.ts`, `validation.ts`)
- **Configuration**: Environment setup (`config.ts`)
- **Supabase Client**: Database connection setup

#### `/types` - Type Definitions
- **database.ts**: Supabase schema types and API interfaces
- **Form validation** and API response types

#### `/database` - Schema & Migrations
- **SQL schema** definitions
- **Row Level Security (RLS)** policies
- **Database setup** documentation

## File Naming Conventions

### Components & Pages
- **File names**: kebab-case (`food-record-form.tsx`)
- **Component names**: PascalCase (`FoodRecordForm`)

### Utilities & Services
- **File names**: kebab-case (`data-utils.ts`, `date-utils.ts`)
- **Service classes**: PascalCase (`FoodRecordService`)

### Tests
- **Co-located** with source files in `__tests__/` directories
- **Pattern**: `*.test.ts` or `*.test.tsx`
- **Test files** mirror source structure

## Key Features & Architecture

### Authentication Flow
- **Supabase Auth** for user registration/login
- **JWT tokens** for API authentication
- **Protected routes** with automatic redirects
- **Session management** with token refresh

### Food Record Management
- **CRUD operations** for breakfast, lunch, dinner, snacks
- **Image uploads** via Cloudflare Images with intelligent URL handling
- **Real-time validation** with Chinese error messages
- **Historical view** with calendar interface
- **Historical record editing and deletion support**

### Mobile UI Optimizations (2024-07-19 Update)
- **User avatar navigation** replacing hamburger menu with logout confirmation
- **Responsive bottom navigation** with proper width distribution for 400x755 screens
- **Floating edit/delete buttons** on food record cards for mobile
- **Auto-scroll functionality** when editing records
- **Touch-friendly interface** with larger touch targets
- **Removed "数据统计" card** from homepage for cleaner mobile experience

### Data Security
- **Row-level security** (RLS) in Supabase
- **Rate limiting**: 100 req/15min general, 20 req/15min uploads
- **Input validation** at multiple layers
- **XSS/CSRF protection** with security headers
- **Enhanced CORS configuration** with wildcard domain support

### Performance Optimizations
- **Image optimization** (WebP/AVIF formats) with fallback mechanisms
- **Bundle splitting** with Next.js
- **API caching** (5-min TTL daily data, 10-min calendar)
- **CDN distribution** via Cloudflare
- **Intelligent image URL fixing** for production environment compatibility

## Environment Setup

### Required Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCOUNT_HASH=your_account_hash
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH=your_account_hash
CLOUDFLARE_IMAGES_TOKEN=your_images_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup
1. Run `database/schema.sql` in Supabase SQL editor
2. Execute `database/rls-policies.sql` for security policies
3. Run `npm run cf-typegen` to update Cloudflare types

## Code Organization Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Type Safety**: Comprehensive TypeScript coverage throughout
3. **Service Pattern**: Database operations encapsulated in service classes
4. **Co-located Tests**: Test files alongside source code for maintainability
5. **Consistent Naming**: Predictable file and function naming conventions

## Import Patterns

### Path Aliases
- `@/*` maps to project root for clean imports
- Example: `import { FoodRecordService } from '@/lib/database'`

### Service Layer
- Database operations centralized in service classes
- Consistent error handling with localized messages
- Type-safe database interactions

## Testing Notes

### Testing Tips
- Use `waitFor` with timeout for async tests:
```typescript
await waitFor(() => {
  expect(screen.getByText('提交成功')).toBeInTheDocument();
}, { timeout: 2000 });
```
- Ensure expect conditions are eventually satisfiable to prevent hanging

### Test Account
- **Email**: includeleec@gmail.com
- **Password**: 123456

## Deployment Information

### Live URLs
- **Primary**: https://food-tracker-app.includeleec-b6f.workers.dev
- **Custom Domain**: https://food.tinycard.xyz

### Recent Updates (2024-07-19)
- ✅ **Mobile UI Optimization**: Complete mobile-first redesign
- ✅ **Image Upload Fix**: Resolved Cloudflare Images compatibility issues
- ✅ **Enhanced Navigation**: User avatar with logout confirmation
- ✅ **Performance Improvements**: Intelligent image URL handling and fallbacks
- ✅ **Cross-domain Support**: Enhanced CORS configuration for multiple domains