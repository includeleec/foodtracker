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

## Project Structure

```
food-tracker-app/
├── app/                    # Next.js App Router pages and layouts
├── lib/                    # Shared utilities and services
├── types/                  # TypeScript type definitions
├── database/               # Database schema and migrations
├── public/                 # Static assets
├── __tests__/              # Test files (co-located with source)
└── .env.local              # Environment variables
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
- **Image uploads** via Cloudflare Images
- **Real-time validation** with Chinese error messages
- **Historical view** with calendar interface

### Data Security
- **Row-level security** (RLS) in Supabase
- **Rate limiting**: 100 req/15min general, 20 req/15min uploads
- **Input validation** at multiple layers
- **XSS/CSRF protection** with security headers

### Performance Optimizations
- **Image optimization** (WebP/AVIF formats)
- **Bundle splitting** with Next.js
- **API caching** (5-min TTL daily data, 10-min calendar)
- **CDN distribution** via Cloudflare

## Environment Setup

### Required Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_IMAGES_TOKEN=your_images_token
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