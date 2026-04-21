
# Quotation Maker — Agent Rules

## Workflow

- Explain *why* before providing a bug fix or complex change.
- Never delete files or >20 lines of code without explicit confirmation.
- Break complex tasks into numbered steps; pause for approval after each.
- Break implementation plans into distinct phases.

## Code Style

- Next.js components are Server Components by default; only add `'use client'` for interactivity, state, or browser APIs.
- Use Tailwind CSS utility classes; avoid inline styles or custom CSS.
- `PascalCase` for component filenames, `camelCase` for utility functions.

## Safety

- Never install npm packages. Suggest the command and wait for the user to run it.

## PDF Standards

- Extract layout constants (margins, colors, line heights) to the top of jspdf files; never hardcode them inside functions.

## Clean Code

- If the same UI element or logic appears a third time, suggest extracting it into a reusable component or utility.

## Technical Constraints

### Next.js Warning

Not the Next.js from training data — APIs and conventions may differ. Verify via Context7 before assuming behavior.

### Routing

- No dynamic path segments (`[id]/page.jsx`). Use search params (`?id=XYZ` + `useSearchParams()`).
- Wrap any component using `useSearchParams()` in `<Suspense>`.

### Backend

- Call Appwrite SDK/REST API directly from the client.
- Never use `node-appwrite` or `APPWRITE_API_KEY` in frontend code.

### Images

- Use direct Appwrite URLs; no server-side proxies.
- `<Image>` must have `unoptimized: true` in `next.config.mjs`.

## Reference

Full docs: [docs/claude-reference.md](docs/claude-reference.md)
