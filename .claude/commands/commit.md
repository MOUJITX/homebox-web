---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
description: Stage all changes, generate a commit message, and commit — does not push
---

Stage all current changes, generate a conventional commit message, and commit locally. Do **not** push to any remote.

Follow these steps:

1. Run `git status` to see which files are changed.
2. Run `git diff --cached` and `git diff` (unstaged) to understand the nature of the changes.
3. Run `git log --oneline -10` to see recent commit style and scope.
4. Analyze the diffs and write a concise **conventional commit** message:
   - Format: `<type>(<optional scope>): <short summary>`
   - Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `perf`, `test`, `build`, `ci`
   - Keep the subject line under 72 characters.
   - If the change is non-trivial, add a blank line followed by a short body explaining **what** and **why** (not how).
   - Match the language (English or Chinese) of the majority of recent commits in the log.
5. Stage all changes with `git add -A`.
6. Commit with the generated message: `git commit -m "<message>"` (use `-m` for subject + `-m` for body if needed).
7. Print the resulting commit hash and message to the user.
8. **Do NOT run `git push`** — the commit stays local only.
