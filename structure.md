# Project Structure

## Root Directory Layout
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

## Key Directories

### `/app` - Next.js App Router
- Contains page components, layouts, and API routes
- Follows Next.js 13+ App Router conventions
- Each folder represents a route segment

### `/lib` - Core Business Logic
- **Service Classes**: Database operations (`database.ts`)
- **Utilities**: Helper functions (`data-utils.ts`, `date-utils.ts`, `validation.ts`)
- **Configuration**: Environment setup (`config.ts`)
- **Supabase Client**: Database connection setup

### `/types` - Type Definitions
- **`database.ts`**: Supabase schema types and API interfaces
- Comprehensive TypeScript definitions for all data structures
- Form validation and API response types

### `/database` - Schema & Migrations
- SQL schema definitions
- Row Level Security (RLS) policies
- Database setup documentation

## File Naming Conventions

### Components & Pages
- Use kebab-case for file names: `food-record-form.tsx`
- React components use PascalCase: `FoodRecordForm`

### Utilities & Services
- Use kebab-case: `data-utils.ts`, `date-utils.ts`
- Service classes use PascalCase: `FoodRecordService`

### Tests
- Co-located with source files in `__tests__/` directories
- Pattern: `*.test.ts` or `*.test.tsx`
- Test files mirror source structure

## Import Patterns

### Path Aliases
- `@/*` maps to project root for clean imports
- Example: `import { FoodRecordService } from '@/lib/database'`

### Service Layer
- Database operations centralized in service classes
- Consistent error handling with localized messages
- Type-safe database interactions

## Configuration Files

### Environment Variables
- `.env.local` for local development
- `.dev.vars` for Cloudflare Workers development
- Centralized validation in `lib/config.ts`

### Build & Deploy
- `next.config.ts`: Next.js configuration with Cloudflare integration
- `wrangler.jsonc`: Cloudflare Workers deployment settings
- `jest.config.js`: Testing configuration

## Code Organization Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
2. **Type Safety**: Comprehensive TypeScript coverage throughout
3. **Service Pattern**: Database operations encapsulated in service classes
4. **Co-located Tests**: Test files alongside source code for maintainability
5. **Consistent Naming**: Predictable file and function naming conventions