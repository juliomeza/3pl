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

## Critical Development Notes

- **TypeScript errors are ignored in builds** (`ignoreBuildErrors: true`)
- **Development server runs on port 9002** (not 3000)
- **Firebase Studio compatibility** - Project designed to work in both environments
- **AI text-to-SQL** currently uses OpenAI for better SQL generation
- **Role-based routing** handles client vs employee access automatically
- **Database schema discovery** happens dynamically for AI queries with 30-minute caching
- **AI Performance**: Optimized for speed with schema caching, reduced tokens, and efficient conversation handling
- **Code Language**: All code, comments, and variable names must be in English

## Integration Points

- **Firebase Auth** → Firestore user profiles → Role-based app routing
- **PostgreSQL** → AI flows → Natural language insights
- **OpenAI API** → Server actions → Client components (text-to-SQL)
- **shadcn/ui** → Custom styling → Consistent design system