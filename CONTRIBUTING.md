# Contributing to Tappd In

This is a private repository. The goal of this guide is to keep `master` always
shippable and ensure **every change is reviewed before it lands**.

## Branching & PR flow

1. **Never commit directly to `master`** — route every change through a PR.
   (Hard branch protection requires GitHub Pro on a private repo; until then this
   is enforced by convention, not by GitHub.)
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
5. Open a Pull Request. The free review stack (below) runs automatically.
6. Merge only after CI is green and review comments are resolved. Prefer
   **Squash & merge** to keep `master` history clean.

## Code review (free stack)

Every change is reviewed by a stack of tools that are **free on private repos** —
no paid plan required:

| Tool | What it does | Free limit |
|---|---|---|
| **GitHub Actions CI** (`.github/workflows/ci.yml`) | Strict typecheck (blocking) + lint (informational) on frontend & backend | Free (2,000 min/mo) |
| **CodeRabbit** (`.coderabbit.yaml`) | AI line-by-line review + PR summary | 200 files/hr, 4 PR reviews/hr |
| **GitHub Copilot** code review | Second AI opinion, native to GitHub | 50 review requests/mo (Copilot Free) |

One-time setup:
- **CodeRabbit** — install the app: <https://github.com/apps/coderabbitai> → select this repo.
- **Copilot** — enable Copilot Free on your account, then on each PR use
  *Reviewers → Copilot* (or it auto-reviews if you add a repo rule).

These are advisory until the repo is on GitHub Pro (which lets you mark CI as a
**required** status check that blocks merge). Treat a red CI run or unresolved
review comment as a blocker by convention.

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
