# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (runs on port 9002, not 3000)
npm run dev

# Build and production
npm run build
npm start

# Code quality
npm run lint
npm run typecheck

# Testing
npm test
npm run test:watch
npm run test:chat         # AI assistant specific tests
npm run test:chat:verbose # Detailed AI testing output
```

## Architecture Overview

**Tech Stack**: Next.js 15 (App Router) + PostgreSQL + Firebase Auth + OpenAI GPT-4o for AI logistics assistant

**Key Dependencies**:
- Frontend: React 18, Tailwind CSS, shadcn/ui components
- Backend: PostgreSQL with pg connection pooling, Firebase Admin SDK
- AI: Direct OpenAI API integration for text-to-SQL conversion
- Data Visualization: Recharts v2.15.1
- Icons: Lucide React exclusively

## Project Structure

```
src/app/
├── (auth)/login/          # Authentication pages
├── client/                # Client role dashboard and features
├── employee/             # Employee role tools and management
├── pending-access/       # Users awaiting role assignment
└── actions.ts            # Server actions for AI integration

src/components/
├── ai/                   # AI assistant components
├── ui/                   # shadcn/ui components
├── dashboard/            # Shared dashboard components and role-specific features
├── landing/              # Marketing/landing page
└── with-auth.tsx         # Authentication HOC

src/lib/
├── ai/                   # OpenAI client and logistics assistant logic
├── firebase/             # Firebase configuration
├── db.ts                 # PostgreSQL connection pool
└── date-utils.ts         # Date handling utilities
```

## Database Integration

**PostgreSQL Connection**: Uses connection pooling via `src/lib/db.ts`. Requires `POSTGRES_URL` environment variable.

**Table Patterns**:
- `logistics_*` tables: AI query data and analytics
- `operations_*` tables: Real-time dashboard data
- `wms_*` tables: Warehouse management system data
- `portal_*` tables: Order management data

**Security Model**: All client queries automatically filtered by `owner_id` for data isolation. Employee queries have full access.

**Owner ID Filtering Pattern**: 
- Client hooks (like `useProjectsForOrders`, `useActiveOrders`) use explicit `ownerId` parameter for consistency
- Server actions receive `owner_id` parameter and apply `WHERE ownerid = $1` or `WHERE owner_id = $1` filtering
- AI assistant queries automatically include owner filtering for client role

## AI Assistant Architecture

**OpenAI Integration**: Direct API calls (not Firebase Genkit) using GPT-4o for superior text-to-SQL performance.

**Key Features**:
- Smart SQL generation with ILIKE patterns for partial matching
- Role-based access (employee vs client with owner filtering)
- Schema caching (30min TTL) for performance
- Conversation history context (4 messages)
- Current date integration for temporal queries

**Core Files**:
- `src/lib/ai/openai-client.ts`: OpenAI client configuration
- `src/lib/ai/logistics-assistant.ts`: Main AI logic and text-to-SQL
- `src/app/actions.ts`: Server actions bridging UI to AI functions

## Authentication & Authorization

**Firebase Auth**: Google/Microsoft OAuth with Firestore for user profiles and role assignment.

**Authentication Flow**:
1. User authenticates via Firebase Auth (Google/Microsoft OAuth)
2. User document created/retrieved from `users` collection with `clientId` field
3. For client role: Client document retrieved from `clients` collection containing `owner_id`
4. `owner_id` is used for all database filtering and access control

**Role System**:
- `employee`: Full access to all operational data and management
- `client`: Limited to owner-specific data with automatic `owner_id` filtering
- `none`: Pending approval state

**Critical Data Flow**:
```
Firebase Auth → users/{uid}.clientId → clients/{clientId}.owner_id → Database filtering
```

**Key Files**:
- `src/context/auth-context.tsx`: Global auth state with clientInfo containing owner_id
- `src/hooks/use-client-info.ts`: Retrieves owner_id from Firebase chain
- `src/components/with-auth.tsx`: HOC wrapper for role-based access control

**Security Pattern**: All client database queries MUST include `WHERE owner_id = [user_owner_id]` or equivalent filtering.

## Data Visualization

**Component**: `src/components/ui/data-visualizer.tsx` with Recharts integration.

**Chart Types**: Table (default), Bar, Pie, Line with smart auto-recommendations based on data structure.

**Integration**: Embedded in AI chat interfaces with header-based controls for visualization type selection.

## UI/UX Design System

**Colors**: Primary `#0A183C` (dark blue), Background `#FAFBFD`, Accent `#F3F4F6`
**Typography**: Headlines use 'Space Grotesk', body text uses 'Inter'
**Icons**: Exclusively `lucide-react` for consistency
**Components**: shadcn/ui with Radix UI primitives + Tailwind CSS

## Testing Strategy

**AI Testing**: Real integration tests using actual OpenAI API and PostgreSQL (no mocks). Tests validate response time < 15-20 seconds.

**Test Files**:
- `__tests__/ai/chat-test-cases.ts`: 33 comprehensive test scenarios
- `__tests__/ai/chat-assistant.test.ts`: Jest test runner
- `__tests__/ai/manual-testing.ts`: Manual debugging utilities

## Environment Variables

```bash
POSTGRES_URL=postgresql://...    # Required for database connection
OPENAI_API_KEY=your_api_key     # Required for AI assistant
```

## Configuration Notes

- TypeScript and ESLint errors are ignored in builds (`ignoreBuildErrors: true`)
- Development server uses port 9002 instead of default 3000
- Firebase project ID: "synapse3pl" (hardcoded for compatibility)
- SSL configuration for PostgreSQL: `rejectUnauthorized: false`

## Shared Component Architecture (REFACTORED - August 2025)

**Component Sharing Strategy**: Client and employee interfaces share UI/UX patterns through shared components for consistency and maintainability.

### Shared Layout System
- **DashboardLayout** (`src/components/dashboard/dashboard-layout.tsx`): Unified layout for both client and employee interfaces
  - Role-based logo rendering (client uses dynamic logo, employee uses company branding)
  - Configurable menu items per role
  - Shared sidebar, header, and responsive behavior
  - Header controls context for dynamic content injection

### Shared Page Components
- **SharedDashboardPage** (`src/components/dashboard/shared-dashboard-page.tsx`): Role-based dashboard with consistent UI
  - Client: Uses `owner_id` filtering for client-specific data
  - Employee: Full access to all operational data (no filtering)
  - Shared metrics cards, charts, and active orders sections
  - Role-appropriate welcome messages and scaled numbers

- **SharedReportsPage** (`src/components/dashboard/shared-reports-page.tsx`): Unified reports interface
  - Client: 20+ client-specific reports with owner filtering
  - Employee: 5-50 reports with configurable access levels
  - Shared header controls, export functionality, and MaterialsTable integration
  - Optimized layout: Compact action bar (py-2), transparent backgrounds for seamless integration
  - Layout optimization: Uses -m-4 md:-m-8 to neutralize main container padding for edge-to-edge design

- **SharedAssistantPage** (`src/components/dashboard/shared-assistant-page.tsx`): Unified AI assistant interface
  - Client: Loading/error states with owner validation and filtered queries
  - Employee: Direct access without additional validation
  - Shared AI chat interface with role-appropriate data access
  - Consistent error handling and loading states

### Benefits Achieved
- **Consistency**: 100% identical UI/UX between client and employee roles
- **Maintainability**: Single source of truth for layout and page logic (~900 lines of code eliminated)
- **Scalability**: Easy to add new features that automatically work for both roles
- **Type Safety**: Full TypeScript coverage with role-based prop interfaces

### Implementation Pattern
```typescript
// Page-level usage
export default function ClientDashboardPage() {
  return <SharedDashboardPage role="client" />;
}

export default function EmployeeDashboardPage() {
  return <SharedDashboardPage role="employee" />;
}

// Shared component structure
interface SharedComponentProps {
  role: 'client' | 'employee';
}

export default function SharedComponent({ role }: SharedComponentProps) {
  // Role-based data fetching
  const ownerId = role === 'client' ? (clientInfo?.owner_id || null) : null;
  
  // Shared UI with role-specific behavior
  return (/* consistent interface with role adaptations */);
}
```

## Hook Architecture & Data Fetching Patterns

**Factory Pattern Implementation (August 2025)**: Centralized data fetching logic to eliminate code duplication and ensure consistency across hooks.

### Core Data Fetching Hook
- **File**: `src/hooks/use-data-fetcher.ts`
- **Purpose**: Generic factory hook providing consistent loading, error, and refetch patterns
- **Features**: Configurable initial data, error messages, dependency arrays, and refetch loading states

### Standardized Hook Pattern
All data fetching hooks follow this consistent interface:
```typescript
export function useHookName(ownerId: number | null, ...params) {
  const { data, loading, error, refetch } = useDataFetcher(
    serverActionFunction,
    {
      ownerId,
      initialData: [] as DataType[],
      dependencies: [param1, param2], // optional
      errorMessage: 'Failed to load data',
      enableRefetchLoading: true // optional
    },
    ...params
  );

  return { data, loading, error, refetch };
}
```

### Refactored Hooks Using Factory Pattern
- `useActiveOrders(ownerId)` - Active orders with owner filtering
- `useDashboardMetrics(ownerId)` - Dashboard KPI metrics  
- `useProjectsForOrders(ownerId)` - Projects for order creation
- `useShipmentTrends(ownerId, period)` - Chart data with period filtering
- `useDeliveryPerformance(ownerId)` - Performance metrics for charts
- `useTopDestinations(ownerId, period)` - Destination analytics

### Benefits Achieved
- **Code Reduction**: ~350+ lines of duplicate code eliminated
- **Consistency**: Unified error handling, loading states, and refetch logic
- **Maintainability**: Single source of truth for data fetching patterns
- **Testability**: Explicit parameters instead of internal auth dependencies

## Table Design Standards (MaterialsTable - August 2025)

**Modern Borderless Design**: Clean, zebra-striped tables without traditional borders for improved visual hierarchy.

### Key Design Principles
- **No Borders**: Eliminate all table borders (outer, inner, header separator) for clean aesthetic
- **Zebra Striping**: Alternating row colors (white/transparent) starting with header for visual separation
- **Transparent Integration**: Tables blend seamlessly with page backgrounds using `bg-transparent`
- **Minimalist Search**: Search boxes with `border-0` and clean "Search" placeholder (no "Filter...")

### MaterialsTable Specifications
- **Header Row**: `bg-white` (first stripe)
- **Data Rows**: Alternating `bg-transparent` (even) and `bg-white` (odd) pattern
- **Search Inputs**: Borderless with `border-0 focus:border-0 focus:ring-0`
- **Watermark**: Sample data uses `text-blue-200 text-8xl opacity-40` at `rotate-[22.5deg]` positioned at `left-1/3`
- **Container**: No outer border, fully transparent background integration

### Implementation Pattern
```typescript
// Table container - no borders, transparent
<div className="rounded-md bg-transparent">
  <Table className="[&_thead]:border-b-0 [&_thead_tr]:border-b-0 bg-transparent">
    // Header with first stripe color
    <TableRow className="border-b-0 hover:bg-white bg-white">
    // Data rows with alternating pattern
    <TableRow className={`border-b-0 ${index % 2 === 0 ? 'bg-transparent' : 'bg-white'}`}>
    // Search inputs without borders
    <Input className="border-0 focus:border-0 focus:ring-0 bg-transparent" />
```

## Code Standards

**CRITICAL: All code, variables, functions, and comments must be in English**
- Code output always in English regardless of conversation language  
- User-facing text can be localized later
- Use Server Components by default, add `'use client'` only when necessary
- Follow established shadcn/ui patterns in `src/components/ui/`
- Server actions centralized in `src/app/actions.ts` for AI integration
- Custom hooks pattern: `use-*-for-orders.ts` for database integration
- **Shared Components**: Prefer shared components over duplicate implementations for client/employee interfaces
- **Data Fetching Pattern**: Use `useDataFetcher()` factory hook for consistent loading/error/refetch logic
- **Table Design**: Follow borderless zebra-stripe pattern with transparent integration