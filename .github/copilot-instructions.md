# GitHub Copilot Instructions

This repository contains a Satisfactory factory monitoring and planning application with two main components:

## Repository Structure

### FICSIT-Control
A React + TypeScript frontend application for real-time factory monitoring, production planning, and AI assistance.

**Tech Stack:**
- React 19 + TypeScript 5.9 (strict mode)
- Vite 7 for build
- Tailwind CSS 4 for styling
- Zustand 5 for state management
- @xyflow/react for production graph visualization
- @nivo for charts (line, sankey)
- Vitest 4 + jsdom for testing

**Key Directories:**
- `src/components/` - React components organized by feature
- `src/stores/` - Zustand state stores (ui, connection, factory, planner, chat)
- `src/api/` - API clients and schemas
- `src/solver/` - Production chain solver (BFS backward-propagation)
- `src/data/` - Game data (items, recipes, buildings)
- `src/utils/` - Utility functions
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

### satisfactory-mcp-server
A Model Context Protocol (MCP) server for providing Satisfactory factory data to AI assistants.

**Tech Stack:**
- TypeScript 5.9
- @modelcontextprotocol/sdk
- Node.js

## Development Commands

### FICSIT-Control
```bash
cd FICSIT-Control
npm run dev          # Start development server
npm run build        # Build for production (tsc + vite build)
npm run lint         # Run ESLint
npm run test         # Run Vitest in watch mode
npm run test:run     # Run Vitest once
npm run preview      # Preview production build
npm run mock:control # Run mock control server
```

### satisfactory-mcp-server
```bash
cd satisfactory-mcp-server
npm run dev          # Run with tsx
npm run build        # Compile TypeScript
npm run start        # Run compiled JavaScript
```

## Code Style and Standards

### TypeScript
- **Strict mode enabled** - All TypeScript strict checks are enforced
- Use explicit types for function parameters and return values
- Prefer `const` over `let`
- Use type inference where reasonable
- Follow the existing import style (named imports, grouped by external/internal)

### React
- Use functional components with hooks
- Lazy load heavy components with `React.lazy()` and `Suspense`
- Follow the established component structure:
  - Props interface at the top
  - Component function
  - Export at the bottom
- Use Zustand stores for state management, not prop drilling
- Components should be focused and single-purpose

### Styling
- Use Tailwind CSS 4 with the custom Satisfactory theme
- CSS custom properties are defined for colors: `var(--color-satisfactory-*)`
- Prefer utility classes over custom CSS
- Follow the existing color scheme (dark theme)

### State Management
- Use Zustand stores for global state
- Store files follow pattern: `{feature}-store.ts`
- Use `create` from zustand with TypeScript types
- Persist user preferences with the persist middleware where appropriate

### Testing
- Write tests for business logic and utilities
- Place tests in `__tests__` directories next to source files
- Test files use `.test.ts` or `.test.tsx` extension
- Use Vitest with the node environment
- Focus on unit tests for solver, utilities, and API schemas

### Naming Conventions
- Files: kebab-case (e.g., `factory-store.ts`, `ItemFlowEdge.tsx`)
- Components: PascalCase (e.g., `FactoryStatus`, `PowerGridView`)
- Functions and variables: camelCase (e.g., `useUIStore`, `productionGraph`)
- Types and Interfaces: PascalCase (e.g., `SolverInput`, `RecipeData`)
- Constants: UPPER_SNAKE_CASE for true constants, camelCase for config objects

### API and Data Validation
- Use Zod schemas for API response validation
- Define schemas close to where they're used
- Export both the schema and inferred TypeScript type

### Error Handling
- Handle API errors gracefully
- Show user-friendly error messages in the UI
- Log errors to console for debugging

## Architecture Patterns

### Component Organization
- Group by feature, not by type
- Each feature has its own directory under `components/`
- Shared/reusable components in `components/common/` or `components/layout/`

### Data Flow
1. FRM Client polls Satisfactory REST API
2. Responses validated with Zod schemas
3. Data stored in Zustand stores
4. Components subscribe to relevant store slices
5. UI updates reactively

### Store Pattern
Stores follow this structure:
```typescript
interface StoreState {
  // state fields
}

interface StoreActions {
  // action functions
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // initial state
  // action implementations
}));
```

### Production Solver
- Pure function: `solve(input) => output`
- BFS backward-propagation algorithm
- Handles recipe overrides and alternate recipes
- Calculates building requirements and raw resource needs

## Important Notes

- The app connects to Satisfactory via the FICSIT Remote Monitoring (FRM) mod on port 8080
- Power history is tracked per circuit with 120 snapshots (~6 min window)
- The planner supports both rate-based (per-minute) and batch (quantity) targets
- AI assistant supports Anthropic Claude and local Ollama models
- Game data (items, recipes, buildings) is statically defined in `src/data/`

## When Making Changes

1. **Understand the feature** - Review related components, stores, and data flow
2. **Follow existing patterns** - Match the style and structure of similar code
3. **Type safety** - Ensure all changes pass TypeScript strict checks
4. **Test your changes** - Add tests for new logic, run existing tests
5. **Lint before committing** - Run `npm run lint` to catch issues
6. **Build verification** - Ensure `npm run build` succeeds
7. **Minimal changes** - Make surgical edits that don't break existing functionality

## Common Tasks

### Adding a New Component
1. Create file in appropriate `components/` subdirectory
2. Use functional component with TypeScript
3. Import required hooks and stores
4. Apply Tailwind classes for styling
5. Export component

### Adding State
1. Identify the appropriate store or create a new one
2. Add state fields to the store interface
3. Add actions to modify state
4. Use the store in components with the hook

### Adding an API Endpoint
1. Define Zod schema for the response
2. Create API function in `src/api/`
3. Call from appropriate store or component
4. Handle loading and error states

### Modifying the Solver
1. Update types in `src/solver/types.ts` if needed
2. Modify logic in `src/solver/solve.ts`
3. Add tests in `src/solver/__tests__/`
4. Verify with UI planner or test runs
