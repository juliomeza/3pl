# Copilot Instructions for Reliable 3PL

## Architecture Overview

This is a **Next.js 15 + Firebase + PostgreSQL** logistics management platform with AI-powered insights. The project follows a modular architecture with clear separation between client/employee roles and AI-driven data analysis.

**Key Stack**: Next.js (App Router), Firebase Auth/Firestore, PostgreSQL, Google Genkit AI (migrating to OpenAI), shadcn/ui, Tailwind CSS

## Development Workflow

```bash
# Development (runs on port 9002)
npm run dev

# AI Development (Genkit flows)
npm run genkit:dev    # Start Genkit dev server
npm run genkit:watch  # Watch mode for AI flows

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

### AI Architecture (Migrating to OpenAI)
- **Current**: Google Genkit for AI flows (`src/ai/genkit.ts`)
- **Migration Plan**: OpenAI for text-to-SQL and chat assistant features
- `src/ai/flows/` - AI flows (logistics-insights.ts for text-to-SQL)
- `src/ai/dev.ts` - AI development entry point
- `src/app/actions.ts` - Server actions that bridge UI to AI flows

**Critical Pattern**: 
- **Genkit flows** use `defineFlow`, `defineTool`, and `definePrompt` (legacy)
- **New OpenAI integrations** should use direct OpenAI API calls for better text-to-SQL performance
- Environment variable: `OPENAI_API_KEY` for new implementations

### Authentication & Authorization
- Firebase Auth with Google/Microsoft OAuth
- Role-based routing: `client`, `employee`, `none` (pending)
- `src/components/with-auth.tsx` - HOC for protected routes
- `src/context/auth-context.tsx` - Global auth state management

### Database Integration
- PostgreSQL connection via `src/lib/db.ts` using connection pooling
- Environment: `POSTGRES_URL` required
- Schema: Tables prefixed with `logistics_` (orders, shipments, etc.)
- AI queries specifically target tables starting with `logistics_`

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
- **New AI features**: Implement with OpenAI API for better text-to-SQL performance
- **Existing Genkit flows**: Maintain until migration is complete
- **Text-to-SQL**: Prioritize OpenAI implementation over Genkit
- **Chat Assistant**: Use OpenAI for conversational AI features
- Place new AI integrations in `src/lib/ai/` (separate from Genkit flows)

## Environment Setup

Required environment variables:
```bash
POSTGRES_URL=postgresql://...
GOOGLE_AI_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key  # For new AI features
```

Firebase config is hardcoded in `src/lib/firebase/config.ts` for the `synapse3pl` project.

## Critical Development Notes

- **TypeScript errors are ignored in builds** (`ignoreBuildErrors: true`)
- **Development server runs on port 9002** (not 3000)
- **Firebase Studio compatibility** - Project designed to work in both environments
- **AI Migration**: Text-to-SQL and chat features moving from Genkit to OpenAI for better performance
- **Role-based routing** handles client vs employee access automatically
- **Database schema discovery** happens dynamically for AI queries
- **Code Language**: All code, comments, and variable names must be in English

## Integration Points

- **Firebase Auth** → Firestore user profiles → Role-based app routing
- **PostgreSQL** → AI flows → Natural language insights
- **OpenAI API** (new) → Server actions → Client components (preferred for text-to-SQL)
- **Genkit AI** (legacy) → Server actions → Client components (existing flows)
- **shadcn/ui** → Custom styling → Consistent design system