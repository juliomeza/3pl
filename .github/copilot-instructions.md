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
- **CRITICAL: All code, variables, functions, and comments in English**
- Code output always in English regardless of conversation language
- User-facing text can be localized later

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
├── dashboard/            # Shared dashboard components and role-specific features
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

### Authentication Flow (CRITICAL for Data Security)
1. User authenticates via Firebase Auth (Google/Microsoft OAuth)
2. User document created/retrieved from `users` collection with `clientId` field
3. For client role: Client document retrieved from `clients` collection containing `owner_id`
4. `owner_id` is used for all database filtering and access control

**Critical Data Flow**:
```
Firebase Auth → users/{uid}.clientId → clients/{clientId}.owner_id → Database filtering
```

### Security Patterns
- **Employee Access**: Full operational data and management capabilities
- **Client Access**: Limited to client-specific data with automatic `owner_id` filtering
- **Protected Routes**: `src/components/with-auth.tsx` HOC wrapper
- **Global Auth State**: `src/context/auth-context.tsx` context provider

### Owner ID Filtering Implementation (MANDATORY)
**Key Files**:
- `src/context/auth-context.tsx`: Global auth state with clientInfo containing owner_id
- `src/hooks/use-client-info.ts`: Retrieves owner_id from Firebase chain
- Client hooks (like `useProjectsForOrders`, `useActiveOrders`) use `clientInfo?.owner_id` from auth context

**Security Pattern**: ALL client database queries MUST include `WHERE owner_id = [user_owner_id]` or `WHERE ownerid = $1` filtering.

**Implementation Examples**:
```typescript
// Server action pattern
export async function getProjectsForOrders(ownerId: string) {
  const query = 'SELECT id, name FROM wms_projects WHERE ownerid = $1 ORDER BY name';
  return await db.query(query, [ownerId]);
}

// Hook pattern
const { clientInfo } = useAuth();
const { data } = useActiveOrders(clientInfo?.owner_id || null);

// AI assistant pattern  
const getClientAiInsight = async (query: string, conversationHistory: ChatMessage[]) => {
  return await getAiInsightOpenAIClient(query, ownerId, conversationHistory);
};
```

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
- **Shared Components**: Prefer shared components over duplicate implementations for client/employee interfaces

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

### AI Assistant Header Controls (FINALIZED - August 2025)
**CRITICAL**: New header-based control system for cleaner UI and more chat space.

#### Dynamic Header Integration
- **Visualization Controls**: Table, Bar, Pie, Line buttons moved to header LEFT side
- **New Chat Control**: "New Chat" button moved to header RIGHT side next to avatar
- **Space Optimization**: Eliminated horizontal button bars from chat area
- **Consistent Pattern**: Same implementation for both client and employee AI assistants

#### Implementation Architecture
```tsx
// Header Controls Components (src/components/dashboard/ai-header-controls.tsx)
export function VisualizationControls({ viewType, onViewTypeChange }: VisualizationControlsProps)
export function NewChatControl({ onNewChat }: NewChatControlProps)

// Layout Integration Pattern
const { setLeftContent, setRightContent } = useHeaderControls();

// AI Assistant Integration
<SharedAiAssistant 
  getAiInsight={getAiInsight}
  onLeftContentChange={setLeftContent}
  onRightContentChange={setRightContent}
/>
```

#### Critical Implementation Details
- **Header Context**: Both client and employee layouts provide `HeaderControlsContext`
- **Dynamic Content**: AI assistant pages inject controls into header via context
- **Cleanup Pattern**: Proper cleanup when component unmounts
- **Button Styling**: `size="sm"` with `text-xs` class for compact header appearance
- **Icon Sizing**: `w-3 h-3` for visualization buttons, `w-4 h-4` for New Chat

#### Layout Benefits
- **More Chat Space**: Removed all floating/overlay buttons from chat area
- **Cleaner Interface**: Professional header-based controls without UI clutter
- **Consistent UX**: Same pattern across client and employee AI assistants
- **Better Accessibility**: Controls always visible and accessible in header

#### Files Modified
```
src/components/dashboard/ai-header-controls.tsx    # New header control components
src/components/ai/shared-ai-assistant.tsx          # Updated to use header controls
src/app/client/assistant/page.tsx                  # Client AI integration
src/app/employee/assistant/page.tsx                # Employee AI integration
src/app/employee/layout.tsx                        # Added header context to employee
```

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

## Shared Component Architecture (REFACTORED - August 2025)

### Component Sharing Strategy
**Client and employee interfaces share UI/UX patterns through shared components for consistency and maintainability.**

#### Refactored Components
- **DashboardLayout** (`src/components/dashboard/dashboard-layout.tsx`): Unified layout system
  - Role-based logo rendering (client: dynamic logo, employee: company branding)
  - Configurable menu items and responsive behavior
  - Header controls context for dynamic content injection
  - Eliminates ~200 lines of duplicated layout code

- **SharedDashboardPage** (`src/components/dashboard/shared-dashboard-page.tsx`): Role-based dashboard
  - Client: Uses `owner_id` filtering for client-specific data
  - Employee: Full access to all operational data (no filtering)
  - Shared metrics cards, charts, and active orders sections
  - Role-appropriate scaling (employee shows larger numbers)

- **SharedReportsPage** (`src/components/dashboard/shared-reports-page.tsx`): Unified reports interface
  - Client: 20+ client-specific reports with owner filtering
  - Employee: 5-50 reports with configurable access levels
  - Shared MaterialsTable, header controls, and export functionality
  - Role-based access messaging and security filtering

#### Implementation Pattern
```typescript
// Simplified page implementations
export default function ClientDashboardPage() {
  return <SharedDashboardPage role="client" />;
}

export default function EmployeeDashboardPage() {
  return <SharedDashboardPage role="employee" />;
}

// Shared component with role-based props
interface SharedComponentProps {
  role: 'client' | 'employee';
}

// Role-based data fetching pattern
const ownerId = role === 'client' ? (clientInfo?.owner_id || null) : null;
```

#### Refactoring Benefits
- **~900 lines of code eliminated** from duplicate implementations
- **100% UI/UX consistency** between client and employee interfaces
- **Single source of truth** for layout and page logic
- **Easy feature additions** automatically work for both roles
- **Future-proof architecture** eliminates need for duplicate maintenance

#### Development Guidelines
- **Always prefer shared components** over duplicate client/employee implementations
- **Use role-based props** to handle behavioral differences
- **Implement owner filtering** for client role, full access for employee role
- **Test both roles** when making changes to shared components
- **Follow the established pattern** when creating new shared components

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

### AI Assistant Header Controls (COMPLETED - August 2025)
✅ **Clean Header-Based UI Implementation**
- **Dynamic Header Integration**: Visualization controls (Table, Bar, Pie, Line) moved to header left side
- **New Chat Positioning**: "New Chat" button relocated to header right side next to avatar
- **Space Optimization**: Eliminated all floating buttons and overlays from chat area
- **Consistent Implementation**: Same pattern applied to both client and employee AI assistants
- **Component Architecture**: Reusable `VisualizationControls` and `NewChatControl` components
- **Context Management**: Dynamic header content injection via `HeaderControlsContext`

### Client Reports System (COMPLETED - August 2025)
✅ **Full Reports Interface Implementation**
- **Navigation System**: Dropdown-based report selection with 4 categories and 14 total reports
- **Header Integration**: Dynamic header controls with report selector and action buttons
- **Materials Report**: Complete implementation with real database integration
- **Advanced Table Features**: Column-level filtering, sorting, and search functionality
- **Database Security**: Owner-based data filtering with PostgreSQL integration
- **UI Patterns**: Established reusable patterns for remaining 13 reports

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

## Reports System Architecture (NEW - August 2025)

### Overview
**Comprehensive WMS Reports Interface** with advanced filtering, sorting, and real-time data integration for client users.

**Key Features**:
- **14 WMS Reports** across 4 categories (Inventory, Orders, Warehouse, Financial)
- **Advanced Table Functionality**: Column-level search, filtering, and 3-state sorting
- **Real Database Integration**: PostgreSQL queries with owner-based security filtering
- **Dropdown Navigation**: Space-efficient accordion-style report selection
- **Sample/Real Data Toggle**: Seamless transition between demonstration and live data

### Implementation Structure

#### Core Files
```
src/app/client/reports/
├── page.tsx                           # Main reports interface with state management
src/components/dashboard/
├── reports-header-controls.tsx        # Dropdown navigation component  
├── materials-table.tsx               # Advanced table with filtering/sorting
src/app/client/layout.tsx              # Dynamic header context integration
src/app/actions.ts                     # Server actions for database queries
```

#### Dynamic Header System
**Header Context Pattern**:
```typescript
// useHeaderControls hook for dynamic header content
const { setLeftContent, setRightContent } = useHeaderControls();

// Dynamic header injection in reports page
useEffect(() => {
  setLeftContent(<ReportsHeaderControls />);
  setRightContent(null);
  return () => {
    setLeftContent(null);
    setRightContent(null);
  };
}, [selectedReportId]);
```

**Layout Integration**:
- **Context Provider**: Client layout provides header control functions
- **Dynamic Content**: Reports page injects navigation controls into header
- **Cleanup Pattern**: Proper cleanup when component unmounts
- **Space Efficiency**: Moves navigation from page body to header bar

#### Database Integration
**Server Action Pattern**:
```typescript
// getMaterialsData: PostgreSQL integration with security filtering
SELECT m.lookupcode, m.statusid, m.materialgroupid, m.name, m.description 
FROM wms_materials m 
JOIN wms_projects p ON p.id = m.projectid 
WHERE p.ownerid = $1
```

**Security Model**:
- **Client Filtering**: All queries filtered by `owner_id` for data security
- **Project Scope**: Support for multi-project clients via `project_id`
- **Error Handling**: Graceful fallbacks and user feedback

### Advanced Table Features (FINALIZED)

#### Interactive Column Headers
- **3-State Sorting**: ASC → DESC → NONE cycle with visual indicators
- **Column-Level Filtering**: Individual search inputs for each column
- **Dynamic Styling**: Active column highlighting with blue text and bold font
- **Type-Safe Filtering**: Handles mixed data types (string/number) gracefully

#### Technical Implementation
```typescript
// Column header component with memoization for performance
const ColumnHeader = React.memo(({ field, label, filters, sortField, sortDirection, onFilterChange, onSort, getSortIcon }) => {
  // Interactive sorting with visual feedback
  // Input filtering with maintained focus
  // Responsive column widths for optimal display
});
```

#### Performance Optimizations
- **React.memo**: Prevents unnecessary re-renders of column components
- **useCallback**: Stable handlers for filtering and sorting
- **useMemo**: Efficient data processing for filtered/sorted results
- **Focus Management**: Seamless input experience without click-per-character

### Report Categories & Structure

#### 1. Inventory Management (4 reports)
- **Materials Report** ✅ (COMPLETED)
  - Table: `wms_materials`
  - Features: Full CRUD interface, advanced filtering
- **Inventory Levels** (Implementation pattern established)
- **Stock Movements** 
- **Low Stock Alerts**

#### 2. Order Management (4 reports)
- **Order History**
- **Pending Orders** 
- **Order Status Tracking**
- **Return Management**

#### 3. Warehouse Operations (3 reports)
- **Picking Lists**
- **Putaway Reports**
- **Location Management**

#### 4. Financial Reports (3 reports)
- **Billing Summary**
- **Cost Analysis**
- **Invoice Details**

### UI/UX Design Patterns (ESTABLISHED)

#### Navigation Design
- **Dynamic Header Integration**: Navigation controls injected into header via context
- **Dropdown Menu**: Accordion-style with 4 main categories
- **Header Controls Pattern**: `useHeaderControls()` hook for dynamic content injection
- **Space Efficiency**: Compact navigation preserving screen real estate
- **Consistent Styling**: Matches overall application theme

#### Table Design Standards
- **Column Widths**: Optimized for content (Lookup Code: 160px, Status: 120px, etc.)
- **Typography Hierarchy**: Bold titles for active columns, semibold for inactive
- **Interactive Elements**: 
  - Sort icons: 4x4px with blue (#0A183C) for active states
  - Filter inputs: 8px height with consistent styling
  - Hover states: Blue color transitions for all interactive elements

#### Data Display Patterns
- **Sample Data Indicators**: Amber alert banners for demonstration mode
- **Real Data Integration**: Seamless toggle with loading states
- **Error Handling**: User-friendly messages with actionable guidance
- **Empty States**: Appropriate messaging for filtered results

### Development Guidelines

#### Adding New Reports
1. **Follow Materials Report Pattern**: Use established component structure
2. **Database Integration**: Create server action in `actions.ts`
3. **Table Implementation**: Extend MaterialsTable pattern with appropriate columns
4. **Navigation Update**: Add report to ReportsHeaderControls configuration
5. **Type Safety**: Define interfaces for data structures

#### Code Standards
- **TypeScript**: Full type coverage with proper interfaces
- **React Patterns**: Functional components with hooks
- **Performance**: Memoization for complex components
- **Security**: Always filter by `owner_id` in database queries

#### Testing Approach
- **Real Data Integration**: Direct database testing (no mocks)
- **User Experience**: Manual testing of all interactive features
- **Performance**: Monitor for sub-15 second response times
- **Cross-browser**: Ensure compatibility across modern browsers

## Order Creation System (IN PROGRESS - August 2025)

### Overview
**Multi-Step Order Creation Form** with real database integration for creating inbound/outbound orders with materials selection.

**Current Status**: 🚧 **PARTIALLY COMPLETE** - Database integration in progress
- ✅ **Step 1 Complete**: Order information, addresses, and shipping details with real database integration
- ✅ **Projects Dropdown**: Real data from `wms_projects` table with auto-selection
- ✅ **Carriers Dropdown**: Real data from `wms_carriers` table 
- ✅ **Service Types Dropdown**: Real data from `wms_carrierservicetypes` table with dynamic filtering by carrier
- ⏳ **Step 2 Pending**: Materials selection still using mock data - needs `wms_materials` integration
- ⏳ **Step 3 Pending**: Order submission to `portal_*` tables not implemented

### Implementation Architecture

#### Database Integration Pattern (ESTABLISHED)
```typescript
// Server Actions Pattern (src/app/actions.ts)
export async function getProjectsForOrders(ownerId: string) {
  // PostgreSQL query with owner filtering
  const query = 'SELECT id, name FROM wms_projects WHERE ownerid = $1 ORDER BY name';
  // Error handling and data transformation
}

// Custom Hooks Pattern (src/hooks/use-*-for-orders.ts)
export function useProjectsForOrders() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Firebase auth integration for owner_id
    // Server action call with error handling
  }, []);
  
  return { projects: data, loading, error };
}
```

#### Form Architecture
```
src/components/dashboard/
├── create-order-form.tsx           # Main multi-step form component
├── order-step-indicator.tsx        # Header navigation component
src/hooks/
├── use-projects-for-orders.ts      # Projects data hook ✅
├── use-carriers-for-orders.ts      # Carriers data hook ✅  
├── use-carrier-service-types-for-orders.ts  # Service types hook ✅
├── use-materials-for-orders.ts     # Materials hook ⏳ PENDING
```

#### Database Tables Integration

**Read Operations (wms_* tables)**:
- ✅ `wms_projects`: Project dropdown with owner filtering
- ✅ `wms_carriers`: Carrier selection with service type integration
- ✅ `wms_carrierservicetypes`: Dynamic filtering by selected carrier
- ⏳ `wms_materials`: Material selection filtered by project (PENDING)

**Write Operations (portal_* tables)**:
- ⏳ `portal_orders`: Main order record (PENDING)
- ⏳ `portal_order_line_items`: Materials and quantities (PENDING)

### Form Steps Architecture

#### Step 1: Order Information (COMPLETED ✅)
- **Order Type**: Inbound/Outbound selection with visual indicators
- **Project Selection**: Real database dropdown with auto-selection of first project
- **Addresses**: Ship From/To and Billing addresses with dynamic labels
- **Shipping**: Carrier and service type selection with dynamic filtering
- **Validation**: Complete form validation for all required fields

#### Step 2: Materials Selection (IN PROGRESS ⏳)
- **Current State**: Using `mockMaterials` array
- **Target**: Integrate `wms_materials` table filtered by selected project
- **Features**: Add/remove line items, batch tracking, UOM management
- **Validation**: Require at least one material to proceed

#### Step 3: Order Review (UI COMPLETE ⏳)
- **Display**: Complete order summary with all details
- **Actions**: Save as Draft / Submit Order buttons
- **Target**: Actual database persistence to `portal_*` tables

### Header Integration Pattern
```tsx
// Dynamic header controls for step navigation
const { setLeftContent, setRightContent } = useHeaderControls();

useEffect(() => {
  setLeftContent(
    <OrderStepIndicator 
      currentStep={currentStep}
      canGoToStep={canGoToStep}
      onStepClick={handleStepClick}
    />
  );
}, [currentStep, formData]);
```

### Data Flow Architecture
```
User Selection → Server Action → Database Query → Custom Hook → Form UI
     ↓              ↓               ↓              ↓           ↓
  Project ID   getProjectsForOrders  wms_projects  useProjectsForOrders  Select Component
```

### Security Model
- **Owner-Based Filtering**: All queries include `WHERE ownerid = $1` parameter
- **Firebase Auth Integration**: User authentication provides `owner_id` context
- **Project Scope**: Materials will be filtered by selected project for data isolation

### Validation Pattern
```tsx
// Step-based validation with dependency checking
const isStep1Valid = () => {
  return !!(formData.orderType && formData.projectId && 
           formData.recipientName && formData.recipientAddress && 
           formData.carrierId && formData.carrierServiceTypeId);
};

const canGoToStep = (step: number) => {
  if (step === 1) return true;
  if (step === 2) return isStep1Valid();
  if (step === 3) return isStep1Valid() && isStep2Valid();
  return false;
};
```

### PENDING WORK - Critical Next Steps

#### 1. Materials Integration (HIGH PRIORITY)
```typescript
// NEEDED: Server action for materials
export async function getMaterialsForOrders(projectId: string, ownerId: string) {
  const query = `
    SELECT m.lookupcode, m.name, m.description, m.uom 
    FROM wms_materials m 
    JOIN wms_projects p ON p.id = m.projectid 
    WHERE m.projectid = $1 AND p.ownerid = $2 
    ORDER BY m.lookupcode
  `;
}

// NEEDED: Custom hook
export function useMaterialsForOrders(projectId: string) {
  // Implementation following established pattern
}

// NEEDED: Update create-order-form.tsx
const { materials, loading: materialsLoading, error: materialsError } = useMaterialsForOrders(formData.projectId);
```

#### 2. Order Persistence (HIGH PRIORITY)
```typescript
// NEEDED: Server action for saving orders
export async function saveOrder(orderData: OrderFormData, ownerId: string) {
  // Insert into portal_orders table
  // Insert line items into portal_order_line_items table
  // Return order ID and confirmation
}

// NEEDED: Update form submission
const handleSave = async (status: 'draft' | 'submitted') => {
  const result = await saveOrder(formData, user.ownerId);
  // Handle success/error feedback
};
```

#### 3. Logo Integration (LOW PRIORITY)
- **Status**: User will provide transparent background logos for carriers
- **Implementation**: Replace current icon-based system with real logo files
- **Pattern**: Similar to CarrierLogo component but with actual image assets

### Current File States

#### Active Files
- `src/components/dashboard/create-order-form.tsx`: Main form with Steps 1-3 UI complete, real data for Step 1, mock data for Step 2
- `src/hooks/use-projects-for-orders.ts`: ✅ Complete implementation
- `src/hooks/use-carriers-for-orders.ts`: ✅ Complete implementation  
- `src/hooks/use-carrier-service-types-for-orders.ts`: ✅ Complete implementation
- `src/app/actions.ts`: Contains getProjectsForOrders, getCarriersForOrders, getCarrierServiceTypesForOrders

#### Missing Files (TO BE CREATED)
- `src/hooks/use-materials-for-orders.ts`: Materials hook for project-filtered selection
- Additional server actions in `src/app/actions.ts`: getMaterialsForOrders, saveOrder

### Integration Notes
- **Form follows established patterns**: Same architecture as Reports system
- **Header controls integration**: Uses same dynamic header pattern
- **Database security**: All queries include owner-based filtering
- **Error handling**: Consistent loading/error states across all dropdowns
- **User experience**: Auto-selection and dynamic filtering for smooth workflow
