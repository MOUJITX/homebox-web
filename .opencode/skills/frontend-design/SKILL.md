---
name: frontend-design
description: Build distinctive, polished UI interfaces using this project's design system
---

## Purpose

Create UI that follows Homebox Client's design language and avoids generic "AI-looking" output.

## Design System

- **Framework**: Shadcn UI with base-nova style, Base UI primitives
- **Icons**: Lucide React
- **Styling**: Tailwind CSS 4 with `cn()` utility from `src/lib/utils.ts`
- **Components**: Check `src/components/ui/` for available Shadcn components before writing custom ones

## Guidelines

1. **Reuse existing components** — check `src/components/shared/` for reusable components (FilePickerDialog, PictureManager, AttachmentManager, InvoiceBindingManager) before creating new ones.

2. **Follow existing patterns** — look at similar pages/components in the codebase for conventions on:
   - Table layouts and column definitions
   - Form layouts and validation
   - Modal/drawer patterns
   - Loading and empty states

3. **Consistent design language**:
   - Use the project's color palette and spacing via Tailwind utilities
   - Follow the existing information hierarchy (page title → filters → table → actions)
   - Match the existing responsive breakpoints

4. **i18n required** — every user-facing string needs keys in both `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`.

5. **Avoid**:
   - Generic gradient backgrounds, excessive shadows, or trendy effects
   - Introducing new UI patterns that don't match the existing design
   - Over-engineering — prefer simple, functional layouts
