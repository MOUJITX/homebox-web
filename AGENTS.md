# AGENTS.md

Homebox Client — web client for Homebox (home inventory management). React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Shadcn UI (base-nova).

## Commands

- `yarn dev` — start Vite dev server
- `yarn build` — type-check (`tsc -b`) then Vite build. Fails on TS errors — fix before pushing.
- `yarn lint` — ESLint (flat config)
- `yarn format` / `yarn format:check` — Prettier
- No test runner exists. Do not write or run tests.

## Environment

- Backend: separate Springboot project at `../../Springboot/com.moujitx.homebox.server`. Read its `docs/` and `CLAUDE.md` before implementing features that depend on API changes. If the backend lacks needed endpoints or has bugs, fix the backend first.
- `VITE_API_URL` in `.env.local` sets the backend URL. In dev, Vite proxies `/api` → `localhost:8080`.
- Token stored in `localStorage` as `homebox_token` (`src/api/axios.ts`).

## Architecture

- Single-app Vite project (not a monorepo).
- `@/` alias resolves to `src/`.
- Entry: `src/main.tsx` → `src/App.tsx` (React Router routes, `AuthProvider`, `QueryProvider`, `BrowserRouter`).
- `src/api/axios.ts` — shared Axios instance with auth interceptor, session-expired dialog on 401, error toasts via Sonner.
- `src/hooks/queries/` — TanStack React Query hooks (one per entity).
- `src/components/shared/` — reusable components: `FilePickerDialog`, `PictureManager`, `AttachmentManager`, `InvoiceBindingManager`.
- `src/lib/utils.ts` — `cn()` for Tailwind merging, `ROOT_ROLE` constant.

## Conventions

- **Arrow functions only** — `const Xxx = () => { ... }` for all components/functions.
- **Shadcn UI** — base-nova style, Base UI primitives. Add components via `npx shadcn@latest add <name>`. Config: `components.json`.
- **i18n required** — all UI text must have keys in both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`. Missing keys display raw key strings as fallback.
- **Prettier** — double quotes, trailing commas, 80 char width, semicolons. Config: `.prettierrc`.
- **ESLint** — flat config: TypeScript, React Hooks, React Refresh plugins + Prettier.
- **Pre-commit** — Husky + lint-staged (ESLint fix + Prettier on `.ts/.tsx`, Prettier on `.json/.css/.md/.html`).
- **Commit style** — `chore: release v${version}` for releases (via `release-it`). Conventional commits elsewhere. Commit at each meaningful step, not one big commit at the end.

## TypeScript Gotchas

- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are enforced.
- `erasableSyntaxOnly` is enabled — no enums, use `as const` objects instead.

## Workflow

- Before coding, clarify requirements and use the `feature-dev` skill to create an implementation plan.
- Analyze the backend code first when features depend on API changes.
- Use the `frontend-design` skill for UI work to produce distinctive, polished interfaces.
- Modularize and extract reusable code. Prefer adapting existing components over writing new ones.
- After significant changes, update `README.md` and `AGENTS.md` if documentation is affected.

## CI/CD

- Gitea Actions (`.gitea/workflows/`): `sonar.yml` (push to main), `js-build.yml` (version tags `v*`), `backup.yml` (push to main).
- `dist/` is gitignored. Production serves static files from `dist/`.
- No `*.local` or `*.local.json` files are committed (`.gitignore`).
