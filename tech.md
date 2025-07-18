# Technology Stack

## Core Framework
- **Next.js 15.3.5**: React-based full-stack framework with App Router
- **React 19**: UI library with latest features
- **TypeScript 5**: Strict typing throughout the codebase
- **Tailwind CSS 4**: Utility-first CSS framework for styling

## Backend & Database
- **Supabase**: PostgreSQL database with built-in authentication
- **Supabase Auth**: User registration, login, and session management
- **Row Level Security (RLS)**: Database-level user data isolation

## Deployment & Infrastructure
- **Cloudflare Workers**: Serverless deployment platform
- **OpenNext Cloudflare**: Next.js adapter for Cloudflare deployment
- **Cloudflare Images**: Image storage and optimization service

## Testing
- **Jest**: Unit testing framework with Next.js integration
- **ts-jest**: TypeScript support for Jest
- **Node test environment**: Server-side testing setup
- **add timeout when waitFor()**: for example:
```
await waitFor(() => {
  expect(screen.getByText('提交成功')).toBeInTheDocument();
}, { timeout: 2000 });
```
确保 expect(...) 的条件最终是可以满足的，否则 waitFor 永远挂起。

## Development Tools
- **Turbopack**: Fast development bundler (Next.js dev mode)
- **Wrangler**: Cloudflare Workers CLI for deployment
- **ESLint**: Code linting with Next.js configuration

## Common Commands

### Development
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

## Code Organization Principles
- **Service Classes**: Database operations organized in service classes (e.g., `FoodRecordService`, `AuthService`)
- **Type Safety**: Comprehensive TypeScript types for database schema and API responses
- **Environment Configuration**: Centralized config validation and environment variable management
- **Error Handling**: Consistent error messages with Chinese localization