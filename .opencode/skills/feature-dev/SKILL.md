---
name: feature-dev
description: Analyze codebase and create a concrete implementation plan before coding
---

## Purpose

Create a detailed implementation plan for features before writing code. This ensures requirements are clear, edge cases are considered, and the implementation approach is sound.

## Process

1. **Clarify requirements** — user requests may be vague or incomplete. Ask clarifying questions to nail down:
   - Feature scope and acceptance criteria
   - UI/UX expectations (layout, interactions, states)
   - Data model implications (new fields, relationships, API endpoints)
   - Edge cases (empty states, error handling, loading states)

2. **Analyze existing code** — trace through relevant parts of the codebase:
   - Identify patterns and conventions already in use
   - Find similar features that can be adapted
   - Check what APIs already exist vs. what needs to be added
   - Review the backend project at `../../Springboot/com.moujitx.homebox.server/docs/` for API contracts

3. **Produce a plan** with:
   - Ordered implementation steps (backend first if API changes are needed, then frontend)
   - Files to create or modify
   - Key components, hooks, and API calls
   - i18n keys to add
   - Reusable components to extract

4. **Review with user** before implementing — confirm the plan, then proceed step by step.
