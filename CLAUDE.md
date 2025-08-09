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
3. For client role: Client document retrieved from `clients` collection containing `project_ids` array
4. `project_ids` array is used for all database filtering and access control

**Role System**:
- `employee`: Full access to all operational data and management
- `client`: Limited to project-specific data with automatic `project_ids` filtering
- `none`: Pending approval state

**Critical Data Flow**:
```
Firebase Auth → users/{uid}.clientId → clients/{clientId}.project_ids → Multi-project database filtering
```

**Multi-Project Security Model (Updated August 2025)**:
- **Firebase Schema**: `clients/{clientId}.project_ids: number[]` - Array of allowed project IDs
- **Backward Compatibility**: Supports legacy `owner_id` field as fallback
- **Security Validation**: All server actions validate that requested `projectId` is in allowed `project_ids` array
- **Database Filtering**: Uses PostgreSQL `WHERE id = ANY($1)` for efficient multi-project queries

**Key Files**:
- `src/context/auth-context.tsx`: Global auth state with clientInfo containing project_ids
- `src/hooks/use-client-info.ts`: Retrieves project_ids from Firebase chain with owner_id fallback
- `src/components/with-auth.tsx`: HOC wrapper for role-based access control

**Security Pattern**: All client database queries MUST validate project access using `project_ids` array filtering.

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
  - Client: Uses `project_ids` array filtering for multi-project data access
  - Employee: Full access to all operational data (no filtering)
  - Shared metrics cards, charts, and active orders sections

- **SharedReportsPage** (`src/components/dashboard/shared-reports-page.tsx`): Unified reports interface
  - Client: 20+ client-specific reports with multi-project filtering
  - Employee: 5-50 reports with configurable access levels
  - Shared MaterialsTable, header controls, and export functionality

- **SharedAssistantPage** (`src/components/dashboard/shared-assistant-page.tsx`): Unified AI assistant interface
  - Client: Loading/error states with project validation and filtered queries
  - Employee: Direct access without additional validation
  - Shared AI chat interface with role-appropriate data access

### Hook Architecture & Data Fetching Patterns

**Factory Pattern Implementation**: Centralized data fetching logic to eliminate code duplication.

**Core Data Fetching Hook**: `src/hooks/use-data-fetcher.ts` - Generic factory hook providing consistent loading, error, and refetch patterns.

**Multi-Project Hook Patterns (Updated August 2025)**:

**Standard useDataFetcher Pattern** (for owner-based filtering):
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

**Multi-Project Custom Pattern** (for project array filtering):
```typescript
export function useProjectsForOrders(projectIds: number[] | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!projectIds || projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProjectsForOrders(projectIds);
        setProjects(result);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [projectIds]);

  return { projects, loading, error, refetch };
}
```

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

### Hook Architecture Updates

**Key Hooks Updated for Multi-Project Support**:
- `useClientInfo()`: Returns `{ ownerId, projectIds }` with backward compatibility
- `useProjectsForOrders(projectIds)`: Custom implementation for project array filtering
- `useOutboundInventory(ownerId, projectIds, selectedProjectId?)`: Multi-project inventory access
- `useMaterialLots(ownerId, materialCode, projectIds, selectedProjectId?)`: Project-filtered lot access
- `useLicensePlates(ownerId, materialCode, projectIds, selectedProjectId?, lotCode?)`: Project-filtered license plate access

### Create Order Form Integration

**Project Selection Workflow**:
1. **Project Dropdown**: Shows only projects from client's allowed `project_ids` array
2. **Material Filtering**: Materials load based on `projectIds` array with optional `selectedProjectId` filtering
3. **Inventory Validation**: Lot/license plate selection validates against both `projectIds` and selected project
4. **Security**: All inventory queries include project access validation

### Key Benefits

- ✅ **Granular Access**: Clients can access multiple specific projects instead of single owner-based access
- ✅ **Enhanced Security**: All queries validate project access before execution
- ✅ **Backward Compatibility**: Supports legacy `owner_id` based access
- ✅ **Performance**: Efficient PostgreSQL array queries with `ANY()` operator
- ✅ **Scalability**: Easy to add/remove project access per client

### Migration Strategy

**For existing clients**:
1. `useClientInfo` automatically converts single `owner_id` to `[owner_id]` array
2. Legacy server actions continue working with single-project arrays
3. Firebase can be updated gradually from `owner_id` to `project_ids`

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

### Create Order Form Layout Optimizations (August 2025)
**Enhanced Field Organization**: Improved layout spacing and field grouping for better usability and professional appearance.

#### Form Layout Improvements
**Name Fields Reorganization**:
- **3-Column Layout**: Title, First Name, Last Name in same row (`grid-cols-3`)
- **Dedicated Company Line**: Company Name moved to separate full-width row for long company names
- **Improved UX**: Better space utilization and visual hierarchy

**Address Fields Optimization**:
- **Address Lines**: Line 1 and Line 2 now share same row (`grid-cols-2`) for better space efficiency
- **City/State/ZIP**: Maintained existing 3-column layout for optimal desktop display
- **Google Places Integration**: Preserved all functionality while improving layout

**Order Information Grid Enhancement**:
- **4-Column Layout**: Order Type, Project, Order Number, Reference Number all in same row
- **Horizontal Space Optimization**: Better use of screen real estate on wider displays
- **Consistent Spacing**: Uniform gap-4 spacing across all grid sections

#### Layout Benefits
- ✅ **Better Space Utilization**: More efficient use of horizontal space
- ✅ **Visual Hierarchy**: Clear grouping of related fields
- ✅ **Professional Appearance**: Cleaner, more organized form layout
- ✅ **Responsive Design**: Maintains mobile-first approach with collapsible layouts
- ✅ **Company Name Support**: Dedicated full-width row for long business names

#### Technical Implementation
```typescript
// Name fields: 3-column grid for personal info
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  {/* Title, First Name, Last Name */}
</div>

// Company: Full-width row
<div className="space-y-2">
  {/* Company Name field */}
</div>

// Address lines: 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {/* Line 1, Line 2 */}
</div>

// Order info: 4-column grid
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Order Type, Project, Order Number, Reference Number */}
</div>
```

### Files Modified in This Enhancement
- `src/components/dashboard/create-order-form.tsx`: Layout optimizations and field reorganization
- `src/app/actions.ts`: Database schema updates, UOM optimization, `buildFullName()` helper
- `alter_portal_orders_names.sql`: Database migration script for new name columns
- `.github/copilot-instructions.md`: Updated with enhancement documentation
- `CLAUDE.md`: This file - comprehensive documentation update

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

## Active Orders Status System (Added August 2025)

**Multi-Table Status Management**: Comprehensive status tracking system combining portal orders with WMS operations data, featuring real-time auto-refresh capabilities.

### Status Flow Architecture

**Status Sources & Data Flow**:
- **Portal Orders Table** (`portal_orders.status`): Pre-WMS order lifecycle
  - `'draft'` → "Draft" (Gray) - Order saved but editable
  - `'submitted'` → "Submitted" (Blue) - Ready for ETL processing  
  - `'failed'` → "Failed" (Red) - ETL processing failed
  - `'created'` → Not displayed (successfully handed to WMS)

- **Operations Active Orders Table** (`operations_active_orders`): WMS operational statuses
  - `order_status_id = 1` → "Created" (Green) - Successfully created in WMS
  - `order_status_id = 2` → "Picking" (Yellow) - Being picked/processed
  - `order_status_id = 4` + no delivery_status → "Shipped" (Purple) - Left warehouse
  - `order_status_id = 4` + delivery_status 'in transit' → "In Transit" (Orange) - En route
  - `order_status_id = 8` → Excluded (Cancelled - never shown)
  - delivery_status 'delivered' → Excluded (Delivered - never shown)

### SQL Implementation Strategy

**Multi-Table UNION Query**:
```sql
-- Portal orders (not yet in WMS)  
SELECT order_number, status as display_status, ...
FROM portal_orders WHERE owner_id = $1 AND status IN ('draft', 'submitted', 'failed')

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

ORDER BY order_number ASC  -- Sequential order for processing priority
```

### Real-Time Auto-Refresh System

**TanStack React Query Integration**: Smart polling with battery-optimized page visibility detection.

#### Core Implementation Files:
- `src/context/query-context.tsx` - QueryClient provider with optimized defaults
- `src/hooks/use-active-orders.ts` - React Query implementation with smart polling
- `src/app/layout.tsx` - QueryProvider integration

#### Smart Polling Configuration:
```typescript
// useActiveOrders hook with intelligent polling
const { data: activeOrders, isLoading, error, refetch } = useQuery({
  queryKey: ['activeOrders', ownerId],
  queryFn: () => getActiveOrders(ownerId!),
  enabled: ownerId !== null,
  refetchInterval: isVisible ? 30 * 1000 : false,  // 30s when visible, pause when hidden
  staleTime: 25 * 1000,  // Consider data fresh for 25 seconds
  refetchOnWindowFocus: true,  // Immediate refresh when returning to tab
  refetchIntervalInBackground: false,  // Battery optimization
});

// Page Visibility API integration for battery efficiency
const [isVisible, setIsVisible] = useState(true);
useEffect(() => {
  const handleVisibilityChange = () => {
    setIsVisible(document.visibilityState === 'visible');
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

#### Auto-Refresh Features:
- ✅ **30-second polling** when tab is active and visible
- ✅ **Automatic pause** when tab is hidden or backgrounded
- ✅ **Instant resume** when user returns to tab  
- ✅ **Window focus refetch** for immediate updates
- ✅ **Network reconnection handling** with automatic retry
- ✅ **Smart caching** prevents duplicate requests
- ✅ **Battery optimization** through page visibility detection

### UI/UX Implementation

**Professional Status Badge System**:
```typescript
// Unique color palette for each status
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

// Title Case formatting for professional appearance
<Badge className={getStatusColor(order.display_status)}>
  {order.display_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
</Badge>
```

**Order Prioritization**:
- Orders sorted by `order_number ASC` (oldest orders appear first)
- Lower order numbers = older orders = higher priority for processing attention

### Performance Impact Analysis

**Resource Usage (Measured)**:
- **Individual User**: ~350KB/hour additional bandwidth (negligible)
- **50 Concurrent Users**: ~17MB/hour total server load
- **Database Impact**: ~100 additional simple queries/minute (lightweight)
- **Battery Impact**: Minimal due to page visibility optimization

**Optimization Strategies**:
- Page visibility detection prevents background polling
- Smart caching reduces redundant requests
- Stale-while-revalidate pattern for instant UI updates
- Automatic retry with exponential backoff

### Key Integration Files

**Server-Side**:
- `src/app/actions.ts` - `getActiveOrders()` with multi-table UNION logic

**Client-Side**:
- `src/hooks/use-active-orders.ts` - React Query implementation with smart polling
- `src/components/dashboard/shared-dashboard-page.tsx` - Status display with color system

**Context & Configuration**:
- `src/context/query-context.tsx` - TanStack Query provider setup
- `src/app/layout.tsx` - Application-level QueryProvider integration

### Benefits Delivered

- ✅ **Seamless UX**: Status changes appear automatically within 30 seconds
- ✅ **No Manual Actions**: Eliminates need for manual page refresh
- ✅ **Battery Efficient**: Smart pausing in inactive tabs
- ✅ **Professional Design**: Title Case formatting with unique colors
- ✅ **Minimal Overhead**: Negligible impact on performance and data usage
- ✅ **Resilient**: Automatic error handling and network reconnection

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

## Create Order – Validation, Order Type Locking & New Order Workflow (August 2025)

This section codifies the finalized UX / logic rules for the Create Order form to prevent regressions.

### Core Principles
- Minimize cognitive load: surface only the specific field causing a blocking validation error.
- Preserve numbering integrity: once an order number is issued it must never silently change.
- Protect data consistency: prevent mid‑stream semantic pivots (changing order type after materials / persistence).
- Provide a frictionless restart path (New Order) with safe‑guarding of meaningful unsaved work.

### Order Type Single-Field Validation
1. When user clicks Save (draft or submit) and `orderType` is missing, only the Order Type field is marked in error.
2. Other Step 1 required fields are NOT highlighted in this scenario (prevents “wall of red”).
3. Implementation flag: `orderTypeErrorOnly` (local state) controls isolated highlighting.
4. Clearing / selecting an Order Type resets `orderTypeErrorOnly` immediately.

### Locking Rules for Order Type
Order Type becomes immutable (select disabled + helper text) when ANY of the following are true:
- An `orderNumber` has been generated (first successful save).
- At least one material line has been added.
- Status is no longer `draft` (e.g. `submitted`).

Rationale: Changing type would imply a different numbering prefix and potentially different downstream handling; regeneration after partial data entry risks mismatched semantics.

### Order Number Policy
- Generated server-side only when absent on first CREATE.
- Never regenerated client-side after initial assignment.
- UI must not strip / replace prefix if Order Type were hypothetically toggled before lock (guarded by lock anyway).
- Visual emphasis (temporary highlight) allowed when number first appears or on initial save event.

### New Order Button & Reset Workflow
Global button injected via header context provides a controlled reset:
1. Detect “trivial” state (only Order Type selected and NOTHING else materially filled) → reset silently (no dialog).
2. Otherwise show confirmation dialog (unsaved changes guard).
3. On confirm: call `resetToNewOrder()` → restore pristine initial form object, clear `orderNumber`, unlock Order Type, clear materials, reset step to 1.
4. Hash/dirty tracking recalculated post-reset so subsequent navigation behaves as a fresh session.

### Helper Functions / Flags (Client Form Component)
- `orderTypeErrorOnly`: Gates isolated field error rendering.
- `resetToNewOrder()`: Central reset routine – keep implementation idempotent.
- `isOnlyOrderTypeSelected()`: Determines dialog necessity.
- Lock predicate consolidated for clarity (avoid scattering logic expressions across JSX).

### UX Copy / Helper Text
- When locked: concise helper text e.g. “Order Type locked after first save/materials.” (No exclamation marks; retain professional tone.)
- Error toast messaging remains specific for other validation domains (materials, quantity, inventory) – do not conflate with Order Type logic.

### Do / Don’t
| Do | Don’t |
| --- | --- |
| Keep future enhancements (e.g. copy order number) additive & non-invasive | Regenerate order number after first assignment |
| Centralize lock condition evaluation | Duplicate lock checks inline multiple times |
| Maintain single source of truth for reset initial state | Partially mutate old state objects on reset |
| Expand tests (future) to assert lock invariants | Allow silent type mutation post-save |

### Extension Hooks (Future Friendly)
- If a future requirement adds “Clone Order”: reuse the same reset pattern but pre-seed selective fields (NEVER reuse existing `orderNumber`).
- If multi‑type transformation ever becomes a feature, require explicit server action performing archival + new order creation rather than in-place mutation.

### Regression Checklist (Quick)
Before merging changes touching create-order-form logic verify:
- [ ] `orderTypeErrorOnly` still isolates validation.
- [ ] Lock predicate unchanged or intentionally revised with docs updated.
- [ ] New Order reset clears materials & number and unlocks type.
- [ ] No code path calls server to regenerate existing order number.
- [ ] Confirmation dialog logic matches trivial vs meaningful change criteria.

### Rationale Summary
Focused validation + deterministic locking eliminates confusion, preserves auditability, and keeps the mental model simple: “Choose type first, save once, proceed; use New Order to start over.”

### Additional Create Order UX Details (Aug 8 2025 Addendum)
Not previously captured but implemented in code during the same work window.

| Feature | Implementation | Notes |
| ------- | -------------- | ----- |
| Multi-Step "Save as Draft" | Save button present on Steps 1–3 | Allows persistence before completion of later steps; identical server action, status='draft' |
| Inline Save Message | `inlineSaveMessage` state renders left-aligned subtle confirmation text | Auto-clears with timeout; reused for order type change hint |
| Order Number Highlight | `highlightOrderNumber` triggers transient ring + pulse (≈1.8s) on first assignment | Emphasis only on initial generation or first save event |
| Pre-Lock Type Change Notice | Inline message: "Order type changed — number will generate on save" | Clears automatically after timeout |
| Draft Save Disable Logic | Disabled until form considered dirty beyond pristine baseline | Prevents creating empty shell drafts |
| Hash/Dirtiness Handling | Baseline recalculated after reset & successful saves where appropriate | Maintains accurate unsaved change prompts |

Guideline: Avoid stacking toasts for routine draft saves—inline confirmation keeps signal low-noise.

## Dashboard Visual Refresh & Status Chip Harmonization (August 2025)

Recent UI/UX changes to the shared dashboard not yet previously documented.

### Goals
- Unify visual language across portal + WMS statuses (tinted chips with subtle borders).
- Improve information density (fewer line wraps, inline meta on wide screens).
- Provide clear affordances for allowed actions (Edit/Delete) while staying low-noise.
- Modernize metric cards (gradient accent bars, consistent spacing, skeleton loading states).

### Metric Cards
- Added 1px height gradient bars (top) with multi‑stop brand gradients per card.
- Loading state: skeleton placeholders (height matches number text) instead of spinners.
- Dynamic numbers fallback to representative demo scale for employee role when no data yet.

### Active Orders Section
- Converted into `Collapsible` with header row summarizing live vs failed counts.
- Live statuses grouped first: created, picking, shipped, in_transit/in transit.
- Sorting: live statuses first (original relative order) then non-live (draft, submitted, failed) to surface operational items.
- Row layout:
  - Row 1: Order Number (link) • Customer • Destination • Carrier/Service | Status + actions.
  - Row 2: Pickup Date • ETA • (Mobile) Destination + Customer + Carrier.
- Responsive truncation: long customer/destination strings truncated with max-width utilities.
- Status editing: Edit & Delete buttons only for portal-sourced orders in `draft` or `failed`.
- View details opens route-driven modal (Dialog) using `?view=ORDER_NUMBER` param (state preserving, no full reload).

### Status Chip Harmonized Palette
New tinted background + subtle border scheme replacing prior solid color badges.

| Status | Classes (Light) | Intent |
| ------ | ---------------- | ------ |
| draft | foreground/5 tint, muted text, subtle border | Neutral pre-processing |
| submitted | slate-500/10 bg + slate text | Queued / pending ETL |
| failed | rose-500/10 bg + rose text | Error state, action required |
| created | blue-500/10 bg + blue text | Successfully created in WMS |
| picking | indigo-500/10 bg + indigo text | Active warehouse processing |
| shipped | violet-500/10 bg + violet text | Left facility (no delivery status) |
| in_transit | sky-500/10 bg + sky text | En route (carrier progress) |
| legacy (processing / picked_up / ready_for_pickup / pending) | Mapped to nearest above palette for backwards compatibility |

Implementation helper: `getStatusColor(status: string)` centralizes class selection (tinted bg + text + border classes for both light/dark themes) in `shared-dashboard-page.tsx`.

### Action Buttons Logic
- Delete: visible only when `source_table === 'portal'` AND status in (`draft`,`failed`). AlertDialog confirms irreversible removal.
- Edit: same visibility predicate; navigates to `/client/orders?edit=ORDER_NUMBER`.
- View: ghost icon button; hidden on small screens in Row 1 and shown in Row 2 for mobile density.

### Accessibility / Usability
- Buttons have `title` attributes for tooltips.
- Status badges use Title Case transformation and underscore replacement.
- Non-interactive chips set `cursor-default select-none` to avoid implying action.

### Dialog-Based Order Details
- Modal triggered by presence of `view` search param.
- Closing dialog rewrites URL back to `/client` without scroll reset (`router.push('/client', { scroll: false })`).
- Preserves dashboard scroll position and loaded data cache.

### Skeleton Loading Strategy
- Applies to metric cards and active orders list (3 placeholder rows) using height-matched skeleton blocks.
- Reduces layout shift by reserving approximate content height.

### Theming & Dark Mode
- All chips include dual light/dark class sets (`dark:bg-* dark:text-* dark:border-*`).
- Gradient bars include dark-mode adjusted stops where needed.

### Migration Notes
- Older documentation referencing distinct flat color fills (gray/blue/green/yellow/purple/orange) is superseded by tinted palette.
- Ensure future status additions extend `getStatusColor` and maintain tint/border/text triad.

### Regression Checklist (Visual Refresh)
- [ ] Status chips display consistent border + tint in both themes.
- [ ] Edit/Delete absent for non-portal or non-draft/failed statuses.
- [ ] Live statuses appear before others.
- [ ] Dialog closes without page flash or scroll jump.
- [ ] Truncation does not clip essential interactive elements.

### Rationale
Tinted chips improve contrast while reducing visual overstimulation. Grouping operational statuses first enhances scannability for time-sensitive monitoring.

### Minor UI Enhancements (Aug 8 2025 – Non‑Critical)
These refinements are cosmetic/ergonomic and now documented for completeness.

| Feature | Description | Implementation Notes |
| ------- | ----------- | -------------------- |
| Dialog Backdrop Blur | Order details (route-driven Dialog) uses semi-transparent blurred backdrop for depth separation | Tailwind + backdrop-blur utility; ensure performance acceptable (small overlay area) |
| AI Assistant 60/40 Split | Chat layout adjusted to ~60% conversation / 40% visual/content pane for better data viz space | Applied responsive flex-basis; maintain mobile 100% stack |
| Dark Mode Card Brightness Adjustment | Card backgrounds lightened slightly (from earlier darker shade) to improve contrast against page background | Tailwind custom theme tokens updated; maintain WCAG contrast for text |
| Divider Enhancements | Subtle divider lines (e.g., between Shipping & Billing in form) add structural clarity | Use muted border color with opacity to avoid visual noise |
| Removed Redundant Summary Block (AI Table Mode) | Eliminated duplicate “summary” when table is sole visualization | Reduces vertical scroll; logic: skip summary if output already tabular |

Guidelines:
- Keep blur usage sparing—only for high-focus modals (order details) to avoid cumulative GPU overhead.
- Preserve 60/40 split only on ≥ lg breakpoints; fall back to single column on small screens.
- Re-test card contrast if brand palette adjusts; target ≥ 4.5:1 for primary text.
