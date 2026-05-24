# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Homebox Client — a web client application for Homebox (home inventory management), built with React, TypeScript, and Vite. Features include expiration tracking, asset management, invoice management, subscription management, medical records, medication reminders, notifications, and full-text search.

## Tech Stack

- **Runtime**: Node.js
- **Package Manager**: Yarn 1.x
- **Framework**: React 19 + TypeScript 6
- **Build Tool**: Vite 8
- **UI**: Tailwind CSS 4 + Shadcn UI (Base UI primitives)
- **Routing**: React Router 7 (library mode)
- **Data Fetching**: TanStack React Query (caching, background refetch, stale-while-revalidate)
- **HTTP Client**: Axios
- **JWT**: jwt-decode
- **Icons**: Lucide React
- **Toasts**: Sonner
- **i18n**: i18next + react-i18next + i18next-browser-languagedetector
- **Linting**: ESLint 10 (flat config) with TypeScript, React Hooks, and React Refresh plugins
- **Formatting**: Prettier 3
- **Pre-commit**: Husky + lint-staged (runs ESLint fix + Prettier on staged files)

## Commands

- `yarn dev` — start dev server
- `yarn build` — type-check and build for production
- `yarn preview` — preview production build
- `yarn lint` — run ESLint
- `yarn format` — format all files with Prettier
- `yarn format:check` — check formatting without writing

## Rules

- Before coding, analyze the backend code in `../../Springboot/com.moujitx.homebox.server` (especially `../../Springboot/com.moujitx.homebox.server/docs`) to understand available APIs, data models, and contracts. If issues are found or features are not yet implemented on the backend, edit the backend code first to fix or implement them — following the rules in `../../Springboot/com.moujitx.homebox.server/CLAUDE.md`. Once the backend is complete, continue with frontend work.
- The backend API URL is configured via Vite's `env` mechanism (`VITE_API_URL` in `.env.local`).
- Before coding, clarify and detail the requirements — user requests may be vague or incomplete. Use the `feature-dev` skill to analyze the codebase and flesh out a concrete implementation plan before starting.
- After every task, immediately update `README.md` and `CLAUDE.md` if the changes warrant documentation updates (e.g. new features, changed commands, altered architecture, new dependencies, updated setup steps).
- Commit at each key implementation step boundary rather than one big commit at the end. Each commit should represent a meaningful, self-contained unit of work (e.g., "backend entities and enums", "repository and service layer", "controller and DTOs"). Never batch unrelated changes into a single commit.
- Do not edit or create tests unless explicitly noted.
- Use the latest stable versions of technologies, libraries, and frameworks. Code structure and content should follow common technical standards and best practices, but avoid over-engineering or unnecessary complexity.
- Use arrow function style for all TS/TSX components and functions: `const Xxx = () => { ... }` or `const Xxx = () => (...)` for direct returns.
- Modularize and extract reusable code components to avoid duplication. Shared utilities, hooks, and components should be placed in common locations for reuse. When a component or piece of logic originally built for a specific feature can serve a broader purpose, abstract, refactor, or rename it into a generic reusable form rather than duplicating it. Prefer adapting existing components over writing new ones.
- Keep consistent style/UI across components. Avoid generic "AI-looking" design — use the `frontend-design` skill when building UI to produce distinctive, polished interfaces.
- When adding, modifying, or removing any UI text (column headers, labels, messages, placeholders, etc.), always update both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json` with the corresponding keys. Missing i18n keys cause the application to display raw key strings as fallback text.
