# UI Dashboard With React TypeScript with Redux & Material Ui

> This repository is a curated, opinionated starter and evolving source of truth for UI patterns, theming, state management, and reusable components inside the company. It is private/internal and not intended for external distribution.

## Table of Contents

- [Goals](#goals)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Development Workflow](#development-workflow)
- [State Management](#state-management)
- [Theming & Design System](#theming--design-system)
- [UI Customizations](#ui-customizations)
- [Contexts: Dialogs & Notifications](#contexts-dialogs--notifications)
- [Testing](#testing)
- [Code Style & Linting](#code-style--linting)
- [Environment Variables](#environment-variables)
- [Adding a New Feature Slice](#adding-a-new-feature-slice)
- [Using styled-components vs Emotion](#using-styled-components-vs-emotion)
- [Performance & Build Notes](#performance--build-notes)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)
- [Inspiration & References](#inspiration--references)
- [License / Internal Use](#license--internal-use)

## Goals

1. Provide a consistent baseline for all front-end apps in the company.
2. Centralize theming, typography, spacing, and navigation primitives.
3. Encourage predictable Redux Toolkit slice patterns and colocated tests.
4. Lower onboarding friction for new engineers (clear structure & docs).
5. Enable rapid feature creation with ready contexts (dialogs, notifications).
6. Support dark/light mode and future theme variants.

## Technology Stack

- React: ^19.2.0
- Vite: ^6.4.1
- TypeScript: ^5.9.3
- Redux Toolkit + React Redux
- Material UI (MUI) v7 + Icons
- Emotion (default MUI styling) + optional styled-components engine (@mui/styled-engine-sc)
- Vitest + Testing Library (React, DOM, user-event) + jsdom
- ESLint (TypeScript + React + Hooks) & Prettier

## Project Structure

```bash
src/
  App.tsx                # Root app shell
  main.tsx               # Vite entry
  app/
    store.ts             # Redux store config
    createAppSlice.ts    # Helper for uniform slice pattern
    hooks.ts             # Typed hooks
  features/
    counter/             # Example slice, component, tests
    quotes/              # Async data feature
  pages/
    signin/ SignIn.tsx
    signup/ SignUp.tsx
  components/
    signin/              # Sign-in components + icons
    signup/              # Sign-up components + icons
  theme/
    AppTheme.tsx         # Theme provider composition
    themePrimitives.tsx  # Tokens & shared theming helpers
    ColorModeSelect.tsx  # Light/Dark toggle
    customizations/
      navigation.tsx     # Navigation-specific theme overrides
  hooks/
    useDialogs/          # Dialogs context + provider
    useNotifications/    # Notifications context + provider
  context/
    DashboardSidebarContext.ts
  utils/
    test-utils.tsx       # Custom test renderer
  setupTests.ts          # Vitest setup
```

Design Principles

- Co-location of slice + component + tests.
- Provider layering is explicit and minimal.
- Theming-first: prefer theme overrides over ad-hoc styling.
- Keep store lean—register only used slices.

## Getting Started

```bash
npm install
npm run dev
# After build:
npm run preview
```

Default dev port is usually 5173 (Vite). Configure via [vite.config.ts](./eslint.config.js) if needed. (the current is 3000)

## Available Scripts

- `dev`: Start dev server
- `build`: Type-check + production build
- `preview`: Serve built assets locally
- `test`: Run Vitest suite
- `type-check`: Project TS compile (no emit)
- `lint` / `lint:fix`: ESLint
- `format` / `format:check`: Prettier
- `start`: Alias for dev

## Development Workflow

1. Branch: `feature/xyz` / `fix/xyz` / `chore/xyz`.
2. Implement slice/component.
3. Add/adjust tests.
4. Run `npm run lint && npm run test`.
5. Open PR; keep scope focused.

## State Management

- [store.ts](./src/app/store.ts) aggregates slices.
- [createAppSlice.ts](./src/app/createAppSlice.ts) standardizes slice creation (actions + selectors).
- [hooks.ts](./src/app/hooks.ts) exposes typed useAppDispatch / useAppSelector.

Example slice:

```typescript
import { createAppSlice } from "../../app/createAppSlice"

export const exampleSlice = createAppSlice({
  name: "example",
  initialState: { value: 0 },
  reducers: create => ({
    increment: create.reducer(state => {
      state.value += 1
    }),
  }),
  selectors: { selectValue: state => state.value },
})

export const { increment } = exampleSlice.actions
export const { selectValue } = exampleSlice.selectors
```

Async flows: use `createAsyncThunk` or (future) RTK Query.

## Theming & Design System

- [AppTheme.tsx](./src/theme/AppTheme.tsx): Composes MUI theme + color mode + custom providers.
- [themePrimitives.tsx](./src/theme/themePrimitives.tsx): Tokens (spacing, radii, transitions, etc.).
- [ColorModeSelect.tsx](./src/theme/ColorModeSelect.tsx): Light/dark toggle.
- [customizations/navigation.tsx](./src/theme/customizations/navigation.tsx): Drawer/navigation styling.

Extending theme:

```typescript
declare module "@mui/material/styles" {
  interface Theme {
    appSpacing: { xs: number; sm: number }
  }
  interface ThemeOptions {
    appSpacing?: { xs?: number; sm?: number }
  }
}

const theme = createTheme({
  appSpacing: { xs: 4, sm: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  },
})
```

## UI Customizations

- Auth flows: [pages/signin](./src/pages/signin/SignIn.tsx), [pages/signup](./src/pages/signup/SignUp.tsx)
  Icon consolidation: components/signin/CustomIcons.tsx, components/signup/CustomIcons.tsx
- Navigation: centralized override file.

## Contexts: Dialogs & Notifications

- `useDialogs`: open dialogs by key; decouples triggers from rendering.
- `useNotifications`: transient messages/toasts pattern.

Add new dialog types by registering in provider config.

## Testing

- Runner: Vitest (`npm run test`)
- Libraries: Testing Library (React + user-event)
- Setup: [setupTests.ts](./src/setupTests.ts)
- Custom render with providers: [utils/test-utils.tsx](./src/utils/test-utils.tsx)

Example:

```typescript
import { render, screen } from '../../utils/test-utils';
import Counter from './Counter';

test('renders counter initial value', () => {
  render(<Counter />);
  expect(screen.getByText(/count/i)).toBeInTheDocument();
});
```

## Code Style & Linting

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

Flat ESLint config ([eslint.config.js](./eslint.config.js)) + Prettier integration.

## Environment Variables

Prefix with `VITE_` to expose:

```ini
VITE_API_BASE_URL=https://api.internal.company
VITE_ENABLE_MOCKS=false
```

Usage:

```typescript
const base = import.meta.env.VITE_API_BASE_URL
```

## Adding a New Feature Slice

1. mkdir `src/features/awesome`
2. Add `awesomeSlice.ts`
3. Add UI component `Awesome.tsx`
4. Register slice in [store.ts](./src/app/store.ts)
5. Add tests (`awesomeSlice.test.ts`)
6. Optional: API module if remote data involved

## Using styled-components vs Emotion

MUI defaults to Emotion. We include styled-components + `@mui/styled-engine-sc`:

- Prefer Emotion (`sx`, `styled`) for consistency.
- Use styled-components only when advanced theming / keyframes / ecosystem reuse is needed.

## Performance & Build Notes

- Vite HMR for dev speed.
- Import MUI components individually.
- Use `React.lazy()` for large routes.
- Consider future route-level code splitting & prefetching.

## Contributing

- Branch naming: `feature/`, `fix/`, `chore/`
- Keep PRs focused
- Add tests for new logic paths
- Update README if introducing new primitives
- (Optional) Conventional Commits (`feat:`, `fix:`)

## Future Enhancements

- Storybook or Ladle for component isolation
- RTK Query integration
- Token export (JSON) for cross-platform usage
- GitLab Actions / Azure DevOps CI
- Visual regression (e.g., Loki/Chromatic)
- Accessibility audits (axe)
- Dark mode persistence.

## Inspiration & References

- Create React App template
- Vite React template
- Vitest examples
- Material UI docs
- Redux Toolkit docs

## License / Internal Use

Proprietary. Internal use only. Do not distribute without authorization.
