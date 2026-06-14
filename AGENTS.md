# AGENTS.md

## Commands

- `yarn dev` — start Vite dev server
- `yarn build` — type-check (`tsc -b`) then Vite build
- `yarn lint` — ESLint
- `yarn format` / `yarn format:check` — Prettier
- No test runner exists. Do not write or run tests.

## Environment

- Backend is a separate Springboot project at `../../Springboot/com.moujitx.homebox.server`. Read its `docs/` and `CLAUDE.md` before implementing features that depend on API changes.
- `VITE_API_URL` in `.env.local` sets the backend URL. In dev, Vite proxies `/api` → `localhost:8080`.
- Token stored in `localStorage` as `homebox_token` (`src/api/axios.ts`).

## Architecture

- Single-app Vite project (not a monorepo).
- `@/` alias resolves to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- Entry: `src/main.tsx` → `src/App.tsx` (React Router routes, `AuthProvider` wraps everything).
- `src/api/axios.ts` — shared Axios instance with auth interceptor, session-expired handling, and error toasts.
- `src/hooks/queries/` — TanStack React Query hooks (one per entity: `useAssets`, `useSubscriptions`, etc.).
- `src/components/shared/` — reusable components (`FilePickerDialog`, `PictureManager`, `AttachmentManager`, `InvoiceBindingManager`).
- `src/lib/utils.ts` — `cn()` for Tailwind merging, `ROOT_ROLE` constant.

## Conventions

- **Arrow functions only** — `const Xxx = () => { ... }` for all components/functions.
- **Shadcn UI** — base-nova style, Base UI primitives. Add components via `npx shadcn@latest add <name>`. Config: `components.json`.
- **i18n required** — all UI text must have keys in both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`. Missing keys display raw strings.
- **Prettier** — double quotes, trailing commas, 80 char width, semicolons. Config: `.prettierrc`.
- **ESLint** — flat config in `eslint.config.js`. Runs TypeScript, React Hooks, React Refresh plugins.
- **Pre-commit** — Husky + lint-staged runs ESLint fix + Prettier on staged `.ts/.tsx`, Prettier on `.json/.css/.md/.html`.
- **Commit style** — `chore: release v${version}` for releases (via `release-it`). Conventional commits elsewhere.

## CI/CD

- Gitea Actions (`.gitea/workflows/`).
- `sonar.yml` — SonarQube scan on push to `main`.
- `js-build.yml` — build + deploy on version tags (`v*`).
- `backup.yml` — code freeze + NAS backup on push to `main`.

## Gotchas

- `yarn build` fails on TypeScript errors — it runs `tsc -b` first. Fix type errors before pushing.
- `dist/` is gitignored. Production serves static files from this directory.
- No `*.local` or `*.local.json` files are committed (see `.gitignore`).
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are enforced by TypeScript.
