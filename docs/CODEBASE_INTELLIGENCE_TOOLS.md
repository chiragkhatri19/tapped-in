# docs/CODEBASE_INTELLIGENCE_TOOLS.md — Codebase Mapping & Crash Diagnostics

This document outlines the tools and workflows we use to map codebase dependencies, perform blast radius impact analysis of code changes, and track production errors. 

By integrating these tools, we provide **LLMs and coding agents** (Antigravity, Claude Code, Codex) with a structured mathematical map of the codebase, preventing token waste, reducing hallucinated side-effects, and keeping our production builds crash-free.

---

## 1. Codebase Dependency & Blast Radius Mapping

When coding agents scan a large codebase, they often read files sequentially to locate import chains, wasting thousands of context tokens. To prevent this, we utilize two highly-validated, high-star open-source static analysis tools:

### 1.1 Dependency Cruiser (GitHub Stars: ~4.5k+)
* **What it is:** A zero-dependency CLI static analysis tool built specifically for JavaScript, TypeScript, and Node.js.
* **How it helps coding agents:** It parses TypeScript import structures and compiles a structured JSON module graph. We can feed this map directly to LLMs, letting them instantly know:
  - Which files import the function they are editing (**the exact blast radius**).
  - If a proposed change introduces circular dependencies.
  - If an import violates architectural boundary rules (e.g., preventing a UI component in `components/ui/` from importing route logic from `app/`).
* **Implementation Plan:**
  1. Install as a dev dependency:
     ```bash
     npm install --save-dev dependency-cruiser
     ```
  2. Initialize the cruiser configuration:
     ```bash
     npx depcruise --init
     ```
  3. Create a shortcut in `package.json` to generate an interactive HTML dependency graph or a structured JSON map for LLMs:
     ```json
     "scripts": {
       "dep-graph": "depcruise app components lib stores src --output-type dot | dot -Tsvg > docs/dependency-graph.svg",
       "dep-json": "depcruise app components lib stores src --output-type json > docs/dependency-map.json"
     }
     ```

### 1.2 Madge (GitHub Stars: ~13k+)
* **What it is:** An extremely fast developer-focused CLI utility used to list circular dependencies and output clean, visual Graphviz/SVG dependency trees for React Native projects.
* **How it helps coding agents:** Madge is perfect for mapping complex component hierarchies in our React Native tab routes. It provides a visual, interactive representation of how files connect, preventing LLMs from blindly refactoring shared styles or helper utilities.
* **Implementation Plan:**
  1. Install dev dependencies:
     ```bash
     npm install --save-dev madge
     ```
  2. Run circular dependency audits:
     ```bash
     npx madge --circular app/
     ```
  3. Generate a modular image map:
     ```bash
     npx madge --image docs/codebase-hierarchy.svg app/
     ```

---

## 2. Production Crash & Error Diagnostics

Visualizing errors and user flows is critical to maintaining a polished, production-ready Play Store application. We use Sentry and PostHog to provide full observability and diagnostic tracking.

```
 +-----------------------------------------------------------------------------+
 |                                  USER DEVICE                                |
 |  Captures interactive taps, state transitions, and unhandled JS exceptions.  |
 +-----------------------------------------------------------------------------+
                   |                                       |
                   v (Crash Telemetry)                     v (Behavior Logs)
        +----------------------+               +----------------------+
        |     SENTRY SDK       |               |     POSTHOG SDK      |
        |  - JS & Native Stack |               |  - Session Replays   |
        |  - Crash Rates/Time  |               |  - Feature Flags     |
        |  - Breadcrumb Tracks |               |  - Retention Funnels |
        +----------------------+               +----------------------+
```

### 2.1 Sentry (GitHub Stars: ~37k+)
* **Role:** Industry-standard crash reporting for React Native.
* **Why it is best for Tapped In:**
  - **Error Grouping:** Instead of throwing thousands of raw logs, Sentry aggregates identical stack traces into distinct, manageable issues.
  - **Breadcrumbs:** Captures the exact sequence of user actions (button clicks, screen transitions, local SQLite query events) leading up to the crash.
  - **Source Maps Integration:** Translates compiled, obfuscated production Javascript code back to our raw TypeScript files, showing the exact line and function that failed.
* **Launch Integration Phase: Phase 1 (Technical Hardening).**
  - Package: `@sentry/react-native`
  - Integration: Wrapped in `app/_layout.tsx` using `Sentry.init(...)` with a `__DEV__` guard to prevent local dev noise from polluting production databases.

### 2.2 PostHog (GitHub Stars: ~18k+)
* **Role:** Open-source, developer-first product analytics and session recording.
* **Why it is best for Tapped In:**
  - **Session Replays:** PostHog records a literal video reconstruction of what the user did on screen when they encountered an error. This completely eliminates the "cannot reproduce" debugging blocker.
  - **Feature Flags:** Allows us to dynamically disable a buggy feature or local database integration for specific users in production directly from the cloud console, without needing to release a new Play Store version.
  - **Error Funnels:** Links crash events to specific user flows (e.g. seeing if a crash occurs only during the `ai_scan` review screen).
* **Launch Integration Phase: Phase 2 (Analytics & Beta).**
  - Package: `posthog-react-native`
  - Integration: Root provider wrapper around the app shell (`PostHogProvider`).

---

## 3. How This Saves LLM Token Costs & Prevents Regression

By maintaining automated JSON dependency maps and visual graphs, we introduce a highly efficient **Context Injection** workflow for coding agents:

```
                          1. Developer triggers edit command
                                         |
                                         v
                     2. Pre-hook runs dependency cruiser script
                                         |
                                         v
                     3. Generates lightweight docs/dependency-map.json
                                         |
                                         v
            4. LLM reads map first -> knows exact blast radius of targets
                                         |
                                         v
       5. LLM only loads and refactors connected files -> 80% token savings!
```

### The AI-Optimized Workflow Rules:
1. **Never scan the whole project blindly:** When prompting an LLM (such as Claude Code or Antigravity) to edit a utility function, instruct the agent to read `docs/dependency-map.json` first. The agent will read only the target file and the files immediately importing it.
2. **Circular Dependency Guards:** Instruct the LLM to run `npm run dep-graph` before saving any major change. If a circular import is introduced, the compiler will flag it immediately, preventing regression crashes before they ever hit the repository.
