# Agent / LLM task template

Copy into any prompt (Cursor, Claude Code, Copilot, CLI):

```text
PROJECT: Tapped In (Expo RN, production = repo root)
FEATURE: <tracker|log_meal|onboarding|plan_results|recipes|workout|trainer>
PRIORITY: <1-migration|2-stack|3-refine>

READ FIRST (in order):
1. docs/feature-registry.yaml  (grep FEATURE id)
2. INTEGRATION_STATUS.md
3. docs/features/<FEATURE>.md   (if exists)
4. docs/TYPESCRIPT_STACK_MIGRATION.md  (only if PRIORITY=2-stack)

DO NOT:
- Polish recipes/workout/trainer when FEATURE is tracker/log_meal
- Change src/calorieEngine.ts or src/macroEngine.ts without evidence citation

ACCEPTANCE:
- <your criteria>
- npm run typecheck passes (if code changed)
```

## Feature IDs

| ID | Use when |
|----|----------|
| `tracker` | Tracker tab, meal list, macros summary |
| `log_meal` | Log meal screen, oil modal, AI scan |
| `onboarding` | Steps 1–5 |
| `plan_results` | Results tab, engine output |
| `recipes` | Recipe feed (parked) |
| `workout` | Workout tab (parked) |
| `trainer` | AI trainer tab (parked) |

## CLI helper

```bash
node scripts/feature-context.mjs tracker
```

Prints registry slice + doc paths for that feature.
