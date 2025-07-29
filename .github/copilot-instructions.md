# Copilot Instructions for Reliable 3PL

## Architecture Overview

This is a **Next.js 15 + Firebase + PostgreSQL** logistics management platform with AI-powered insights. The project follows a modular architecture with clear separation between client/employee roles and AI-driven data analysis.

**Key Stack**: Next.js (App Router), Firebase Auth/Firestore, PostgreSQL, OpenAI AI, shadcn/ui, Tailwind CSS

## Development Workflow

```bash
# Development (runs on port 9002)
npm run dev

# Type checking (important - TS errors ignored in build)
npm run typecheck
```

## Code Standards

**All generated code must be in English:**
- Variable names, function names, and comments in English only
- User-facing text can be localized later
- Keep conversations in Spanish but code output in English

## Project Structure & Patterns

### App Router Structure
- `src/app/(auth)/` - Authentication pages (login)
- `src/app/client/` - Client-facing dashboard and features  
- `src/app/employee/` - Employee-facing tools and management
- `src/app/pending-access/` - Role-based access pending approval

### AI Architecture (OpenAI)
- **Implementation**: OpenAI GPT-4o for text-to-SQL and chat assistant features
- `src/lib/ai/` - OpenAI integration and logistics assistant
- `src/lib/ai/openai-client.ts` - OpenAI client configuration (optimized for performance)
- `src/lib/ai/logistics-assistant.ts` - Main AI logic for text-to-SQL conversion with role-based filtering
- `src/components/ai/shared-ai-assistant.tsx` - Shared UI component for both employee and client assistants
- `src/hooks/use-client-info.ts` - Hook to fetch owner_id from Firebase user profile
- `src/app/actions.ts` - Server actions that bridge UI to AI functions (employee + client versions)

**Critical Pattern**: 
- **OpenAI integration** uses direct API calls for superior text-to-SQL performance
- **Smart SQL generation** with ILIKE for partial matching and intelligent query building
- **Performance optimizations**: Database schema caching (30 min TTL), reduced token limits, optimized conversation history
- **Conversational Intelligence**: Distinguishes between data queries and casual conversation (greetings, introductions)
- **Chat Memory**: Short-term conversation context with "New Chat" reset functionality
- Environment variable: `OPENAI_API_KEY` required

**AI Performance Features**:
- **Schema Caching**: Database schema cached for 30 minutes to avoid repeated queries
- **Smart Response Classification**: Detects conversational vs data queries automatically
- **Context Management**: Maintains 4-message conversation history for natural follow-ups
- **Optimized Token Usage**: Reduced max_tokens for faster response times while maintaining quality

### Data Visualization Architecture (Recharts)
- **Implementation**: Recharts v2.15.1 for interactive data visualization in AI chat interfaces
- `src/components/ui/data-visualizer.tsx` - Core visualization component with 4 chart types
- **Chart Types**: Table, Bar Chart, Pie Chart, Line Chart with smart recommendations
- **Integration**: Embedded in both employee and client assistant interfaces

**Critical Visualization Patterns**:
- **Smart Chart Recommendations**: Automatic chart type suggestions based on data structure
- **Always-Visible Controls**: Chart type buttons visible from initialization, not conditional
- **Unified Color Palette**: Consistent `COLORS` array using primary brand colors (#0A183C theme)
- **Responsive Design**: Adapts to different screen sizes and data volumes
- **Data Handling**: Graceful handling of null/empty data with informative messages

**Visualization Features**:
- **Table View**: Default view for all data types with sortable columns
- **Bar Chart**: Recommended for categorical data, handles up to 20 items with angle rotation
- **Pie Chart**: Optimal for simple datasets (≤10 categories), auto-limits to prevent overcrowding
- **Line Chart**: Ideal for time-series data, detects date/time columns automatically
- **Smart Detection**: Analyzes data structure to recommend optimal visualization type
- **Context Preservation**: Maintains chart state while switching between conversation topics

**UI/UX Design Principles**:
- **No Visual Boundaries**: Removed Card backgrounds and borders for seamless integration
- **Simplified Controls**: Single-word button labels (Table/Bar/Pie/Line) for clean interface
- **Performance Optimized**: Efficient rendering with ResponsiveContainer and proper data limits

### Authentication & Authorization
- Firebase Auth with Google/Microsoft OAuth
- Role-based routing: `client`, `employee`, `none` (pending)
- `src/components/with-auth.tsx` - HOC for protected routes
- `src/context/auth-context.tsx` - Global auth state management

**Critical Security Pattern**: 
- **Employee vs Client Access**: Two distinct user types with different data access levels
- **`src/app/employee/assistant/`** - Full access to operational data and management tables
- **`src/app/client/assistant/`** - Limited access to client-specific data only
- **Future consideration**: May split into separate databases for enhanced security isolation

### Database Integration
- PostgreSQL connection via `src/lib/db.ts` using connection pooling
- Environment: `POSTGRES_URL` required
- Schema: Tables prefixed with `logistics_` (orders, shipments, etc.)
- AI queries specifically target tables starting with `logistics_`

**Critical Data Structure - logistics_orders Table**:
- **`project_name`**: Project subdivision within a customer (most customers have 1 project, some have multiple)
- **`owner_id`**: Customer/client ID (equivalent to "owner" in source MS SQL database)
- **`project_id`**: Project subdivision ID within the customer
- **Client Hierarchy**: Customer → Project → Orders (enables client-specific data filtering)

**Data Access Patterns**:
- **Employee queries**: Can access all `logistics_*` tables (operational data, analytics, management)
- **Client queries**: Must be filtered by `owner_id` and optionally `project_id` for client-specific data
- **Multi-project clients**: Some customers have multiple projects requiring project-level distinction
- **Security filtering**: Client AI assistant must filter all queries by authenticated user's `owner_id`

## Key Conventions

### Component Patterns
- **shadcn/ui components** in `src/components/ui/` - Use existing components, follow established patterns
- **Server components by default** - Use `'use client'` only when needed
- **Server actions** in `src/app/actions.ts` for AI integration

### Chat Assistant UI Architecture
- **Side-by-Side Layout**: Data visualization (left) + Chat interface (right)
- **Resizable Panels**: Drag handle with 20%-80% constraints, 50% default split
- **Fixed Height Strategy**: `calc(100vh - 144px)` prevents external page scrolling
- **Internal Scrolling Only**: Custom scrollbar styling, auto-scroll to new messages
- **Responsive Design**: Single chat panel on mobile, side-by-side on desktop (lg+)

**Critical Layout Patterns**:
- **Height Management**: Fixed container heights with `overflow-hidden` to prevent external scroll
- **Scroll Optimization**: Custom `.custom-scrollbar` class with ChatGPT-style appearance
- **Message Design**: User messages with gray background, assistant messages without background
- **Auto-scroll Behavior**: `messagesEndRef` with smooth scrolling to latest messages
- **Panel Resizing**: Mouse event handling with `useCallback` optimization and cursor management
- **Floating Controls**: New Chat button positioned absolutely (top-4 right-4 z-10) within chat panel

**Chat Interface Components**:
- `src/app/employee/assistant/page.tsx` - Full operational data access
- `src/app/client/assistant/page.tsx` - Client-restricted data access (identical UI)
- **Shared Layout Logic**: Both interfaces use identical resizable panel system
- **State Management**: `leftWidth`, `isResizing`, conversation history, and data visualization state

### ChatGPT-Style Sidebar Implementation (FINALIZED - DO NOT REGRESS)
**CRITICAL**: This sidebar implementation was perfected over multiple sessions and must be preserved exactly as implemented.

**Client Sidebar Architecture (`src/app/client/layout.tsx`)**:
- **Dynamic Logo Display**: Shows client's logo + name when expanded, client logo only when collapsed
- **Multi-line Name Support**: Client names display in full (removed `truncate`) across multiple lines if needed
- **Logo Hover Expand**: When collapsed, clicking client logo or hover shows expand arrow and triggers sidebar expansion
- **Custom Collapse Button**: Positioned absolutely at `-right-4` with `PanelLeftClose` icon in subtle gray (`text-gray-400 hover:text-gray-600`)

**Employee Sidebar Architecture (`src/app/employee/layout.tsx`)**:
- **Company Logo Display**: Shows "Reliable 3PL" logo + name when expanded, company logo only when collapsed  
- **Logo Hover Expand**: When collapsed, clicking company logo or hover shows expand arrow and triggers sidebar expansion
- **Custom Collapse Button**: Positioned absolutely at `-right-12` with `PanelLeftClose` icon in subtle gray (`text-gray-400 hover:text-gray-600`)

**Critical Sidebar Patterns (NEVER MODIFY)**:
1. **Custom Button Implementation**: Replaced default `SidebarTrigger` with custom HTML button elements for precise control
2. **Layout-Specific Positioning**: Client uses `-right-4`, Employee uses `-right-12` for optimal button placement
3. **Subtle Button Styling**: Gray buttons (`text-gray-400`) that don't compete visually with logo/text content
4. **Logo Interaction**: When collapsed, logo acts as expand button with hover overlay arrow effect
5. **Multi-line Text Support**: `items-start` alignment allows client names to wrap naturally without truncation
6. **Icon Consistency**: All collapse buttons use `PanelLeftClose` from Lucide React for semantic correctness

**Collapse/Expand Button Implementation**:
```tsx
<button 
  onClick={() => {
    const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
    trigger?.click();
  }}
  className="absolute -right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 hover:bg-gray-100 rounded-md z-10 flex items-center justify-center"
>
  <PanelLeftClose className="w-6 h-6 text-gray-400 hover:text-gray-600" />
</button>
```

**Logo Hover Expand Implementation (Collapsed State)**:
```tsx
<div className="relative group cursor-pointer">
  <Image /* or SVG for company logo */
    className="transition-opacity duration-200 group-hover:opacity-20"
    onClick={() => {
      const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
      trigger?.click();
    }}
  />
  {/* Expand arrow overlay */}
  <svg className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
    <path d="M3 12H21M21 12L17 8M21 12L17 16"/>
  </svg>
</div>
```

**Key Visual Hierarchy**:
- **Logo + Name**: Standard foreground color, prominent display
- **Collapse Button**: Subtle gray (`text-gray-400`), positioned edge of sidebar
- **Hover States**: Smooth transitions with opacity changes and color shifts
- **No Text Truncation**: Full client names displayed across multiple lines

**Responsive Behavior**:
- **Desktop**: Full sidebar with collapse/expand functionality
- **Mobile**: Hamburger menu in header (`SidebarTrigger` in `md:hidden` div)
- **Consistent Positioning**: Button positions work across different screen sizes

**DO NOT REGRESS WARNING**: 
- This implementation took multiple sessions to perfect
- Positioning values (`-right-4`, `-right-12`) are specific to each layout
- Custom button approach is required for proper icon sizing and control
- Gray color scheme maintains visual hierarchy
- Logo hover behavior provides intuitive expand functionality

### ChatGPT-Style UI Implementation (CRITICAL - DO NOT MODIFY)
**IMPORTANT**: These UI patterns were refined over multiple sessions and must be preserved exactly as implemented.

**Message Layout & Design**:
- **No Message Icons**: All message icons removed for clean ChatGPT-like appearance
- **No Chat Headers**: All header sections eliminated for seamless flow
- **User Message Bubbles**: `max-w-[80%]` width with `bg-gray-100` background and `rounded-lg`
- **Assistant Message Expansion**: `w-full` width (spans entire chat area), no background
- **Message Text**: `text-sm leading-relaxed` for optimal readability matching ChatGPT spacing
- **No Visual Borders**: All card backgrounds and borders removed for unified canvas effect

**Title & Section Management**:
- **No Section Titles**: "AI Assistant" and "Data Visualization" titles completely removed
- **Visualization Controls in Header**: Chart type buttons moved to resizable panel headers
- **Clean Navigation**: Only essential controls visible, no redundant labeling

**Scroll & Layout Behavior**:
- **Fixed Height Container**: `calc(100vh - 144px)` prevents external page scrolling
- **Internal Scrolling Only**: Custom `.custom-scrollbar` class with ChatGPT-style appearance
- **Auto-scroll to Latest**: `messagesEndRef` with smooth scrolling behavior
- **Fade-out Effect**: New Chat button has gradient overlay for seamless integration

**Input Field Styling**:
- **No Focus Borders**: `focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-300 focus-visible:outline-none`
- **Clean Input**: Removes all focus rings and outline borders for minimal appearance

**SQL Query Display**:
- **Discrete Technical Info**: `text-[10px] text-gray-600 font-mono` (smaller than normal text)
- **Bordered Container**: `bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3`
- **Simple Format**: "SQL: {query}" without icons or complex headers
- **Purpose**: Technical reference for developers, minimal visual impact for end users

**Data Visualization Responsiveness**:
- **Full Height Charts**: All charts use `height="100%"` instead of fixed `height={400}`
- **Responsive Container**: `h-full flex flex-col` with `flex-1 min-h-0` for chart area
- **Adaptive to Screen Size**: Charts expand/contract based on available vertical space
- **Consistent with Chat**: Both visualization and chat areas are equally responsive

**Loading State Consistency**:
- **Full Width Loading**: Loading messages use `w-full` to match assistant response width
- **Consistent Styling**: `text-sm leading-relaxed` applied to loading text

### Styling & Design
- **Colors**: Primary `#0A183C` (dark blue), Background `#FAFBFD`, Accent `#F3F4F6`
- **Fonts**: Headlines use `Space Grotesk`, body text uses `Inter`
- **Icons**: Exclusively `lucide-react` for consistency
- **Components**: Built with Radix UI primitives + Tailwind CSS

### AI Development Strategy
- **All AI features**: Implemented with OpenAI API for superior text-to-SQL performance
- **Text-to-SQL**: Uses intelligent ILIKE patterns for partial matching
- **Client Data Filtering**: All client AI queries automatically include `WHERE owner_id = [authenticated_user_owner_id]`
- **Project Context**: AI understands project_name as subdivision of customer for multi-project scenarios
- **Chat Assistant**: Conversational AI with business context understanding and memory
- **Performance-First**: Optimized for fast response times with caching and efficient token usage
- **Architecture**: All AI integrations centralized in `src/lib/ai/`

**AI Data Context Instructions**:
- **Customer vs Project distinction**: AI understands that some customers have multiple projects
- **owner_id filtering**: Implemented for client AI assistant data security with automatic filtering
- **project_name context**: Used for clarifying project-specific queries when customer has multiple projects
- **Data hierarchy**: Customer (owner_id) → Project (project_id, project_name) → Orders/Shipments

**AI Conversation Features**:
- **Dual-Mode Processing**: Automatically detects data queries vs casual conversation
- **Natural Language**: Handles greetings, introductions, and follow-up questions naturally
- **Context Awareness**: Remembers conversation within chat session, understands "those", "them", etc.
- **Memory Management**: Session-based memory with "New Chat" reset functionality

**Role-Based AI Access** (IMPLEMENTED):
- **Employee AI Assistant**: Access to all operational data, analytics, and management insights
- **Client AI Assistant**: Restricted to client-specific data queries filtered by `owner_id` and optionally `project_id`
- **Shared UI Component**: Both assistants use `src/components/ai/shared-ai-assistant.tsx` with role-specific logic injection
- **Security Implementation**: Client assistant automatically filters all queries by authenticated user's `owner_id`
- **Firebase Integration**: `use-client-info.ts` hook retrieves owner_id from user profile through client document
- **Server Actions**: Separate functions `getAiInsightOpenAI()` (employee) and `getAiInsightOpenAIClient()` (client with filtering)

## Critical File Implementations (DO NOT REGRESS)

### Chat UI Components (FINALIZED AFTER 4+ HOURS OF REFINEMENT)
**`src/components/ai/shared-ai-assistant.tsx`** - Main chat interface with ChatGPT-style design:
- **Message width logic**: User messages `max-w-[80%]`, assistant messages `w-full`
- **No titles or headers**: Completely removed for clean appearance
- **Input styling**: `focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-300 focus-visible:outline-none`
- **SQL query styling**: `text-[10px] text-gray-600 font-mono bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3`
- **Message text**: `text-sm leading-relaxed` for proper line spacing
- **Loading state**: `w-full` width to match assistant responses

**`src/components/ui/data-visualizer.tsx`** - Responsive data visualization:
- **Container structure**: `h-full flex flex-col` with `flex-1 min-h-0` for chart area
- **Chart responsiveness**: ALL charts use `height="100%"` instead of fixed heights
- **Error states**: All error messages use `h-full` instead of `h-64`
- **Adaptive charts**: ResponsiveContainer ensures charts scale with available space

### UI Architecture Patterns (NEVER MODIFY THESE)
1. **Side-by-side layout**: Data visualization (left) + Chat (right) with resizable handle
2. **Fixed height strategy**: `calc(100vh - 144px)` prevents external scrolling
3. **Chart type buttons**: Located in visualization panel header, NOT inside DataVisualizer component
4. **New Chat button**: Positioned absolutely `top-4 right-4 z-10` with fade gradient
5. **Scroll behavior**: Internal scrolling only with custom scrollbar styling

## Environment Setup

Required environment variables:
```bash
POSTGRES_URL=postgresql://...
OPENAI_API_KEY=your_openai_api_key
```

Firebase config is hardcoded in `src/lib/firebase/config.ts` for the `synapse3pl` project.

## Testing Strategy

### AI Chat Assistant Testing
- **Real Integration Testing**: No mocks - direct OpenAI API and PostgreSQL testing
- **Jest Configuration**: TypeScript support with ts-jest preset
- **Test Categories**: Conversational detection, SQL generation, context handling, performance, edge cases
- **33 Automated Test Cases**: Comprehensive coverage of all chat scenarios

**Testing Files Structure**:
- `__tests__/ai/chat-test-cases.ts` - All test case definitions (33 scenarios)
- `__tests__/ai/chat-assistant.test.ts` - Jest automated test runner (CI/CD ready)
- `__tests__/ai/manual-testing.ts` - Manual testing utilities for debugging

**Testing Commands**:
```bash
# Run full AI chat test suite
npm run test:chat

# Run tests in watch mode
npm run test:watch

# Run specific test category manually
await runTestsByType('conversational')
await runTestsByType('data-query')

# Debug single test case
await runSingleTest('data-001')
```

**Test Environment Setup**:
- Environment variables loaded from `.env` file
- Custom Jest configuration in `jest.config.js`
- Real OpenAI API calls with actual database queries
- Performance validation (< 15-20 seconds response time)

**Testing Principles**:
- **No Mocks Policy**: Real integration testing ensures production reliability
- **Comprehensive Coverage**: Tests conversational vs data query detection
- **SQL Validation**: Verifies correct ILIKE patterns, exact matching, and intelligent query building
- **Context Testing**: Validates conversation memory and follow-up question handling
- **Regression Prevention**: Critical business logic tests for customer matching, warehouse queries, etc.

## Critical Development Notes

**CHAT UI - DO NOT REGRESS WARNING**: 
- The ChatGPT-style UI implementation took 4+ hours of refinement across multiple sessions
- All ChatGPT-style patterns documented above are FINAL and must never be reverted
- If chat UI needs modification, consult the "ChatGPT-Style UI Implementation" section first
- Any changes to message layout, input styling, or visualization responsiveness require explicit user approval

- **TypeScript errors are ignored in builds** (`ignoreBuildErrors: true`)
- **Development server runs on port 9002** (not 3000)
- **Firebase Studio compatibility** - Project designed to work in both environments
- **AI text-to-SQL** currently uses OpenAI for better SQL generation
- **Role-based routing** handles client vs employee access automatically
- **Database schema discovery** happens dynamically for AI queries with 30-minute caching
- **AI Performance**: Optimized for speed with schema caching, reduced tokens, and efficient conversation handling
- **Code Language**: All code, comments, and variable names must be in English
- **Testing Required**: All AI features must be tested with real integration tests before deployment

### Chat Scroll Implementation (SOLVED)
- **Fixed Height Strategy**: Use `calc(100vh - 144px)` for main container to prevent external scroll (proven working value)
- **Internal Scroll Only**: Chat messages scroll internally with custom scrollbar styling
- **Layout Hierarchy**: Container → Panels (full height) → Content (scrollable)
- **Critical Dimensions**: 144px accounts for layout padding and browser chrome (value confirmed through testing)
- **Floating Controls**: New Chat button positioned absolutely within chat area (top-4 right-4 z-10)
- **Responsive Behavior**: Maintains fixed height across all screen sizes and content lengths
- **Auto-scroll**: Smooth scrolling to new messages with `messagesEndRef.scrollIntoView()`

## Integration Points

- **Firebase Auth** → Firestore user profiles → Role-based app routing
- **PostgreSQL** → AI flows → Natural language insights
- **OpenAI API** → Server actions → Client components (text-to-SQL)
- **shadcn/ui** → Custom styling → Consistent design system

## Documentation Maintenance

**IMPORTANT**: After implementing major changes or new features:
1. **User confirms successful implementation** - User will indicate when new implementation is working successfully
2. **Update this instruction file** - GitHub Copilot must update this `copilot-instructions.md` file to reflect:
   - New architecture patterns implemented
   - New file structures or important files added  
   - New testing strategies or configurations
   - New environment variables or setup requirements
   - New integration points or workflows
   - Updated development commands or procedures
3. **Keep documentation current** - This ensures all future development follows the latest established patterns and configurations

**Documentation Update Triggers**:
- Major new features (AI capabilities, authentication changes, new app sections)
- Architecture modifications (new patterns, file reorganization)
- Testing strategy changes (new test types, configurations)
- Environment or deployment changes
- Integration of new third-party services or APIs

**Recent Major Updates (July 29, 2025)**:
- **ChatGPT-Style Sidebar Implementation**: Complete sidebar redesign with collapse/expand functionality
  - Custom collapse buttons using `PanelLeftClose` icon with subtle gray styling (`text-gray-400 hover:text-gray-600`)
  - Logo-as-button functionality when collapsed with hover expand arrow overlay
  - Layout-specific positioning: Client (`-right-4`), Employee (`-right-12`) for optimal button placement
  - Multi-line client name support without truncation for full name display
  - Custom button implementation replacing `SidebarTrigger` for better control and sizing
  - Hover states with smooth opacity transitions and visual hierarchy
- **ChatGPT-Style UI Transformation**: Complete redesign of chat interface to match ChatGPT appearance
  - Removed all titles, headers, and visual borders for unified canvas effect
  - Implemented user message bubbles (max-w-[80%]) vs assistant full-width responses (w-full)
  - Added leading-relaxed spacing for better readability
  - Eliminated message icons and card backgrounds
  - Created discrete SQL query display with proper technical formatting
- **Responsive Data Visualization**: Charts now adapt to screen height dynamically
  - Changed all charts from fixed height={400} to height="100%" 
  - Implemented h-full flex flex-col container structure
  - Error states and empty states now use full available height
- **Input Field Refinements**: Removed all focus borders and rings for clean appearance
- **Chart Type Controls**: Moved visualization buttons to panel headers for better organization
- **Performance Optimizations**: Custom scrollbars, auto-scroll, and responsive design
- **Client AI Assistant Security**: Implemented complete owner_id-based filtering for client data isolation
- **Shared Component Architecture**: Zero-duplication AI assistant UI with role-specific backend logic injection

## Pending Implementations

**Database Schema Enhancements**:
- **Day of Week Column**: Add new column to transform/display day of the week (Monday, Tuesday, Wednesday, etc.) for date-based analytics and weekly pattern analysis. This will enable queries like "What day of the week has the most shipments?" or "Show me order patterns by day of week".

**Data Visualization Enhancements**:
- **Scatter Plot Chart Type**: Add scatter plot visualization to DataVisualizer component for correlation analysis between two numeric variables. Ideal for queries like "What's the relationship between shipment weight and shipping cost?" or "How does shipping distance relate to delivery time?". Implementation would require:
  - New `ViewType` option: `'scatter'`
  - Smart detection for exactly 2 numeric columns
  - Recharts ScatterChart component integration
  - Automatic recommendation when data has 2 numeric + 0-1 label columns
  - XAxis and YAxis mapping for the two numeric variables
  - Tooltip showing both X and Y values with labels

**AI Chat Assistant Improvements**:
- **Date/Time Context**: Add current date and year awareness to chat assistant. Currently the AI thinks it's 2024, but we're in 2025. Need to inject current date context (July 29, 2025) into AI prompts to ensure accurate temporal references in data queries and responses.

This documentation maintenance ensures consistency across development sessions and preserves institutional knowledge about project patterns and decisions.