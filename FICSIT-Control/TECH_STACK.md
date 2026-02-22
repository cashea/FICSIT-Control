# Technology Stack & Testing Guide

## Technology Stack

The **FICSIT-Control** application is built on a modern React ecosystem, leveraging the latest stable versions of core libraries.

### Core Framework
*   **Runtime**: React 19
*   **Language**: TypeScript 5.9 (Strict Mode enabled)
*   **Build Tool**: Vite 7
*   **Bundler Target**: ESNext modules

### UI & Styling
*   **Styling Engine**: Tailwind CSS 4 (Vite plugin)
*   **Icons**: Lucide React
*   **Theme**: Custom "Satisfactory Dark" theme variables defined in `index.css`

### State Management
*   **Library**: Zustand 5
*   **Middleware**: Persist middleware used for `connection-store` and `chat-store`.

### Visualization
*   **Node Graph**: `@xyflow/react` v12 (formerly React Flow) with `@dagrejs/dagre` for auto-layout.
*   **Charts**: `@nivo/line` and `@nivo/sankey` (v0.99) for power monitoring.

### Data Validation
*   **Schema Validation**: Zod 4. Used extensively for validating WebSocket/REST payloads from the FRM mod.

---

## Testing Strategy

The project uses **Vitest** as the test runner, configured to be API-compatible with Jest but built on top of Vite for speed.

### Running Tests

| Command | Description |
| :--- | :--- |
| `npm test` | Runs tests in **watch mode**. Useful during development. |
| `npm run test:run` | Runs all tests **once** and exits. Used for CI/pre-commit checks. |

### Test Structure

Tests are collocated with the code they test, typically in a `__tests__` subdirectory.

```text
src/
├── solver/
│   ├── solve.ts
│   └── __tests__/
│       ├── solve.test.ts      # Unit tests for the main solver logic
│       ├── power.test.ts      # Unit tests for power calculations
│       └── factory-import.test.ts
```

### Writing Tests

1.  **Unit Tests**: Focus on pure logic functions (like the Solver). Use standard `describe`, `it`, `expect` patterns.
2.  **Component Tests**: Use `@testing-library/react`.
    ```typescript
    import { render, screen } from '@testing-library/react';
    import { MyComponent } from '../MyComponent';
    
    it('renders correctly', () => {
      render(<MyComponent />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    ```

### Key Test Files
*   `src/solver/__tests__/solve.test.ts`: Covers the core BFS graph generation, cycle detection, and byproduct logic.
*   `src/utils/__tests__/frm-name-map.test.ts`: Verifies string normalization for game data.

---

## Code Quality

*   **Linting**: ESLint 9 with `typescript-eslint` and `react-hooks` plugins.
*   **Command**: `npm run lint`
