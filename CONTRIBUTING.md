# Contributing to Tappd In

This is a private repository. The goal of this guide is to keep `master` always
shippable and ensure **every change is reviewed before it lands**.

## Branching & PR flow

1. **Never commit directly to `master`.** It is protected.
2. Create a branch off `master`:
   ```bash
   git checkout -b feat/short-description
   ```
3. Make your change. Keep commits scoped and use [Conventional Commits](https://www.conventionalcommits.org/):
   `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`, `test:`.
4. Before pushing, run the same checks CI runs:
   ```bash
   npm run typecheck
   npm run lint
   ```
5. Open a Pull Request. Two automated reviewers run on every PR:
   - **GitHub Actions CI** — typecheck + lint must pass (required status check).
   - **CodeRabbit** — AI code review; address its comments or reply with rationale.
6. Merge only after CI is green and review comments are resolved. Prefer
   **Squash & merge** to keep `master` history clean.

## Reverting

History is built as small, subsystem-scoped commits. To undo a specific change:

```bash
git revert <commit-sha>
```

Open it as a PR like any other change.

## Code rules (see [CLAUDE.md](CLAUDE.md) for the full list)

- TypeScript strict — no `any`, no unexplained type assertions.
- Every nutrition/calorie/training claim maps to an `EvidenceCard` in `data/evidence.ts`.
- Database logic lives in `lib/db/` — never inside UI components.
- Supabase Auth is the sole auth provider.
- Never commit secrets. `.env` files are gitignored; use `.env.example` as the template.
