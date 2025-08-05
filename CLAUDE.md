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

## Header & Welcome Message System (Updated August 2025)

**Interactive Time-Based Greeting**: Dashboard header displays personalized greetings that change throughout the day.

### Welcome Message Features
- **Time-Based Greetings**: "Good morning", "Good afternoon", or "Good evening" based on current time
  - 5:00 AM - 11:59 AM: "Good morning"
  - 12:00 PM - 5:59 PM: "Good afternoon" 
  - 6:00 PM - 4:59 AM: "Good evening"
- **First Name Only**: Extracts and displays only the first name from user's displayName
- **Page-Specific Display**: Only shown on main Dashboard pages (`/client`, `/employee`)
- **Header Positioning**: Located in header bar on left side, avatar remains on right

### Header Layout Architecture
**Flexible Header System**: Dynamic layout supporting left, center, and right content positioning.

#### Layout Modes
- **Default Layout**: `justify-between` with left content + welcome message, spacer, right content + avatar
- **Center Content Layout**: Three-column `flex-1` layout when `centerContent` prop is provided
- **Conditional Rendering**: Automatically switches layout based on content presence

#### Header Props
```typescript
interface DashboardHeaderProps {
  leftContent?: React.ReactNode;      // Left side content
  rightContent?: React.ReactNode;     // Right side content  
  centerContent?: React.ReactNode;    // Centered content (step indicators)
  showWelcomeMessage?: boolean;       // Dashboard page greeting
}
```

### Key Files
- `src/lib/date-utils.ts` - Time-based greeting logic (`getTimeBasedGreeting()`)
- `src/components/dashboard/dashboard-header.tsx` - Header component with greeting
- `src/components/dashboard/dashboard-layout.tsx` - Page detection and prop passing
- `src/components/dashboard/order-step-indicator.tsx` - Single-line step indicators

### Usage Pattern
```typescript
// Time-based greeting function
const greeting = getTimeBasedGreeting(); // "Good morning" | "Good afternoon" | "Good evening"
const firstName = getFirstName(user.displayName); // "John" from "John Smith"

// Center content for step indicators
const { setCenterContent } = useHeaderControls();
setCenterContent(<OrderStepIndicator currentStep={currentStep} />);
```

## Testing Strategy

**AI Testing**: Real integration tests using actual OpenAI API and PostgreSQL (no mocks). Tests validate response time < 15-20 seconds.

**Test Files**:
- `__tests__/ai/chat-test-cases.ts`: 33 comprehensive test scenarios
- `__tests__/ai/chat-assistant.test.ts`: Jest test runner
- `__tests__/ai/manual-testing.ts`: Manual debugging utilities

**Dynamic Date Testing (UPDATED - August 2025)**:
- **Issue Fixed**: Test cases were using hardcoded dates causing failures when run on different days/months
- **Solution**: Test expectations now use JavaScript functions to generate current dates dynamically
- **Pattern**: `'date) = ' + getCurrentMonth()` for month validation and `'DATE(', 'date', ') = \'' + getCurrentDate() + '\''` for today validation
- **Helper Functions**: `getCurrentMonth()` returns `(new Date().getMonth() + 1).toString()` and `getCurrentDate()` returns `new Date().toISOString().split('T')[0]`
- **Affected Tests**: `date-002` (orders this month) and `date-004` (orders today) now work consistently on any execution date

## Shared Component Architecture (August 2025)

**Component Sharing Strategy**: Client and employee interfaces share UI/UX patterns through shared components for consistency and maintainability.

### Shared Components
- **SharedDashboardPage** (`src/components/dashboard/shared-dashboard-page.tsx`): Role-based dashboard
  - Client: Uses `owner_id` filtering for client-specific data
  - Employee: Full access to all operational data (no filtering)
  - Shared metrics cards, charts, and active orders sections

- **SharedReportsPage** (`src/components/dashboard/shared-reports-page.tsx`): Unified reports interface
  - Client: 20+ client-specific reports with owner filtering
  - Employee: 5-50 reports with configurable access levels
  - Shared MaterialsTable, header controls, and export functionality

- **SharedAssistantPage** (`src/components/dashboard/shared-assistant-page.tsx`): Unified AI assistant interface
  - Client: Loading/error states with owner validation and filtered queries
  - Employee: Direct access without additional validation
  - Shared AI chat interface with role-appropriate data access

### Hook Architecture & Data Fetching Patterns

**Factory Pattern Implementation**: Centralized data fetching logic to eliminate code duplication.

**Core Data Fetching Hook**: `src/hooks/use-data-fetcher.ts` - Generic factory hook providing consistent loading, error, and refetch patterns.

**Standardized Hook Pattern**:
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

## Google Places API Integration (Added August 2025)

**Professional Address Input System**: Smart address autocomplete with separate field population for enhanced UX and data integrity.

### Architecture Overview
- **Google Maps JavaScript API**: Integrated via `beforeInteractive` script loading in `src/app/layout.tsx`
- **Professional Layout**: Separate fields for Line 1, Line 2, City, State, ZIP Code
- **Smart Autocomplete**: Google Places populates all fields automatically when user selects from dropdown
- **No Field Interference**: Each address component (recipient/billing) operates independently

### Implementation Details

#### Script Loading Configuration
```typescript
// src/app/layout.tsx
<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
  strategy="beforeInteractive"
/>
```

#### AddressInput Component Architecture
**Location**: `src/components/dashboard/create-order-form.tsx` (embedded component)

**Data Structure**:
```typescript
interface AddressData {
  line1: string;      // Street number + route (from Google Places)
  line2: string;      // Apt, Suite, Unit (user editable)
  city: string;       // Locality (from Google Places)
  state: string;      // Administrative area level 1, short name (from Google Places)
  zipCode: string;    // Postal code (from Google Places)
  country: string;    // Country (from Google Places)
}
```

#### Google Places Component Mapping
```typescript
// Google Places API → AddressData mapping
components.forEach((component: any) => {
  const types = component.types;
  if (types.includes('street_number')) streetNumber = component.long_name;
  else if (types.includes('route')) route = component.long_name;
  else if (types.includes('locality')) city = component.long_name;
  else if (types.includes('administrative_area_level_1')) state = component.short_name;
  else if (types.includes('postal_code')) zipCode = component.long_name;
  else if (types.includes('country')) country = component.long_name;
});

// Final address object
const newAddress: AddressData = {
  line1: `${streetNumber} ${route}`.trim(),
  line2: value.line2, // Preserved from user input
  city,
  state,
  zipCode,
  country
};
```

### Key Technical Solutions

#### useEffect Dependency Management
**Critical Fix**: Empty dependency array `[]` prevents infinite autocomplete recreation
```typescript
useEffect(() => {
  // Autocomplete initialization logic
}, []); // Empty dependencies - only run once on mount
```

#### Event Listener Management
```typescript
const handlePlaceChanged = () => {
  const place = autocomplete.getPlace();
  if (place.address_components) {
    // Parse and populate all address fields automatically
    onChange(newAddressData);
  }
};

autocomplete.addListener('place_changed', handlePlaceChanged);
```

#### TypeScript Integration
```typescript
// Avoid Google Maps type conflicts
const autocompleteRef = useRef<any>(null);
```

### Form Integration Pattern

#### Order Form Data Structure
```typescript
interface OrderFormData {
  recipientAddress: AddressData;
  billingAddress: AddressData;
  // ... other fields
}
```

#### Validation Logic
```typescript
const isAddressValid = (address: AddressData) => {
  return !!(address.line1 && address.city && address.state && address.zipCode);
};
```

#### Usage Example
```typescript
<AddressInput
  id="recipient"
  label="Ship To Address"
  value={formData.recipientAddress}
  onChange={(value) => setFormData(prev => ({ ...prev, recipientAddress: value }))}
/>
```

### UX Benefits
- **Professional Layout**: Standard e-commerce address form familiar to users
- **Smart Autocomplete**: Start typing in Line 1, Google suggests addresses
- **Automatic Population**: All fields (city, state, zip) fill automatically when address selected
- **Apartment Support**: Line 2 dedicated for apt, suite, unit details
- **Independent Operation**: Recipient and billing addresses don't interfere with each other
- **Validation Ready**: Separate fields enable granular validation

### Files Modified
- `src/app/layout.tsx`: Google Maps script loading
- `src/components/dashboard/create-order-form.tsx`: AddressInput component and form integration
- Updated form validation logic for separate address fields
- Enhanced review step display for structured address presentation

## Order Management System (Added August 2025)

**Create Orders Feature**: Complete order creation workflow with material selection and inventory management.

### Order Types
- **Outbound Orders**: Sales orders with real-time inventory validation
- **Inbound Orders**: Purchase orders with manual material entry

### Materials Selection Architecture

#### Outbound Inventory System
**Key Files**:
- `src/app/actions.ts`: `getOutboundInventory()` - Grouped inventory by material with owner filtering
- `src/hooks/use-outbound-inventory.ts`: Hook for inventory data with dynamic updates
- `src/components/dashboard/create-order-form.tsx`: Material selection UI with validation

**Data Structure**:
```typescript
interface OutboundInventoryItem {
  material_code: string;
  material_description: string;
  total_available_amount: number;
  uom: string;
}
```

**Dynamic Inventory Validation**:
- Real-time quantity tracking across multiple line items
- Prevents over-allocation of inventory
- Shows used quantities in orange text
- Updates available amounts as materials are added

#### Lot-Specific Selection System
**Key Files**:
- `src/app/actions.ts`: `getLotsForMaterial()` - Lots filtered by material and owner
- `src/hooks/use-material-lots.ts`: Hook for lot-specific data
- Lot dropdown activated when material is selected

**Lot Data Structure**:
```typescript
interface MaterialLot {
  lot_code: string;
  total_available_amount: number;
  uom: string;
}
```

**Lot Validation Logic**:
- Validates quantity against specific lot availability
- Tracks usage per lot across multiple line items
- Shows remaining quantity per lot in real-time

### Form Field Architecture

**Field Order**: Material → Lot (Optional) → Quantity → UOM
- Material: Dropdown with description truncated to 18 characters
- Lot: Conditional dropdown (outbound) or manual input (inbound)
- Quantity: Numeric input with validation
- UOM: Auto-populated from material/lot selection

### UI/UX Patterns

**Number Formatting**: All quantities use `.toLocaleString()` for thousands separators
**Toast Notifications**: Professional error/success messages using `useToast()`
**Single-Line Displays**: Selected items show in compact format:
```
MAT-001 • Steel pipe for c... • 1,500 EACH
LOT001 • 500 EACH
```

**Dynamic Updates**: All displays update in real-time as items are added/removed

### Validation Rules

1. **Material Level**: Validates against total available inventory
2. **Lot Level**: When lot selected, validates against lot-specific availability
3. **Dynamic Tracking**: Considers quantities already used in current order
4. **Error Messages**: Specific messages for material vs lot validation

### Order Creation Workflow

**3-Step Process**:
1. **Order Info**: Type, project, addresses, shipping details
2. **Materials**: Add materials with real-time inventory validation
3. **Review**: Final confirmation with all details

**Step Validation**: Progressive validation prevents invalid state transitions

## Environment Variables

```bash
POSTGRES_URL=postgresql://...              # Required for database connection
OPENAI_API_KEY=your_api_key               # Required for AI assistant
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key  # Required for address autocomplete
```

## Configuration Notes

- TypeScript and ESLint errors are ignored in builds (`ignoreBuildErrors: true`)
- Development server uses port 9002 instead of default 3000
- Firebase project ID: "synapse3pl" (hardcoded for compatibility)
- SSL configuration for PostgreSQL: `rejectUnauthorized: false`

## Pricing Configuration (Updated August 2025)

- **Professional Plan**: $30/month (updated from $29/month)
- Located in: `src/components/landing/pricing.tsx`

## Dark Mode Implementation (Added August 2025)

**Full Dark Mode Support**: Complete light/dark theme switching for dashboard areas (excludes landing page as requested).

### Architecture
- **Theme Provider**: `src/context/theme-context.tsx` - React context with localStorage persistence
- **Toggle Location**: Avatar dropdown menu (replaced "Settings" option)
- **CSS Variables**: Pre-configured in `globals.css` with complete light/dark variable sets
- **Tailwind Config**: `darkMode: ['class']` with CSS variable-based color system

### Usage Pattern
```typescript
const { theme, toggleTheme } = useTheme();
// Components automatically adapt via CSS variables
// Hardcoded colors use: className="bg-blue-100 dark:bg-blue-900/30"
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