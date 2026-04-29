# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Homebox Client — a web client application for Homebox (home inventory management), built with React, TypeScript, and Vite.

## Tech Stack

- **Runtime**: Node.js
- **Package Manager**: Yarn 1.x
- **Framework**: React 19 + TypeScript 6
- **Build Tool**: Vite 8
- **Linting**: ESLint 10 (flat config) with TypeScript and React plugins
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

- After every task, immediately update `README.md` and `CLAUDE.md` if the changes warrant documentation updates (e.g. new features, changed commands, altered architecture, new dependencies, updated setup steps).
- Commit changes only after all steps are approved by the user. For large modifications containing multiple small tasks or features, commit at each small task/feature boundary rather than one big commit at the end.
- Do not edit or create tests unless explicitly noted.
- Use the latest stable versions of technologies, libraries, and frameworks. Code structure and content should follow common technical standards and best practices, but avoid over-engineering or unnecessary complexity.
- Use arrow function style for all TS/TSX components and functions: `const Xxx = () => { ... }` or `const Xxx = () => (...)` for direct returns.
