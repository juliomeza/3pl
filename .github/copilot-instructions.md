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
- `src/lib/ai/logistics-assistant.ts` - Main AI logic for text-to-SQL conversion
- `src/app/actions.ts` - Server actions that bridge UI to AI functions

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

**Data Access Patterns**:
- **Employee queries**: Can access all `logistics_*` tables (operational data, analytics, management)
- **Client queries**: Should be restricted to client-specific data (their orders, shipments, etc.)
- **Security consideration**: Implement data filtering based on user role and client ID

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

### Styling & Design
- **Colors**: Primary `#0A183C` (dark blue), Background `#FAFBFD`, Accent `#F3F4F6`
- **Fonts**: Headlines use `Space Grotesk`, body text uses `Inter`
- **Icons**: Exclusively `lucide-react` for consistency
- **Components**: Built with Radix UI primitives + Tailwind CSS

### AI Development Strategy
- **All AI features**: Implemented with OpenAI API for superior text-to-SQL performance
- **Text-to-SQL**: Uses intelligent ILIKE patterns for partial matching
- **Chat Assistant**: Conversational AI with business context understanding and memory
- **Performance-First**: Optimized for fast response times with caching and efficient token usage
- **Architecture**: All AI integrations centralized in `src/lib/ai/`

**AI Conversation Features**:
- **Dual-Mode Processing**: Automatically detects data queries vs casual conversation
- **Natural Language**: Handles greetings, introductions, and follow-up questions naturally
- **Context Awareness**: Remembers conversation within chat session, understands "those", "them", etc.
- **Memory Management**: Session-based memory with "New Chat" reset functionality

**Role-Based AI Access**:
- **Employee AI Assistant**: Access to all operational data, analytics, and management insights
- **Client AI Assistant**: Restricted to client-specific data queries and insights
- **Shared UI pattern**: Both assistants use similar interface (`src/app/{role}/assistant/page.tsx`)
- **Different backend logic**: May require role-based query filtering in AI functions

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

**Recent Major Updates (July 2025)**:
- **Data Visualization System**: Complete Recharts integration with 4 chart types and smart recommendations
- **Chat UI Overhaul**: Side-by-side resizable layout with fixed height and internal scroll
- **Unified Interfaces**: Employee and client assistants now share identical UI patterns
- **Performance Optimizations**: Custom scrollbars, auto-scroll, and responsive design
- **Scroll Solution**: Resolved external page scroll with precise height calculations

This documentation maintenance ensures consistency across development sessions and preserves institutional knowledge about project patterns and decisions.