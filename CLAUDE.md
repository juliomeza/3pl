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
├── dashboard/            # Role-specific dashboard components
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
- Client hooks (like `useProjectsForOrders`, `useActiveOrders`) use `clientInfo?.owner_id` from auth context
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

## Code Standards

**CRITICAL: All code, variables, functions, and comments must be in English**
- Code output always in English regardless of conversation language  
- User-facing text can be localized later
- Use Server Components by default, add `'use client'` only when necessary
- Follow established shadcn/ui patterns in `src/components/ui/`
- Server actions centralized in `src/app/actions.ts` for AI integration
- Custom hooks pattern: `use-*-for-orders.ts` for database integration