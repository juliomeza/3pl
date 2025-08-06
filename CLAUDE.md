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
- `portal_*` tables: Order management system (orders and line items)

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
- **DashboardLayout** (`src/components/dashboard/dashboard-layout.tsx`): Unified layout system
  - Role-based logo rendering (client: large 160px dynamic logo, employee: company branding)
  - Client logo optimization: Eliminates client name text, centers large logo in full sidebar space
  - Client logo display: Preserves original logo shape without rounded corners for better visual fidelity
  - Collapse button positioned at `-right-20` for proper spacing from large logo
  - Configurable menu items and responsive behavior
  - Header controls context for dynamic content injection

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

**Create Orders Feature**: Complete order creation workflow with material selection, inventory management, and PostgreSQL persistence.

### Order Types & Database Schema
- **Outbound Orders**: Sales orders with real-time inventory validation
- **Inbound Orders**: Purchase orders with manual material entry

### Database Tables (Updated August 2025)
**`portal_orders`**: Main order header information with structured name fields
- Order identification: `order_number`, `reference_number` (replaces `shipment_number`), `order_date`
- Order classification: `order_type` ('inbound'|'outbound'), `status` ('draft'|'submitted'|'created')
- Client/Project info: `owner_id`, `owner_lookupcode`, `project_id`, `project_lookupcode`
- **Structured Name Fields**: 
  - Recipient: `recipient_title`, `recipient_first_name`, `recipient_last_name`, `recipient_company_name`
  - Billing: `billing_title`, `billing_first_name`, `billing_last_name`, `billing_company_name`
  - Legacy: `recipient_name`, `account_name` (maintained for backward compatibility)
- Address info: `addr1`, `addr2`, `city`, `state`, `zip`, `country` (2-letter codes)
- Carrier info: `carrier`, `service_type` (names), `carrier_id`, `service_type_id` (IDs)
- Audit fields: `created_by`, `updated_by` (user display names), timestamps

**`portal_order_lines`**: Material line items with UOM optimization
- Foreign key: `order_id` references `portal_orders.id`
- Material info: `material_code`, `material_description`, `quantity`, `uom`
- **UOM Storage**: Saves `shortname` from `wms_inventorymeasurementunits` for external system compatibility
- **Display vs Storage**: UI shows full UOM name (e.g. "Each"), database stores short name (e.g. "EA")
- Traceability: `lot`, `license_plate`, `serial_number`, `batch_number`
- Auto line numbering with `line_number` field

### Order Number Generation
- **Outbound orders**: `OUT-{ownerId}-0001`, `OUT-{ownerId}-0002`, etc.
- **Inbound orders**: `IN-{ownerId}-0001`, `IN-{ownerId}-0002`, etc.
- Auto-generated if not provided, incremented per owner

### Order Status Workflow
- **'draft'**: Saved but editable, not processed by external systems
- **'submitted'**: Ready for external system processing (CSV/JSON export)
- **'created'**: Processed by external system, no longer appears in export

### Save vs Submit Logic
- **"Save as Draft"**: Creates new order OR updates existing with status='draft'
- **"Submit Order"**: Updates existing draft to status='submitted' OR creates new submitted order
- Form tracks `orderData.id` to determine CREATE vs UPDATE operation
- Prevents duplicate orders when user saves then submits

### Server Actions for Order Management
**Key Files**:
- `src/app/actions.ts`: `saveOrder()` - Handles CREATE/UPDATE logic for orders and line items
- `src/app/actions.ts`: `getOutboundInventory()` - Grouped inventory by material with owner filtering
- `src/hooks/use-outbound-inventory.ts`: Hook for inventory data with dynamic updates
- `src/components/dashboard/create-order-form.tsx`: Material selection UI with validation

### Order Persistence Logic
**`saveOrder()` Function**:
- Parameters: `orderData`, `lineItems`, `ownerId`, `status`, `userName`
- Automatic lookup of `owner_lookupcode`, `project_lookupcode`, `carrier` name, `service_type` name
- Uses `orderData.id` to determine CREATE vs UPDATE
- UPDATE: Deletes existing line items, re-inserts new ones
- CREATE: Generates order number, inserts header + line items
- User tracking: `created_by` and `updated_by` use authenticated user's displayName/email

### Materials Selection Architecture

#### Outbound Inventory System

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

#### License Plate Selection System (Added August 2025)
**Key Files**:
- `src/app/actions.ts`: `getLicensePlatesForMaterial()` - License plates filtered by material, lot, and owner
- `src/hooks/use-license-plates.ts`: Hook for license plate-specific data
- License plate dropdown activated when material (and optionally lot) is selected

**License Plate Data Structure**:
```typescript
interface LicensePlate {
  license_plate_code: string;
  total_available_amount: number;
  uom: string;
}
```

**Hierarchical Validation Logic**:
- **Material Only**: Validates against total material inventory
- **Material + Lot**: Validates against lot-specific availability
- **Material + Lot + License Plate**: Validates against license plate-specific availability
- Tracks usage per license plate across multiple line items
- Shows remaining quantity per license plate in real-time

### Form Field Architecture

**Grid Layout**: 10-column responsive grid (`md:grid-cols-10`) for optimal field distribution
**Field Order**: Material → Lot (Optional) → License Plate (Optional) → Quantity → UOM → Add Button

**Column Distribution**:
- Material: Dropdown with description truncated to 18 characters (3 columns)
- Lot: Conditional dropdown (outbound) or manual input (inbound) (2 columns)
- License Plate: Conditional dropdown (outbound) or manual input (inbound) (2 columns)
- Quantity: Numeric input with validation (1 column, starts blank)
- UOM: Auto-populated from material/lot/license plate selection (1 column)
- Add Button: Right-aligned in final column (1 column)

**Input Validation**:
- Material selection required with toast notification if missing
- Quantity validation: Must be greater than 0 with specific error messaging
- Real-time inventory validation with detailed error descriptions

### UI/UX Patterns

**Number Formatting**: All quantities use `.toLocaleString()` for thousands separators
**Toast Notifications**: Professional error/success messages using `useToast()`
**Single-Line Displays**: Selected items show in compact format:
```
MAT-001 • Steel pipe for c... • 1,500 EACH
LOT001 • 500 EACH
LP: LICENSE123 • 250 EACH
```

**Dynamic Updates**: All displays update in real-time as items are added/removed

### Validation Rules

1. **Input Validation**:
   - Material selection required before adding line items
   - Quantity must be greater than 0 (prevents empty/zero quantity entries)
   - Toast notifications provide clear error messaging for validation failures

2. **Inventory Validation**:
   - **Material Level**: Validates against total available inventory
   - **Lot Level**: When lot selected, validates against lot-specific availability  
   - **License Plate Level**: When license plate selected, validates against license plate-specific availability
   - **Hierarchical Priority**: License Plate > Lot > Material (most specific level takes precedence)
   - **Dynamic Tracking**: Considers quantities already used in current order across all levels
   - **Error Messages**: Specific messages for material vs lot vs license plate validation

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

## Recent Enhancements (August 2025)

### Name Field Restructuring (CRITICAL UPDATE)
**Complete Migration from Single to Structured Name Fields**: Replaced single name fields with professional structured format for both recipient and billing information.

#### Database Schema Updates
**New Columns Added** (`alter_portal_orders_names.sql`):
- **Recipient Fields**: `recipient_title`, `recipient_first_name`, `recipient_last_name`, `recipient_company_name`
- **Billing Fields**: `billing_title`, `billing_first_name`, `billing_last_name`, `billing_company_name`
- **Backward Compatibility**: Original `recipient_name` and `account_name` fields preserved with `buildFullName()` helper

#### Address Data Interface Enhancement
```typescript
interface AddressData {
  title: string;           // NEW: Mr, Mrs, Ms, Dr, etc.
  firstName: string;       // NEW: First name
  lastName: string;        // NEW: Last name  
  companyName: string;     // NEW: Company name (optional)
  line1: string;          // Street address (Google Places)
  line2: string;          // Apt/Suite (manual entry)
  city: string;           // City (Google Places)
  state: string;          // State (Google Places) 
  zipCode: string;        // ZIP code (Google Places)
  country: string;        // Country (Google Places)
}
```

#### Google Places Name Preservation (CRITICAL FIX)
**Problem Solved**: Google Places was clearing manually entered name fields when address selected.
**Solution**: `useRef` pattern to preserve name values before Google Places execution.

```typescript
// Critical implementation pattern
const savedValuesRef = useRef<AddressData>(value);

useEffect(() => {
  savedValuesRef.current = value;
}, [value]);

const handlePlaceChanged = () => {
  const place = autocomplete.getPlace();
  if (place.address_components) {
    const savedValues = savedValuesRef.current; // Preserve names
    const newAddress: AddressData = {
      title: savedValues.title || '',           // Preserved
      firstName: savedValues.firstName || '',   // Preserved  
      lastName: savedValues.lastName || '',     // Preserved
      companyName: savedValues.companyName || '', // Preserved
      line1: `${streetNumber} ${route}`.trim(), // From Google Places
      city, state, zipCode, country             // From Google Places
    };
    onChange(newAddress);
  }
};
```

#### Form Layout Enhancement
**4-Field Grid System**: Professional name entry with responsive layout
```typescript
// Updated grid layout in AddressInput component
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <Select value={value.title || ''} onValueChange={(val) => updateField('title', val)}>
    {/* Title dropdown */}
  </Select>
  <Input placeholder="First Name" value={value.firstName || ''} 
         onChange={(e) => updateField('firstName', e.target.value)} />
  <Input placeholder="Last Name" value={value.lastName || ''} 
         onChange={(e) => updateField('lastName', e.target.value)} />
  <Input placeholder="Company (Optional)" value={value.companyName || ''} 
         onChange={(e) => updateField('companyName', e.target.value)} />
</div>
```

### Controlled Input Pattern Fix
**React Warning Resolution**: Fixed "controlled/uncontrolled input" warnings by ensuring all input values have `|| ''` fallbacks.

```typescript
// Fixed pattern applied throughout forms
<Input value={value.firstName || ''} /> // ✅ Always controlled
// Instead of:
<Input value={value.firstName} />       // ❌ Can be undefined
```

### Database Integration Improvements

#### UOM Optimization (Dual Storage/Display)
**Enhanced UOM Handling**: Save `shortname` for external systems while displaying full `name` to users.
```typescript
// Server action query enhancement
SELECT imu.name AS uom, imu.shortname AS uom_short
FROM wms_inventorymeasurementunits imu

// Usage in line items
uom: item.uomShort || item.uom  // Prioritize short name for storage
```

#### Reference Number Field Update  
**Field Rename**: Changed "Shipment Number" to "Reference Number (PO Number)" throughout system
- **UI Label**: Updated form label and validation
- **Database**: Updated queries to use `reference_number` column instead of `shipment_number`
- **Backward Compatibility**: Database accepts both field names

#### Country Code Standardization
**External System Compatibility**: Updated to use 2-letter country codes (e.g., "US") instead of full names ("United States")
```typescript
// Address data standardization
country: 'US' // Instead of 'United States'
```

### Form Validation Enhancements

#### Progressive Validation Logic
```typescript
const isStep1Valid = () => {
  const isRecipientAddressValid = isAddressValid(formData.recipientAddress);
  const isBillingAddressValid = isAddressValid(formData.billingAddress);
  
  return !!(
    formData.orderType && 
    formData.projectId && 
    // Name validation now handled by structured fields
    formData.recipientAddress.firstName && formData.recipientAddress.lastName &&
    isRecipientAddressValid &&
    formData.billingAddress.firstName && formData.billingAddress.lastName &&
    isBillingAddressValid &&
    formData.carrierId && 
    formData.carrierServiceTypeId
  );
};

const isAddressValid = (address: AddressData) => {
  return !!(address.line1 && address.city && address.state && address.zipCode);
};
```

### Files Modified in This Enhancement
- `src/components/dashboard/create-order-form.tsx`: Complete name field restructuring and Google Places fix
- `src/app/actions.ts`: Database schema updates, UOM optimization, `buildFullName()` helper
- `alter_portal_orders_names.sql`: Database migration script for new name columns
- `.github/copilot-instructions.md`: Updated with enhancement documentation
- `CLAUDE.md`: This file - comprehensive documentation update

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