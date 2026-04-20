# Project Architecture: Quotation Maker

## Core Principles

- **Feature-Based Module System**: Code is organized into standalone features (e.g., `features/quotations`).
- **Strict Typing**: All code is written in TypeScript.
- **Server State Management**: TanStack Query is used for all asynchronous data fetching and mutations.
- **UI Consistency**: Reusable UI components in `src/components/ui`.
- **Form Pattern**: React Hook Form with Zod for all forms.

## Directory Structure

```text
src/
├── app/          # Next.js App Router (Routing & Layouts)
├── features/     # Feature-specific code (Domain Logic)
│   └── [feature]/
│       ├── api/        # Data hooks (useQuery, useMutation)
│       ├── components/ # Feature-specific components
│       ├── types/      # Domain-specific interfaces
│       └── utils/      # Domain-specific logic
├── components/   # Shared UI components
│   └── ui/       # Design System (Buttons, Cards, Inputs)
├── hooks/        # Shared custom hooks
├── lib/          # External library configurations
├── providers/    # Global Context Providers
├── services/     # Low-level API service wrappers (Appwrite)
└── types/        # Shared global types
```

## State Management

- **Server State**: Managed by `@tanstack/react-query`. Use custom hooks for all data operations.
- **Client State**:
  - Global: Use `zustand` if complexity increases.
  - Form State: Managed via `react-hook-form`.
  - Simple local state: React `useState`.

## Coding Standards

- **Functional Components**: All components use arrow function syntax.
- **Tailwind CSS**: Utility-first styling. Use `cn` helper (clsx + tailwind-merge) for conditional classes.
- **Lucide React**: Primary icon set.
- **Error Handling**: Use a standard `onError` pattern or a global toast notification.

## Component Design

Components should follow a "presentational-container" separation when complex logic is involved. Prefer extracting logic into custom hooks.
- **Atoms**: Base elements (e.g., Button).
- **Molecules**: Combined atoms (e.g., FormField).
- **Organisms**: Complex feature blocks (e.g., BOMRegistry).
