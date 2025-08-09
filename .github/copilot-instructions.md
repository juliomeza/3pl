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
POSTGRES_URL=postgresql://...                              # PostgreSQL connection
OPENAI_API_KEY=your_openai_api_key                        # OpenAI GPT-4o integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # Address autocomplete
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

### Authentication Flow (CRITICAL for Data Security - Updated August 2025)
1. User authenticates via Firebase Auth (Google/Microsoft OAuth)
2. User document created/retrieved from `users` collection with `clientId` field
3. For client role: Client document retrieved from `clients` collection containing `project_ids` array
4. `project_ids` array is used for all database filtering and multi-project access control

**Critical Data Flow**:
```
Firebase Auth → users/{uid}.clientId → clients/{clientId}.project_ids → Multi-project database filtering
```

### Multi-Project Security Model (Added August 2025)
**Firebase Schema**: `clients/{clientId}.project_ids: number[]` - Array of allowed project IDs
- **Backward Compatibility**: Supports legacy `owner_id` field as fallback
- **Security Validation**: All server actions validate that requested `projectId` is in allowed `project_ids` array
- **Database Filtering**: Uses PostgreSQL `WHERE id = ANY($1)` for efficient multi-project queries

### Security Patterns (Updated August 2025)
- **Employee Access**: Full operational data and management capabilities
- **Client Access**: Limited to project-specific data with automatic `project_ids` array filtering
- **Protected Routes**: `src/components/with-auth.tsx` HOC wrapper
- **Global Auth State**: `src/context/auth-context.tsx` context provider

### Multi-Project Filtering Implementation (MANDATORY - Updated August 2025)
**Key Files**:
- `src/context/auth-context.tsx`: Global auth state with clientInfo containing project_ids
- `src/hooks/use-client-info.ts`: Retrieves project_ids from Firebase chain with owner_id fallback
- Client hooks (like `useProjectsForOrders`, `useOutboundInventory`) use explicit `projectIds` parameter for multi-project access

**Security Pattern**: ALL client database queries MUST validate project access using `project_ids` array filtering.

**Implementation Examples**:
```typescript
// Multi-project server action pattern
export async function getProjectsForOrders(projectIds: number[]): Promise<Project[]> {
  if (!projectIds || projectIds.length === 0) return [];
  const query = 'SELECT id, name FROM wms_projects WHERE id = ANY($1) ORDER BY name';
  return await db.query(query, [projectIds]);
}

// Multi-project inventory with project validation
export async function getOutboundInventory(ownerId: number, projectIds: number[], selectedProjectId?: string) {
  if (!projectIds || projectIds.length === 0) throw new Error('No valid projects provided');
  if (selectedProjectId && !projectIds.includes(parseInt(selectedProjectId))) {
    throw new Error('Access denied: Project not authorized');
  }
  
  const query = `SELECT ... WHERE o.id = $1 AND p.id = ANY($2) ${selectedProjectId ? 'AND p.id = $3' : ''}`;
  const params = selectedProjectId ? [ownerId, projectIds, selectedProjectId] : [ownerId, projectIds];
  return await db.query(query, params);
}

// Hook pattern with multi-project support
const { ownerId, projectIds } = useClientInfo();
const { projects } = useProjectsForOrders(projectIds);
const { inventory } = useOutboundInventory(ownerId, projectIds, selectedProjectId);

// AI assistant pattern with project validation
const getClientAiInsight = async (query: string, ownerId: number, conversationHistory: ChatMessage[]) => {
  return await getAiInsightOpenAIClient(query, ownerId, conversationHistory);
};
```

## Database Integration

### PostgreSQL Architecture
- **Connection**: Pool-based connection via `src/lib/db.ts`
- **Schema Design**: Tables prefixed by purpose
  - `logistics_*` - AI queries and analytics
  - `operations_*` - Dashboard real-time data
  - `wms_*` - Warehouse management system data
  - `portal_*` - Order management data
- **Data Hierarchy**: Customer (`owner_id`) → Project (`project_id`) → Orders

### Critical Data Structures
**logistics_orders Table**:
- `owner_id`: Customer/client identifier
- `project_name`: Project subdivision within customer
- `project_id`: Project subdivision identifier
- Supports multi-project clients with proper filtering

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
- **Data Fetching Pattern**: Use `useDataFetcher()` factory hook for consistent loading/error/refetch logic

## Hook Architecture & Data Fetching Patterns

### Factory Pattern Implementation
**Centralized data fetching logic** to eliminate code duplication and ensure consistency across hooks.

#### Core Data Fetching Hook
- **File**: `src/hooks/use-data-fetcher.ts`
- **Purpose**: Generic factory hook providing consistent loading, error, and refetch patterns
- **Features**: Configurable initial data, error messages, dependency arrays, and refetch loading states

#### Standardized Hook Pattern
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

#### Refactored Hooks Using Factory Pattern (Updated August 2025)
**Standard Owner-Based Hooks**:
- `useActiveOrders(ownerId)` - Active orders with owner filtering
- `useDashboardMetrics(ownerId)` - Dashboard KPI metrics  
- `useShipmentTrends(ownerId, period)` - Chart data with period filtering
- `useDeliveryPerformance(ownerId)` - Performance metrics for charts
- `useTopDestinations(ownerId, period)` - Destination analytics

**Multi-Project Hooks** (Custom implementations):
- `useProjectsForOrders(projectIds)` - Projects filtered by allowed project IDs array
- `useOutboundInventory(ownerId, projectIds, selectedProjectId?)` - Multi-project inventory access
- `useMaterialLots(ownerId, materialCode, projectIds, selectedProjectId?)` - Project-filtered lot access
- `useLicensePlates(ownerId, materialCode, projectIds, selectedProjectId?, lotCode?)` - Project-filtered license plate access

## Multi-Project System Architecture (Added August 2025)

**Granular Project Access Control**: Complete multi-project support allowing clients access to specific projects with robust security validation.

### Firebase Schema Design

**clients Collection Structure**:
```typescript
// clients/{clientId}
{
  name: "Client Name",
  logo_url: "https://...",
  project_ids: [22, 228, 325, 334] // Array of allowed project IDs
  // Legacy fields for backward compatibility:
  owner_id: 701 // Falls back to [owner_id] if project_ids not found
}
```

### Server Action Security Architecture

**Multi-Project Validation Pattern**:
```typescript
// Updated server action signatures with project validation
export async function getProjectsForOrders(projectIds: number[]): Promise<Project[]>
export async function getOutboundInventory(ownerId: number, projectIds: number[], selectedProjectId?: string)
export async function getLotsForMaterial(ownerId: number, materialCode: string, projectIds: number[], selectedProjectId?: string)
export async function getLicensePlatesForMaterial(ownerId: number, materialCode: string, projectIds: number[], selectedProjectId?: string, lotCode?: string)
```

**Security Validation Logic**:
1. **Project Array Validation**: Ensures `projectIds` array is not empty
2. **Access Control**: If `selectedProjectId` provided, validates it exists in allowed `projectIds` array
3. **SQL Security**: Uses PostgreSQL `WHERE id = ANY($1)` for efficient multi-project filtering
4. **Error Handling**: Throws descriptive errors for unauthorized project access attempts

### Key Benefits

- ✅ **Granular Access**: Clients can access multiple specific projects instead of single owner-based access
- ✅ **Enhanced Security**: All queries validate project access before execution
- ✅ **Backward Compatibility**: Supports legacy `owner_id` based access
- ✅ **Performance**: Efficient PostgreSQL array queries with `ANY()` operator
- ✅ **Scalability**: Easy to add/remove project access per client

### Create Order Form Integration

**Project Selection Workflow**:
1. **Project Dropdown**: Shows only projects from client's allowed `project_ids` array
2. **Material Filtering**: Materials load based on `projectIds` array with optional `selectedProjectId` filtering
3. **Inventory Validation**: Lot/license plate selection validates against both `projectIds` and selected project
4. **Security**: All inventory queries include project access validation

### Migration Strategy

**For existing clients**:
1. `useClientInfo` automatically converts single `owner_id` to `[owner_id]` array
2. Legacy server actions continue working with single-project arrays
3. Firebase can be updated gradually from `owner_id` to `project_ids`

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

### Dynamic Date Testing (UPDATED - August 2025)
**Issue Fixed**: Test cases were using hardcoded dates causing failures when run on different days/months.

**Solution Implemented**:
- **Dynamic Date Generation**: Test expectations now use JavaScript functions to generate current dates
- **Pattern**: `'date) = ' + getCurrentMonth()` for month validation and `'DATE(', 'date', ') = \'' + getCurrentDate() + '\''` for today validation
- **Helper Functions**: `getCurrentMonth()` returns `(new Date().getMonth() + 1).toString()` and `getCurrentDate()` returns `new Date().toISOString().split('T')[0]`
- **Affected Tests**: `date-002` (orders this month) and `date-004` (orders today) now work on any date
- **Result**: Tests pass consistently regardless of execution date, eliminating temporal test failures

## Shared Component Architecture

### Component Sharing Strategy
**Client and employee interfaces share UI/UX patterns through shared components for consistency and maintainability.**

#### Refactored Components
- **DashboardLayout** (`src/components/dashboard/dashboard-layout.tsx`): Unified layout system
  - Role-based logo rendering (client: large 160px dynamic logo, employee: company branding)
  - Client logo optimization: Eliminates client name text, centers large logo in full sidebar space
  - Client logo display: Preserves original logo shape without rounded corners for better visual fidelity
  - Collapse button positioned at `-right-20` for proper spacing from large logo
  - Configurable menu items and responsive behavior
  - Header controls context for dynamic content injection

- **SharedDashboardPage** (`src/components/dashboard/shared-dashboard-page.tsx`): Role-based dashboard
  - Client: Uses `project_ids` array filtering for multi-project data access
  - Employee: Full access to all operational data (no filtering)
  - Shared metrics cards, charts, and active orders sections
  - Role-appropriate scaling (employee shows larger numbers)

- **SharedReportsPage** (`src/components/dashboard/shared-reports-page.tsx`): Unified reports interface
  - Client: 20+ client-specific reports with multi-project filtering
  - Employee: 5-50 reports with configurable access levels
  - Shared MaterialsTable, header controls, and export functionality

- **SharedAssistantPage** (`src/components/dashboard/shared-assistant-page.tsx`): Unified AI assistant interface
  - Client: Loading/error states with project validation and filtered queries
  - Employee: Direct access without additional validation
  - Shared AI chat interface with role-appropriate data access

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

## Dark Mode Implementation (Added August 2025)

**Complete Theme System**: Full light/dark mode support for all dashboard components (landing page excluded by design).

### Quick Reference
- **Theme Hook**: `useTheme()` from `src/context/theme-context.tsx`
- **Toggle Access**: Avatar dropdown menu (replaced Settings option)
- **Persistence**: localStorage with system preference fallback
- **Icons**: Moon (light→dark) / Sun (dark→light) with Lucide React

### Technical Implementation
```typescript
// Theme Hook Usage
const { theme, toggleTheme } = useTheme();

// Color Pattern for Hardcoded Colors
className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"

// Hover Effects
className="hover:bg-gray-100 dark:hover:bg-gray-800"
```

### Architecture Benefits
- **shadcn/ui Compatibility**: Automatic adaptation via CSS variables
- **Minimal Code Changes**: Most components work without modification
- **Consistent Experience**: Unified theming across all dashboard areas
- **Performance**: Client-side switching with no server round-trips

## Order Management System (Added August 2025)

**Complete Order Creation and Management**: Full-featured order system with PostgreSQL persistence, draft/submit workflow, and inventory integration.

### Database Schema
**Portal Tables**: New `portal_*` schema for order management
- **`portal_orders`**: Order header (addresses, carrier, status, audit fields)
- **`portal_order_lines`**: Material line items with traceability

### Key Features
- **Order Types**: Inbound (`IN-{ownerId}-0001`) vs Outbound (`OUT-{ownerId}-0002`) with automatic numbering
- **Status Workflow**: `draft` → `submitted` → `created` (external system processing)
- **Save/Submit Logic**: "Save as Draft" preserves editable state, "Submit Order" finalizes for export
- **Inventory Integration**: Real-time validation against WMS inventory for outbound orders
- **User Tracking**: `created_by`/`updated_by` fields capture authenticated user names (not 'system')

### Server Actions
```typescript
// Primary order persistence function
saveOrder(orderData, lineItems, ownerId, status, userName): Promise<{success, orderId, error}>

// Behavior: CREATE new order OR UPDATE existing based on orderData.id
// - Automatic lookup of owner_lookupcode, project_lookupcode, carrier names
// - Line item management: DELETE old + INSERT new for updates
// - Owner filtering for security: WHERE owner_id = ownerId
```

### Implementation Files
- **Form**: `src/components/dashboard/create-order-form.tsx`
- **Server Actions**: `src/app/actions.ts` (saveOrder function)
- **Database Schema**: `portal_orders.sql`, `portal_order_lines.sql`
- **Schema Updates**: `alter_portal_orders.sql` for existing tables

### Address Integration
- **Google Places API**: Professional address autocomplete with separate fields
- **Address Structure**: line1, line2, city, state, zipCode, country
- **Dual Addresses**: Recipient (ship to/from) and billing addresses

## Interactive Welcome Message System (Added August 2025)

**Time-Based Personalized Greetings**: Dynamic header messages that adapt throughout the day.

### Implementation Overview
- **Smart Greetings**: "Good morning", "Good afternoon", "Good evening" based on current time
- **First Name Display**: Extracts first name only from user's Firebase displayName
- **Strategic Positioning**: Located in header left side, dashboard pages only
- **Clean Typography**: Large, bold headline font with dark mode support

### Time-Based Logic
```typescript
// getTimeBasedGreeting() function in src/lib/date-utils.ts
if (hour >= 5 && hour < 12) return 'Good morning';     // 5:00 AM - 11:59 AM
if (hour >= 12 && hour < 18) return 'Good afternoon';  // 12:00 PM - 5:59 PM
return 'Good evening';                                  // 6:00 PM - 4:59 AM
```

### Page-Specific Display Logic
```typescript
// Only shows on main dashboard pages
const isDashboardPage = pathname === '/client' || pathname === '/employee';
<DashboardHeader showWelcomeMessage={isDashboardPage} />
```

### Header Layout Architecture (ENHANCED - August 2025)
**Flexible Three-Layout System**: Dynamic header supporting multiple content positioning strategies.

#### Layout Modes
- **Default Mode**: `justify-between` layout with left content + welcome message, spacer, right content + avatar
- **Center Content Mode**: Three-column `flex-1` layout when `centerContent` prop is provided
- **Automatic Detection**: Conditionally switches layout based on content presence

#### Header Context Extensions
```typescript
interface HeaderControlsContextType {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  centerContent?: ReactNode;        // NEW: Center positioning support
  setLeftContent: (content: ReactNode) => void;
  setRightContent: (content: ReactNode) => void;
  setCenterContent: (content: ReactNode) => void;  // NEW: Center content setter
}
```

#### Step Indicator Integration Pattern
```typescript
// Create Order form implementation
const { setCenterContent } = useHeaderControls();

useEffect(() => {
  setCenterContent(
    <OrderStepIndicator 
      currentStep={currentStep}
      canGoToStep={canGoToStep}
      onStepClick={handleStepClick}
    />
  );
  return () => setCenterContent(null); // Cleanup
}, [currentStep]);
```

#### Step Indicator Design Standards
- **Single-Line Text**: `whitespace-nowrap` prevents text wrapping
- **Flexible Width**: `min-w-fit` ensures adequate space for content
- **Non-Shrinking Icons**: `flex-shrink-0` maintains icon dimensions
- **Proper Spacing**: `px-3` provides comfortable padding
- **Professional Appearance**: Clean rectangular containers with rounded corners

### Files Modified
- `src/lib/date-utils.ts`: Added getTimeBasedGreeting() function
- `src/components/dashboard/dashboard-header.tsx`: Header with greeting logic and centerContent support
- `src/components/dashboard/dashboard-layout.tsx`: Page detection, centerContent context, and prop passing
- `src/components/dashboard/order-step-indicator.tsx`: Single-line step indicators with whitespace-nowrap
- `src/components/dashboard/create-order-form.tsx`: Uses setCenterContent for step indicator positioning

### User Experience Benefits
- **Personal Touch**: Uses actual user name from authentication
- **Time Awareness**: Contextual greeting appropriate to time of day
- **Clean Interface**: No exclamation marks or excessive punctuation  
- **Space Efficient**: Integrated into existing header without layout changes
- **Professional Feel**: Maintains business application aesthetics
- **Perfect Centering**: Step indicators professionally centered in header
- **Single-Line Steps**: Clean, readable step progression without text wrapping

## Google Places API Integration (Added August 2025)

**Professional Address Input System**: Comprehensive address autocomplete with intelligent field separation for superior UX.

### Core Implementation
- **Script Loading**: Google Maps JavaScript API via `beforeInteractive` strategy in `src/app/layout.tsx`
- **Component Location**: `AddressInput` embedded in `src/components/dashboard/create-order-form.tsx`
- **Field Structure**: Line 1 (autocomplete), Line 2 (manual), City, State, ZIP (auto-populated)
- **Multiple Instance Support**: Independent recipient and billing address components

### Critical Technical Patterns (Updated August 2025)

#### Google Places Name Preservation (CRITICAL)
```typescript
// Problem: Google Places resets entire address object, losing manually entered names
// Solution: Use useRef to preserve name values before Google Places executes
const savedValuesRef = useRef<AddressData>(value);

// Always keep latest values in ref
useEffect(() => {
  savedValuesRef.current = value;
}, [value]);

// Use saved values instead of potentially reset value prop
const newAddress: AddressData = {
  title: savedValues.title || '', // Preserved from ref
  firstName: savedValues.firstName || '', // Preserved from ref
  lastName: savedValues.lastName || '', // Preserved from ref
  companyName: savedValues.companyName || '', // Preserved from ref
  line1: `${streetNumber} ${route}`.trim(), // From Google Places
  city, state, zipCode, country // From Google Places
};
```

#### useEffect Dependency Management (CRITICAL)
```typescript
// WRONG - Causes infinite re-creation
useEffect(() => {
  // autocomplete initialization
}, [onChange, value.line2]); // ❌ Recreates constantly

// CORRECT - Single initialization
useEffect(() => {
  // autocomplete initialization  
}, []); // ✅ Empty dependencies
```

#### Address Data Structure
```typescript
interface AddressData {
  line1: string;      // Street + number from Google Places
  line2: string;      // Apt/Suite (user input preserved)
  city: string;       // Auto-populated from Google Places
  state: string;      // Auto-populated (short name: "FL")
  zipCode: string;    // Auto-populated from Google Places
  country: string;    // Auto-populated from Google Places
}
```

#### Google Places Component Parsing
```typescript
// Maps Google Places components to structured address data
components.forEach((component: any) => {
  const types = component.types;
  if (types.includes('street_number')) streetNumber = component.long_name;
  else if (types.includes('route')) route = component.long_name;
  else if (types.includes('locality')) city = component.long_name;
  else if (types.includes('administrative_area_level_1')) state = component.short_name;
  else if (types.includes('postal_code')) zipCode = component.long_name;
  else if (types.includes('country')) country = component.long_name;
});
```

### Form Integration Patterns

#### Order Form Data Structure Update
```typescript
interface OrderFormData {
  // OLD: Single string fields
  // recipientAddress: string;
  // billingAddress: string;
  
  // NEW: Structured address objects
  recipientAddress: AddressData;
  billingAddress: AddressData;
  // ... other fields
}
```

#### Validation Pattern
```typescript
const isAddressValid = (address: AddressData) => {
  return !!(address.line1 && address.city && address.state && address.zipCode);
  // line2 is optional for apartments/suites
};

const isStep1Valid = () => {
  const isRecipientAddressValid = isAddressValid(formData.recipientAddress);
  const isBillingAddressValid = isAddressValid(formData.billingAddress);
  return !!(formData.orderType && formData.projectId && 
           formData.recipientName && isRecipientAddressValid &&
           formData.billingAccountName && isBillingAddressValid &&
           formData.carrierId && formData.carrierServiceTypeId);
};
```

#### Usage Pattern in Forms
```typescript
<AddressInput
  id="recipient"                    // Unique ID for multiple instances
  label="Ship To Address"           // Display label
  value={formData.recipientAddress} // AddressData object
  onChange={(value) => setFormData(prev => ({ 
    ...prev, 
    recipientAddress: value 
  }))}
/>
```

### Review Display Pattern
```typescript
// Enhanced address display in review/confirmation sections
<div className="text-sm space-y-1">
  <p className="font-medium">{recipientName}</p>
  <div className="text-muted-foreground">
    <p>{address.line1}</p>
    {address.line2 && <p>{address.line2}</p>}
    <p>{address.city}, {address.state} {address.zipCode}</p>
    <p>{address.country}</p>
  </div>
</div>
```

### TypeScript Considerations
```typescript
// Avoid Google Maps type conflicts
const autocompleteRef = useRef<any>(null);

// Event listener cleanup
return () => {
  if ((window as any).google && autocompleteRef.current) {
    (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
  }
};
```

### UX Design Principles
- **Familiar Layout**: Standard e-commerce address form pattern
- **Progressive Enhancement**: Works without JavaScript, enhanced with autocomplete
- **Independent Components**: Multiple address inputs don't interfere
- **Apartment-Friendly**: Dedicated Line 2 for suite/apt details
- **Professional Appearance**: Grid layout with responsive design

## Order Management System (Updated August 2025)

**Create Orders Feature**: Complete order creation system with intelligent material selection and real-time inventory validation.

### Order Creation Architecture

#### Two-Mode Operation
- **Outbound Orders**: Sales orders with real-time PostgreSQL inventory validation
- **Inbound Orders**: Purchase orders with manual material entry (no inventory constraints)

#### Smart Material Selection System
**Key Files**:
- `src/app/actions.ts`: `getOutboundInventory()`, `getLotsForMaterial()`, `getLicensePlatesForMaterial()` server actions
- `src/hooks/use-outbound-inventory.ts`: Material inventory data with dynamic updates
- `src/hooks/use-material-lots.ts`: Lot-specific inventory data
- `src/hooks/use-license-plates.ts`: License plate-specific inventory data
- `src/components/dashboard/create-order-form.tsx`: Complete order creation form with optimized layout

**Hierarchical Material Selection Flow** (Updated August 2025):
1. **Material Dropdown**: Shows available materials with total quantities (3 columns - expanded for better readability)
2. **Lot Selection**: Conditional dropdown (outbound) filtered by selected material (2 columns - expanded)
3. **License Plate Selection**: Conditional dropdown (outbound) filtered by material + lot (2 columns - expanded)
4. **Quantity Input**: Starts blank, validates against most specific selection (1 column)
5. **UOM Field**: Auto-populated from material/lot/license plate data (1 column)
6. **Add Button**: Right-aligned in final column for clean layout (1 column)
7. **Grid System**: 10-column responsive grid (`md:grid-cols-10`) for optimal field distribution
8. **Input Validation**: Material selection required, quantity must be > 0, with toast notifications
9. **Hierarchical Validation**: License Plate > Lot > Material (most specific takes precedence)
10. **Dynamic Updates**: All displays update as items are added/removed

#### Data Structures
```typescript
// Outbound inventory (materials aggregated across lots)
interface OutboundInventoryItem {
  material_code: string;
  material_description: string;
  total_available_amount: number;
  uom: string;
}

// Lot-specific inventory (when lot is selected)
interface MaterialLot {
  lot_code: string;
  total_available_amount: number;
  uom: string;
}

// License plate-specific inventory (when license plate is selected)
interface LicensePlate {
  license_plate_code: string;
  total_available_amount: number;
  uom: string;
}

// Order line items
interface LineItem {
  materialCode: string;
  materialName: string;
  quantity: number;
  uom: string;
  batchNumber?: string;        // Lot code when selected
  licensePlate?: string;       // License plate code when selected
  availableAmount?: number;    // For tracking purposes
}
```

### Form Layout Optimizations (August 2025)

**Enhanced Field Organization**: Improved layout spacing and grouping for better space utilization and professional appearance.

#### Grid Layout Standards
**Order Information Section**:
- **4-Column Grid**: Order Type, Project, Order Number, Reference Number all in same row (`md:grid-cols-4`)
- **Horizontal Optimization**: Better use of wide screens while maintaining responsive design
- **Consistent Spacing**: Uniform `gap-4` across order information section

**Name Fields Section**:
- **3-Column Grid**: Title, First Name, Last Name in same row (`md:grid-cols-3`)
- **Dedicated Company Row**: Company Name gets full-width row for long business names
- **Professional Hierarchy**: Personal info grouped together, company separate

**Address Fields Section**:
- **2-Column Grid**: Address Line 1 and Line 2 share row (`md:grid-cols-2`)
- **3-Column Grid**: City, State, ZIP Code maintain existing layout (`md:grid-cols-3`)
- **Space Efficiency**: Better utilization without compromising Google Places functionality

#### Implementation Patterns
```typescript
// Order info: All fields in one row for efficiency
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Order Type, Project, Order Number, Reference Number */}
</div>

// Name fields: Personal info together
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  {/* Title, First Name, Last Name */}
</div>

// Company: Full-width for long names
<div className="space-y-2">
  {/* Company Name field */}
</div>

// Address: Lines together for efficiency
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {/* Line 1, Line 2 */}
</div>
```

#### Benefits
- ✅ **Better Space Utilization**: More efficient use of horizontal space
- ✅ **Visual Hierarchy**: Clear grouping of related fields  
- ✅ **Company Name Support**: Full-width row accommodates long business names
- ✅ **Responsive Design**: Collapses appropriately on mobile devices
- ✅ **Professional Appearance**: Cleaner, more organized form layout

### Real-Time Validation System (Updated August 2025)

#### Multi-Level Validation Logic
1. **Input Validation** (NEW):
   - Material selection required before adding line items
   - Quantity must be greater than 0 (prevents empty/zero quantity entries)
   - Toast notifications provide clear error messaging for validation failures

2. **Inventory Validation**:
   - **Material Level**: Validates against total available inventory when no lot/license plate selected
   - **Lot Level**: When lot selected, validates against lot-specific availability  
   - **License Plate Level**: When license plate selected, validates against license plate-specific availability
   - **Hierarchical Priority**: License Plate > Lot > Material (most specific takes precedence)
   - **Dynamic Tracking**: Considers quantities already used in current order across all levels
   - **Error Messages**: Specific messages for material vs lot vs license plate validation

#### Inventory Tracking Patterns
```typescript
// Calculate remaining quantity considering current order usage
const getRemainingQuantity = (materialCode: string, totalAvailable: number): number => {
  const usedQuantity = formData.lineItems
    .filter(item => item.materialCode === materialCode)
    .reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(0, totalAvailable - usedQuantity);
};

// License plate-specific validation (NEW)
const usedFromLicensePlate = formData.lineItems
  .filter(item => item.materialCode === materialCode && item.licensePlate === licensePlateCode)
  .reduce((sum, item) => sum + item.quantity, 0);

// Lot-specific validation
const usedFromLot = formData.lineItems
  .filter(item => item.materialCode === materialCode && item.batchNumber === lotCode)
  .reduce((sum, item) => sum + item.quantity, 0);
```

### UI/UX Implementation Patterns

#### Professional Form Layout (Updated August 2025)
**Field Order**: Material → Lot (Optional) → License Plate (Optional) → Quantity → UOM → Add Button
- **Grid System**: 10-column responsive grid (`md:grid-cols-10`) for optimal spacing
- **Column Distribution**: Material (3), Lot (2), License Plate (2), Quantity (1), UOM (1), Add Button (1)
- **Compact Add Button**: Circular icon button (`rounded-full`) instead of full-width button
- **Consistent Spacing**: `gap-3` for optimal field spacing
- **Enhanced Readability**: Expanded fields prevent truncation of material descriptions and license plate codes

#### Single-Line Display Optimization
**Selected Item Display**: Compact format to fit field widths
```typescript
// Material selection display (18-character truncation)
MAT-001 • Steel pipe for c... • 1,500 EACH

// Lot selection display (no "Available:" prefix)
LOT001 • 500 EACH

// License Plate selection display (NEW)
LP: LICENSE123 • 250 EACH
```

#### Toast Notification System (NEW - August 2025)
**Comprehensive Input Validation**:
```typescript
// Material validation toast
toast({
  variant: "destructive",
  title: "Material Required",
  description: "Please select a material before adding to the order.",
});

// Quantity validation toast
toast({
  variant: "destructive", 
  title: "Quantity Required",
  description: "Please enter a valid quantity greater than 0.",
});

// Inventory validation toasts
toast({
  variant: "destructive",
  title: "Insufficient License Plate Inventory",
  description: `Only ${remainingQty.toLocaleString()} ${uom} remaining in license plate ${licensePlateCode}`,
});
```

#### Number Formatting Standards
- **All Quantities**: Use `.toLocaleString()` for thousands separators
- **Consistent Application**: Dropdowns, selected displays, badges, validation messages
- **Professional Appearance**: `10,000 EACH` instead of `10000 EACH`

#### Dynamic Visual Feedback
- **Used Quantities**: Orange text `(500 used)` in dropdown options
- **Real-Time Updates**: Available amounts update as materials are added
- **Toast Notifications**: Professional success/error messages using `useToast()`

### Form Workflow Architecture

#### 3-Step Progressive Validation
1. **Order Information**: Type, project, addresses, shipping details with Google Places integration
2. **Material Selection**: Real-time inventory management with hierarchical lot/license plate options
3. **Review & Submit**: Final confirmation with all details formatted

#### Step Validation Logic
```typescript
const isStep1Valid = () => {
  const isRecipientAddressValid = formData.recipientAddress.line1 && 
                                 formData.recipientAddress.city && 
                                 formData.recipientAddress.state && 
                                 formData.recipientAddress.zipCode;
  const isBillingAddressValid = formData.billingAddress.line1 && 
                               formData.billingAddress.city && 
                               formData.billingAddress.state && 
                               formData.billingAddress.zipCode;
  return !!(formData.orderType && formData.projectId && 
           formData.recipientName && isRecipientAddressValid &&
           formData.billingAccountName && isBillingAddressValid &&
           formData.carrierId && formData.carrierServiceTypeId);
};

const isStep2Valid = () => {
  return formData.lineItems.length > 0;
};

const canGoToStep = (step: number) => {
  if (step === 1) return true;
  if (step === 2) return isStep1Valid();
  if (step === 3) return isStep1Valid() && isStep2Valid();
  return false;
};
```

#### Header Integration Pattern
```typescript
// Step indicator in center header position
const { setCenterContent } = useHeaderControls();

useEffect(() => {
  setCenterContent(
    <OrderStepIndicator 
      currentStep={currentStep}
      canGoToStep={canGoToStep}
      onStepClick={handleStepClick}
    />
  );
  return () => setCenterContent(null); // Cleanup
}, [currentStep, formData]);
```

### Owner ID Security Integration
**All inventory queries filtered by `owner_id`** ensuring client data isolation:
```typescript
// Server action with mandatory owner filtering
export async function getOutboundInventory(ownerId: number, projectId?: string) {
  const query = `
    SELECT ... FROM wms_licenseplatecontents lpc
    ... WHERE o.id = $1 AND lpc.amount > 0
  `;
  return await db.query(query, [ownerId]);
}

// Hook usage with client authentication
const { ownerId } = useClientInfo();
const { inventory } = useOutboundInventory(ownerId, projectId);
```

### Database Query Optimization
- **Grouped Aggregation**: `GROUP BY` with `SUM()` for material-level totals
- **Owner Filtering**: Automatic `WHERE owner_id = $1` for all client queries
- **Project Scoping**: Optional project filtering for multi-project clients
- **Status Filtering**: Only active inventory (`statusid = 1`, `archived = false`)

## Development Guidelines

### Critical Notes
- **TypeScript errors ignored in builds** (`ignoreBuildErrors: true`)
- **Development server runs on port 9002** (not 3000)
- **Firebase Studio compatibility** - Reliable3PL project
- **AI Performance**: Schema caching, reduced tokens, efficient conversation handling
- **Code Language**: All code must be in English
- **Testing Required**: All AI features need real integration tests

### Configuration Notes

#### Pricing Configuration (Updated August 2025)
- **Professional Plan**: $30/month (updated from $29/month)
- Located in: `src/components/landing/pricing.tsx`

### Integration Points
- **Firebase Auth** → Firestore profiles → Role-based routing
- **PostgreSQL** → AI flows → Natural language insights  
- **OpenAI API** → Server actions → Client components
- **shadcn/ui** → Custom styling → Consistent design

## Active Orders Status System (Added August 2025)

**Multi-Table Status Management**: Unified status display system combining portal orders and WMS operations data with real-time auto-refresh.

### Status Flow Architecture

**Status Sources & Mapping**:
- **Portal Orders** (`portal_orders.status`): Pre-WMS statuses
  - `'draft'` → "Draft" 🔘 (Gray) - Order saved but not submitted
  - `'submitted'` → "Submitted" 🔵 (Blue) - Ready for ETL processing
  - `'failed'` → "Failed" 🔴 (Red) - ETL failed to create in WMS
  - `'created'` → Not displayed (handed off to WMS)

- **Operations Active Orders** (`operations_active_orders.order_status_id`): WMS statuses
  - `1` → "Created" 🟢 (Green) - Successfully created in WMS
  - `2` → "Picking" 🟡 (Yellow) - Being picked/processed
  - `4` + no delivery_status → "Shipped" 🟣 (Purple) - Left warehouse
  - `4` + delivery_status 'in transit'/'in_transit' → "In Transit" 🟠 (Orange) - En route
  - `8` → Excluded (Cancelled orders never shown)
  - delivery_status 'delivered' → Excluded (Delivered orders never shown)

### SQL Query Implementation

**Multi-Table UNION Strategy**:
```sql
-- Portal orders (not yet in WMS)
SELECT order_number, status as display_status, ... FROM portal_orders 
WHERE owner_id = $1 AND status IN ('draft', 'submitted', 'failed')

UNION ALL

-- WMS orders with intelligent status mapping
SELECT order_number,
  CASE 
    WHEN order_status_id = 1 THEN 'created'
    WHEN order_status_id = 2 THEN 'picking'
    WHEN order_status_id = 4 AND (LOWER(delivery_status) = 'in transit' OR LOWER(delivery_status) = 'in_transit') THEN 'in_transit'
    WHEN order_status_id = 4 AND (delivery_status IS NULL OR LOWER(delivery_status) NOT IN ('in transit', 'in_transit', 'delivered')) THEN 'shipped'
  END as display_status, ...
FROM operations_active_orders 
WHERE owner_id = $1 AND order_status_id IN (1, 2, 4) 
  AND order_status_id != 8  -- Exclude cancelled
  AND (order_status_id != 4 OR LOWER(delivery_status) != 'delivered')  -- Exclude delivered

ORDER BY order_number ASC  -- Sequential order for priority
```

### Status Color System

**Unique Color Palette**:
```typescript
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'created': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'picking': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'in_transit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  }
};
```

### Real-Time Auto-Refresh System

**React Query Integration**: Smart polling with page visibility optimization.

#### TanStack Query Implementation
**Files Modified**:
- `src/context/query-context.tsx`: QueryClient provider with optimized defaults
- `src/app/layout.tsx`: QueryProvider integration
- `src/hooks/use-active-orders.ts`: Complete React Query refactor with smart polling

#### Smart Polling Features
```typescript
// Polling configuration in useActiveOrders
const { data: activeOrders, isLoading, error, refetch } = useQuery({
  queryKey: ['activeOrders', ownerId],
  queryFn: () => getActiveOrders(ownerId!),
  enabled: ownerId !== null,
  refetchInterval: isVisible ? 30 * 1000 : false,  // 30s when visible
  staleTime: 25 * 1000,  // Data fresh for 25 seconds
  refetchOnWindowFocus: true,  // Refetch when returning to tab
  refetchIntervalInBackground: false,  // Pause in background tabs
});

// Page visibility management
const [isVisible, setIsVisible] = useState(true);
useEffect(() => {
  const handleVisibilityChange = () => {
    setIsVisible(document.visibilityState === 'visible');
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

#### Optimization Features
- ✅ **30-second polling** when tab is active
- ✅ **Automatic pause** when tab is hidden/backgrounded
- ✅ **Resume polling** when user returns to tab
- ✅ **Window focus refetch** for immediate updates
- ✅ **Network reconnection handling** with automatic retry
- ✅ **Smart caching** prevents duplicate requests
- ✅ **Battery optimization** through intelligent polling

### UI/UX Enhancements

**Title Case Display**:
```typescript
// Professional status badge formatting
<Badge className={getStatusColor(order.display_status)}>
  {order.display_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
</Badge>
```

**Order Prioritization**:
- Orders sorted by `order_number ASC` (oldest first for priority)
- Lower order numbers = older orders = higher priority for processing

### Performance Impact

**Minimal Resource Usage**:
- **Per User**: ~350KB/hour additional data usage
- **50 Concurrent Users**: ~17MB/hour total server impact  
- **Database Load**: 100 additional simple queries/minute
- **Battery Impact**: Negligible due to page visibility optimization

### Integration Files

**Core Implementation**:
- `src/app/actions.ts`: `getActiveOrders()` with multi-table UNION logic
- `src/hooks/use-active-orders.ts`: React Query implementation with smart polling
- `src/components/dashboard/shared-dashboard-page.tsx`: Status display with color system
- `src/context/query-context.tsx`: TanStack Query configuration

### Benefits

- ✅ **Real-Time Updates**: Status changes reflect automatically within 30 seconds
- ✅ **No Manual Refresh**: Eliminates need for user to refresh page
- ✅ **Battery Efficient**: Pauses polling in inactive tabs
- ✅ **Professional UX**: Smooth, automatic status transitions
- ✅ **Minimal Impact**: Negligible data and performance overhead
- ✅ **Error Resilient**: Automatic retry and reconnection handling

### Current System Status
- **Production Ready**: Authentication, AI assistant, dashboard views, dark mode, order creation with inventory, real-time active orders
- **Recently Added**: Multi-table Active Orders status system, React Query polling, smart page visibility optimization, professional Title Case status badges, unique color system
- **Testing**: 33 AI test cases with dynamic date handling, real API integration

## Create Order – Validation, Order Type Locking & New Order Workflow (August 2025)

Authoritative behavior specification for the Create Order form to ensure consistency and prevent regressions.

### Design Goals
- Show only the specific blocking field error (Order Type) when it alone is missing.
- Prevent post-save semantic changes (no Order Type switching after number assignment / materials / submission).
- Preserve immutability of the generated order number (never regenerate silently).
- Provide a safe, low-friction path to start over (New Order) with confirmation only when meaningful changes exist.

### Order Type Validation Behavior
| Scenario | Result |
| --- | --- |
| User clicks Save with no Order Type | Only Order Type field highlighted (red) |
| Any other required Step 1 fields missing but Order Type present | Standard multi-field validation (if triggered) |
| Order Type selected after isolated error | Error clears instantly |

Implementation detail: `orderTypeErrorOnly` boolean state restricts error styling to the Order Type select.

### Lock Conditions for Order Type
Order Type becomes disabled (locked) once ANY of these conditions holds:
1. An `orderNumber` exists (first successful save)
2. At least one material line item has been added
3. Order status transitions away from `draft` (e.g. becomes `submitted`)

Helper text communicates the lock: “Order Type locked after first save or materials.” (Concise, neutral tone.)

### Order Number Policy
- Generated server-side exactly once on initial CREATE when absent.
- Never regenerated or modified client-side after creation.
- Prefix stability guaranteed (e.g. OUT-/IN-) by rejecting Order Type changes post-lock.
- Highlighting the field on first assignment is allowed; no subsequent automatic re-highlights.

### New Order Reset Workflow
Global “New Order” button (header right region) performs intelligent reset:
1. Detects “trivial” state: only Order Type chosen and no other meaningful data → silent reset (no dialog).
2. Otherwise opens confirmation dialog (protects against accidental loss of work).
3. On confirm calls `resetToNewOrder()` → restores pristine initial form, clears `orderNumber`, materials, status, and unlocks Order Type; returns to Step 1.
4. Dirty/hash tracking recalculated so navigation and unsaved prompts behave like a fresh session.

### Supporting Utilities / Flags
- `orderTypeErrorOnly` – isolates Order Type error state.
- `isOnlyOrderTypeSelected()` – determines whether to skip confirmation dialog.
- `resetToNewOrder()` – canonical reset function (must remain idempotent and comprehensive).
- Centralized lock predicate – avoid duplicating logic inline.

### Do / Don’t Guidelines
| Do | Don’t |
| --- | --- |
| Keep lock predicate in one place | Scatter duplicated conditional logic across components |
| Use `resetToNewOrder()` for all full resets | Manually mutate partial state slices for resets |
| Add future enhancements (copy order number) without touching lock rules | Regenerate an existing order number |
| Update docs if lock logic evolves | Allow silent Order Type change after save |

### Regression Checklist
- [ ] Single-field (Order Type) validation still functions.
- [ ] Lock engages immediately after any lock condition met.
- [ ] New Order reset clears number + materials + status and unlocks type.
- [ ] No client code path regenerates an existing order number.
- [ ] Confirmation dialog appears only for meaningful unsaved changes.

### Rationale
Focused validation, deterministic locking, and explicit reset flow reduce user confusion, protect numbering integrity, and maintain auditability. The mental model is simple: choose type first, save, proceed; use New Order to start over.

### Additional Create Order UX Details (Aug 8 2025 Addendum)
| Feature | Implementation | Notes |
| ------- | -------------- | ----- |
| Multi-Step "Save as Draft" | Draft save button available on Steps 1, 2, 3 | Same server action; persists partial progress with status='draft' |
| Inline Save Message | `inlineSaveMessage` left-aligned ephemeral text | Avoids toast noise for routine saves; auto-clears via timeout |
| Order Number Highlight | `highlightOrderNumber` ring + pulse ~1.8s | First assignment emphasis only |
| Type Change Pre-Lock Hint | Inline message: "Order type changed — number will generate on save" | Only before lock predicate becomes true |
| Draft Save Enablement | Disabled until meaningful dirty state beyond pristine baseline | Prevents empty placeholder drafts |
| Dirty Baseline Reset | After successful initial save & on `resetToNewOrder()` | Keeps draft button disabled when appropriate |

## Dashboard Visual Refresh & Status Chip Harmonization (August 2025)

### Objectives
- Unified tinted chip palette (background tint + readable text + subtle border).
- Higher information density with two-row responsive order entries.
- Clear action affordances (Edit/Delete only when allowed) with minimal noise.
- Modern metric cards using gradient accent bars and skeleton placeholders.

### Metric Cards
- Gradient bar at top (`h-1`) with multi-stop brand gradients.
- Skeleton placeholders for numbers and deltas while loading.
- Employee role shows scaled sample values when real metrics absent (avoids empty states).

### Active Orders Enhancements
- Collapsible section summarizing Active vs Failed counts.
- Live statuses grouped first: created, picking, shipped, in_transit.
- Sorting logic: live first, then remaining (draft, submitted, failed) for operational focus.
- Row structure:
  - Row 1: Order Number (link) • Customer • Destination • Carrier/Service | Status + action icons.
  - Row 2: Pickup Date • ETA • (mobile) Destination, Customer, Carrier/Service.
- Truncation utilities prevent overflow; wide meta hidden on small screens.

### Status Chip Palette
Implemented via `getStatusColor(status)` in `shared-dashboard-page.tsx`.

| Status | Semantic | Palette Class Pattern |
| --- | --- | --- |
| draft | Neutral pre-processing | foreground/5 tint + muted text + subtle border |
| submitted | Queued | slate-500/10 tint + slate text |
| failed | Error | rose-500/10 tint + rose text |
| created | WMS created | blue-500/10 tint + blue text |
| picking | Processing | indigo-500/10 tint + indigo text |
| shipped | Departed | violet-500/10 tint + violet text |
| in_transit | En route | sky-500/10 tint + sky text |
| legacy mapped (processing, picked_up, ready_for_pickup, pending) | Backwards compatibility | Nearest operational tint |

All chips include border-* /20 and dark mode variants.

### Action Buttons Logic
- Delete & Edit only when: `source_table === 'portal'` AND status in (draft, failed).
- View button: always available (client) but hidden in Row 1 on mobile (shown Row 2).
- Delete uses AlertDialog with irreversible warning.

### Route-Driven Dialog
- Order details modal bound to `?view=ORDER_NUMBER` search param.
- Closing dialog rewrites URL to `/client` without scroll reset (preserves context).

### Loading & Skeleton Strategy
- Metrics: individual skeleton blocks sized to final content.
- Active Orders: three placeholder rows simulating final layout.

### Theming
- Dual light/dark classes per chip; gradient bars have dark-adapted color stops.

### Regression Checklist
- [ ] Live statuses appear first.
- [ ] Chips show consistent tint+border in both themes.
- [ ] Edit/Delete hidden when predicate not met.
- [ ] Dialog close preserves scroll & state.
- [ ] Long customer/destination values truncate without layout shift.

### Rationale
Tinted chips reduce visual noise vs solid badges while maintaining status salience; grouping operational statuses improves at-a-glance scanning efficiency.

### Minor UI Enhancements (Aug 8 2025 – Non-Critical)
| Feature | Description | Notes |
| ------- | ----------- | ----- |
| Dialog Backdrop Blur | Order details dialog uses blurred translucent background for depth | backdrop-blur utility applied |
| AI Assistant 60/40 Layout | Desktop split ~60% chat / 40% visualization panel | Mobile collapses to single column |
| Dark Mode Card Brightness | Cards slightly lighter for better contrast vs background | Maintain WCAG contrast targets |
| Shipping/Billing Divider | Subtle horizontal divider improves visual grouping | Muted border color, low opacity |
| Removed Redundant AI Summary | Suppressed summary when table is only visualization | Reduces scroll noise |
