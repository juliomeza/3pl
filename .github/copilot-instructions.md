# Copilot Instructions for Reliable 3PL

## Architecture Overview

**Next.js 15 + Firebase + PostgreSQL** logistics management platform with AI-powered insights and role-based access control.

**Technology Stack**:
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: PostgreSQL (connection pooling via pg), Firebase Auth/Firestore
- **AI Integration**: OpenAI GPT-4o for text-to-SQL and conversational AI
- **Data Visualization**: Recharts v2.15.1
- **Icons**: Lucide React exclusively
- **Testing**: Jest with TypeScript support

## Development Environment

```bash
# Development server (port 9002)
npm run dev

# Type checking (TS errors ignored in build)
npm run typecheck

# Testing
npm run test:chat         # AI assistant tests
npm run test:watch        # Watch mode
```

**Environment Variables**:
```bash
POSTGRES_URL=postgresql://...
OPENAI_API_KEY=your_openai_api_key
```

## Code Standards

**Language Requirements**:
- All code, variables, functions, and comments in English
- User-facing text can be localized later
- Code output always in English regardless of conversation language

## Project Structure

### App Router Architecture
```
src/app/
├── (auth)/login/          # Authentication pages
├── client/                # Client dashboard and features
├── employee/             # Employee tools and management
├── pending-access/       # Role-based access pending approval
└── actions.ts            # Server actions for AI integration
```

### Component Organization
```
src/components/
├── ai/                   # AI assistant components
├── ui/                   # shadcn/ui components
├── dashboard/            # Dashboard-specific components
├── landing/              # Landing page components
└── with-auth.tsx         # Authentication HOC
```

### Core Libraries
```
src/lib/
├── ai/                   # OpenAI integration
├── firebase/             # Firebase configuration
├── date-utils.ts         # Date handling utilities
├── db.ts                 # PostgreSQL connection
└── utils.ts              # General utilities
```

## AI Architecture (OpenAI GPT-4o)

### Implementation Strategy
- **Direct OpenAI API** for superior text-to-SQL performance
- **Smart SQL Generation** with ILIKE patterns for partial matching
- **Role-Based Security** with automatic client data filtering
- **Conversational Intelligence** distinguishing data queries from casual conversation
- **Performance Optimization** with schema caching (30min TTL) and reduced tokens

### Key Files
- `src/lib/ai/openai-client.ts` - OpenAI client configuration
- `src/lib/ai/logistics-assistant.ts` - Main AI logic and text-to-SQL conversion
- `src/components/ai/shared-ai-assistant.tsx` - Shared UI component
- `src/hooks/use-client-info.ts` - Client information retrieval
- `src/app/actions.ts` - Server actions bridging UI to AI functions

### AI Features
- **Schema Caching**: Database schema cached for 30 minutes
- **Smart Response Classification**: Automatic data vs conversational query detection
- **Context Management**: 4-message conversation history for natural follow-ups
- **Date Context Awareness**: Current date integration for temporal queries
- **Security Filtering**: Client queries automatically filtered by `owner_id`

## Authentication & Authorization

### Firebase Integration
- **Authentication**: Google/Microsoft OAuth via Firebase Auth
- **User Management**: Firestore for user profiles and role assignment
- **Role-Based Routing**: `client`, `employee`, `none` (pending approval)

### Security Patterns
- **Employee Access**: Full operational data and management capabilities
- **Client Access**: Limited to client-specific data with `owner_id` filtering
- **Protected Routes**: `src/components/with-auth.tsx` HOC wrapper
- **Global Auth State**: `src/context/auth-context.tsx` context provider

## Database Integration

### PostgreSQL Architecture
- **Connection**: Pool-based connection via `src/lib/db.ts`
- **Schema Design**: Tables prefixed by purpose
  - `logistics_*` - AI queries and analytics
  - `operations_*` - Dashboard real-time data
- **Data Hierarchy**: Customer (`owner_id`) → Project (`project_id`) → Orders

### Critical Data Structures
**logistics_orders Table**:
- `owner_id`: Customer/client identifier
- `project_name`: Project subdivision within customer
- `project_id`: Project subdivision identifier
- Supports multi-project clients with proper filtering

**operations_active_orders Table** (23 columns):
- Real-time dashboard data with delivery status filtering
- Client-centric display showing `recipient_name` as "Customer"
- Sorting: `ORDER BY order_created_date DESC, order_fulfillment_date DESC, estimated_delivery_date DESC`

### Data Access Patterns
- **Employee Queries**: Access all `logistics_*` tables
- **Client Queries**: Filtered by `owner_id` and optionally `project_id`
- **Security**: All client AI queries include automatic `WHERE owner_id = [user_owner_id]`

## Data Visualization (Recharts v2.15.1)

### Core Implementation
- **Component**: `src/components/ui/data-visualizer.tsx`
- **Chart Types**: Table, Bar, Pie, Line with smart auto-recommendations
- **Integration**: Embedded in AI chat interfaces with real-time data
- **Responsive Design**: `height="100%"` adapts to available space

### Visualization Features
- **Smart Recommendations**: Automatic chart type suggestions based on data structure
- **Always-Visible Controls**: Chart buttons visible from initialization
- **Unified Colors**: Consistent palette using primary brand colors (#0A183C theme)
- **Column Formatting**: Automatic snake_case to readable format transformation
- **Error Handling**: Graceful null/empty data handling with informative messages

### Chart Specifications
- **Table**: Default view, sortable columns, handles any data type
- **Bar Chart**: Categorical data, up to 20 items with angle rotation
- **Pie Chart**: Simple datasets (≤10 categories), auto-limits for clarity
- **Line Chart**: Time-series data, auto-detects date/time columns

## UI/UX Design System

### Visual Design
- **Colors**: Primary `#0A183C` (dark blue), Background `#FAFBFD`, Accent `#F3F4F6`
- **Typography**: Headlines `Space Grotesk`, body text `Inter`
- **Icons**: Exclusively `lucide-react` for consistency
- **Components**: shadcn/ui with Radix UI primitives + Tailwind CSS

### Component Patterns
- **Server Components**: Default approach, use `'use client'` only when necessary
- **shadcn/ui**: Located in `src/components/ui/`, follow established patterns
- **Server Actions**: Centralized in `src/app/actions.ts` for AI integration

## Critical UI Implementations (DO NOT REGRESS)

### ChatGPT-Style Chat Interface (FINALIZED)
**IMPORTANT**: This UI was refined over multiple sessions and must be preserved exactly.

#### Message Layout & Design
- **No Icons/Headers**: Clean ChatGPT-like appearance without visual clutter
- **User Messages**: `max-w-[80%]` width, `bg-gray-100` background, `rounded-lg`
- **Assistant Messages**: `w-full` width, no background, spans entire chat area
- **Text Styling**: `text-sm leading-relaxed` for optimal readability
- **SQL Display**: `text-[10px] text-gray-600 font-mono` in bordered container

#### Layout Architecture
- **Side-by-Side**: Data visualization (left) + Chat (right) with resizable handle
- **Fixed Height**: `calc(100vh - 144px)` prevents external page scrolling
- **Internal Scrolling**: Custom `.custom-scrollbar` class with smooth auto-scroll
- **Responsive**: Single chat panel on mobile, side-by-side on desktop (lg+)

#### Critical Implementation Details
```tsx
// Input field styling (no focus borders)
className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-300 focus-visible:outline-none"

// SQL query container
className="text-[10px] text-gray-600 font-mono bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3"

// Message width logic
className={message.role === 'user' ? 'max-w-[80%]' : 'w-full'}
```

### Sidebar Implementation (FINALIZED - August 2025)
**CRITICAL**: Sidebar movement issues were solved and must be preserved exactly.

#### Client Sidebar (`src/app/client/layout.tsx`)
- **Dynamic Logo**: Client logo + name when expanded, logo only when collapsed
- **Multi-line Support**: Full client names without truncation
- **Custom Collapse**: Positioned at `-right-4` with `PanelLeftClose` icon
- **Hover Expand**: Logo click/hover shows arrow and triggers expansion

#### Employee Sidebar (`src/app/employee/layout.tsx`)
- **Company Branding**: "Reliable 3PL" logo + name when expanded
- **Custom Collapse**: Positioned at `-right-12` with `PanelLeftClose` icon
- **Consistent Behavior**: Same interaction patterns as client sidebar

#### Fixed Layout Pattern (CRITICAL)
```tsx
<div className="flex-1 flex flex-col h-screen">
  <header className="flex-shrink-0 flex items-center justify-between p-4 md:justify-end bg-background">
    {/* Header content - no border-b for clean appearance */}
  </header>
  <main className={pathname === '/client/assistant' ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto custom-scrollbar'}>
    <div className={pathname === '/client/assistant' ? 'h-full p-4 md:p-8' : 'p-4 md:p-8'}>
      {children}
    </div>
  </main>
</div>
```

#### Key Features
- **Fixed Elements**: Sidebar never moves during content scroll
- **Path-Based Overflow**: Different behavior for AI Assistant vs Dashboard pages
- **Custom Scrollbar**: Consistent styling with `.custom-scrollbar` class
- **Professional UX**: Modern desktop application behavior

### Data Visualization Responsiveness
- **Full Height Charts**: All charts use `height="100%"` instead of fixed heights
- **Container Structure**: `h-full flex flex-col` with `flex-1 min-h-0` for chart area
- **Adaptive Scaling**: ResponsiveContainer ensures charts scale with available space
- **Error States**: All error messages use `h-full` instead of `h-64`

## Date Context and Temporal Queries

### Current Date Integration
- **AI Assistant**: Integrated current date context for accurate temporal queries
- **Date Context Function**: `getCurrentDateContext()` provides current year, month, day
- **Smart Processing**: AI interprets "this year", "this month", "last 30 days", "today"
- **SQL Examples**:
  - "orders this year" → `WHERE "year" = 2025`
  - "orders this month" → `WHERE EXTRACT(YEAR FROM date) = 2025 AND EXTRACT(MONTH FROM date) = 8`
  - "orders last 30 days" → `WHERE DATE(date) >= '2025-07-03' AND DATE(date) <= '2025-08-02'`

### Date Utilities (`src/lib/date-utils.ts`)
- **getCurrentDateContext()**: Current date information
- **getDateRange(period)**: Start/end dates for periods (last30days, thisMonth, thisYear)
- **getSqlDateFilter(column, period)**: PostgreSQL date filter clauses
- **formatDisplayDate()**: UI date formatting

## Testing Strategy

### AI Chat Assistant Testing (Real Integration)
- **No Mocks Policy**: Direct OpenAI API and PostgreSQL testing
- **Jest Configuration**: TypeScript support with ts-jest preset
- **33 Test Cases**: Comprehensive coverage of all chat scenarios
- **Performance Validation**: < 15-20 seconds response time

### Test Structure
```
__tests__/ai/
├── chat-test-cases.ts     # All test definitions (33 scenarios)
├── chat-assistant.test.ts # Jest automated runner
└── manual-testing.ts      # Manual debugging utilities
```

### Testing Commands
```bash
npm run test:chat                    # Full AI test suite
npm run test:watch                   # Watch mode
npm run test:chat -- --testNamePattern="date-"  # Date tests
```

### Test Categories
- **Conversational Detection**: Greetings vs data queries
- **SQL Generation**: ILIKE patterns, exact matching, intelligent queries
- **Context Handling**: Conversation memory and follow-ups
- **Date Context**: Temporal query interpretation
- **Performance**: Response time validation

## Development Guidelines

### Critical Notes
- **TypeScript errors ignored in builds** (`ignoreBuildErrors: true`)
- **Development server runs on port 9002** (not 3000)
- **Firebase Studio compatibility** - Reliable3PL project
- **AI Performance**: Schema caching, reduced tokens, efficient conversation handling
- **Code Language**: All code must be in English
- **Testing Required**: All AI features need real integration tests

### Environment Setup
```bash
# Required environment variables
POSTGRES_URL=postgresql://...
OPENAI_API_KEY=your_openai_api_key

# Firebase config hardcoded in src/lib/firebase/config.ts 
# Note: Firebase project ID remains "synapse3pl" for compatibility, 
# but all UI/branding uses "Reliable 3PL"
```

### Integration Points
- **Firebase Auth** → Firestore profiles → Role-based routing
- **PostgreSQL** → AI flows → Natural language insights  
- **OpenAI API** → Server actions → Client components
- **shadcn/ui** → Custom styling → Consistent design

## Pending Implementations

### Client Dashboard Real Data Integration
- **Status Cards**: Replace mock data with real database queries using `useDashboardMetrics()` hook
  - Active Shipments count from operations_active_orders
  - Pending Orders with status filtering
  - This Month's Volume with date aggregation
  - Average Delivery Time calculation
- **Charts**: Connect 4 dashboard charts to real data using `useShipmentTrends()` and `useDeliveryPerformance()` hooks
  - Shipment Trends with configurable periods
  - Delivery Performance analytics
  - Cost Analysis (pending)
  - Top Destinations (pending)

### Data Visualization Enhancements
- **Scatter Plot**: Add scatter plot for correlation analysis between numeric variables
  - New `ViewType` option: `'scatter'`
  - Smart detection for exactly 2 numeric columns
  - Recharts ScatterChart integration
  - Automatic recommendations for 2 numeric + 0-1 label columns
