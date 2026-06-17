# Tapped In — UI/UX Refinement Plan (Animations · Workout Loader · Navigation)

> **Status:** Approved, not yet implemented. Pick up here in a fresh session.
> **Scope:** 3 refinements — (1) app-wide animation standardization, (2) workout-generation
> loader + latency, (3) custom neobrutalist navigation dock.

## Context

App tested in the gym surfaced three rough edges that make a polished, evidence-first
product feel like a stock React Native build:

1. **Animations are sparse and inconsistent.** Two motion systems coexist (legacy
   `Animated` API + Reanimated v4), timings/easings are hand-coded per component, and
   most screens (onboarding steps 1–4/6–7, home, workout, coach, tracker, profile) render
   statically with no entrance motion. The only choreographed moment is the step5 reveal.
2. **The workout-generation loader is flat.** Generation is a single Gemini call (no
   streaming, 25s timeout) that takes long enough that users feel stranded. The current
   loader is a pulsing box + rotating text + 3 fake progress blocks tied to a message
   timer — no real percentage, no sense of how long is left.
3. **Navigation looks default.** `app/(tabs)/_layout.tsx` uses the stock Expo Router
   `<Tabs>` bar with a top border. Functional but generic.

**Outcome:** a cohesive, on-brand motion language; a loud, insightful generation loader
with a real progress bar; and a custom neobrutalist floating dock — plus a genuine
reduction in (and better masking of) generation latency.

**Decisions confirmed with user:**
- Navigation → **custom brutalist floating dock** (active tab expands into a filled,
  section-accent-colored pill with label; inactive tabs icon-only).
- Loader hero → **my call**: blocky neobrutalist stickman lifter (View + Reanimated, no
  new native dependency), with a real percentage progress bar + staged labels.
- Animation scope → **standardize + key screens** (shared config, entrances on main
  screens + remaining onboarding steps, consistent press feedback, subtle tab cross-fade).

**Constraints / facts that shape the approach:**
- Available motion libs: `react-native-reanimated ~4.1.1`, `react-native-gesture-handler ~2.28.0`.
  No `react-native-svg`, `lottie`, `moti`, or `expo-linear-gradient` — **do not add native
  deps**; build figures from Views + Reanimated.
- RN `fetch` does not reliably stream response bodies on Android, so **true token
  streaming is out**; the progress bar uses a realistic time-based (asymptotic) model
  that snaps to 100% on completion — see §2.
- Design tokens already exist and must be reused: `constants/colors.ts` (incl. `withAlpha`),
  `constants/fonts.ts` (`F`), `constants/brutal.ts` (`BRUTAL`), primitives in
  `components/brutal.tsx`. Section accent colors already defined: workout=`orange`,
  coach/trainer=`violet`, science=`teal`, tracker/home=`primary` cobalt, fat=`pink`.
- Honor reduce-motion (step5 already demonstrates the `AccessibilityInfo.isReduceMotionEnabled()`
  pattern) — every new animation must short-circuit to its end state when enabled.

---

## 1. Animation standardization + key-screen pass

### 1a. Shared motion config — `constants/motion.ts` (new)
Single source of truth for durations, easings, and spring presets, replacing per-component
hardcoded values. Mirror values already in use so nothing regresses:
- `DUR = { fast: 200, base: 320, slow: 500, reveal: 800 }`
- `EASE = { out: Easing.out(Easing.cubic), inOut: Easing.inOut(Easing.ease), standard: Easing.bezier(0.2, 0, 0, 1) }`
- `SPRING = { sheet: { damping: 24, stiffness: 240 }, press: { damping: 18, stiffness: 320 } }`
- `STAGGER = 60` (ms between sequential list items)
- `reduceMotion()` helper wrapping `AccessibilityInfo.isReduceMotionEnabled()` so callers can `await` once.

### 1b. Reusable entrance component — `components/motion/Appear.tsx` (new)
Thin wrapper over Reanimated entering animations (`FadeInDown`, `FadeIn`) that:
- Accepts `delay`/`index` (multiplies by `STAGGER`) and a `from` direction.
- No-ops to a static `View` when reduce-motion is on.
- Used to wrap cards/sections so screens reveal with a gentle staggered fade+slide-up.

Apply `Appear` (staggered by child index) to the primary content blocks of:
- `app/(tabs)/results.tsx` (home cards), `app/(tabs)/workout.tsx` (dashboard sections),
  `app/(tabs)/trainer.tsx` (coach intro/messages), `app/(tabs)/index.tsx` (tracker cards),
  `app/(tabs)/profile.tsx` (profile sections).
- Onboarding form steps `app/(onboarding)/step1–4,6,7.tsx`: wrap the title + each
  option group so the static forms get the same life as step5.

### 1c. Consistent press micro-interaction
Extend the existing "press into shadow" pattern (already in `components/brutal.tsx`
`BrutalButton` and the tracker FAB in `app/(tabs)/index.tsx`) into a shared hook
`usePressScale()` in `components/motion/` (Reanimated `useSharedValue` scale → 0.97 on
pressIn, spring back with `SPRING.press`). Apply to interactive cards/chips that currently
have no feedback (muscle chips in `workout.tsx`, evidence cards, meal cards' tap target).
Keep haptics where they already fire.

### 1d. Subtle tab cross-fade
Tab switching is currently instant. Add a light opacity/translateY cross-fade on tab focus
via the custom dock (§3) using `react-native-screens` freeze + a Reanimated `FadeIn` on
each tab screen's root container (cheap, no shared-element complexity).

### 1e. Consolidation (low-risk, opportunistic)
Migrate the few legacy `Animated` usages that overlap the new config to read from
`constants/motion.ts` (`results.tsx` progress bar, `PaywallModal.tsx` spring). Leave
`step5.tsx`'s bespoke sequence intact (it works and is accessibility-aware) but point its
magic numbers at `DUR`/`EASE` where they line up. Do **not** rewrite step5 wholesale.

---

## 2. Workout generation — faster + a loud, insightful loader

### 2a. Make generation genuinely faster (latency levers)
Primary call path: `app/(tabs)/workout.tsx` → `generateWorkoutSkeleton()` → `callGemini()`
(direct client→Gemini fetch, `gemini-2.5-flash-lite` then `gemini-2.5-flash` fallback,
`thinkingBudget: 0`, `maxOutputTokens: 8192`).

- **Speculative prefetch (biggest perceived win):** the intake is a 3-step form; all inputs
  needed by `generateWorkoutSkeleton` are known by the end of step 2/start of step 3. Kick
  off the Gemini request when the user advances into the **final** intake step (a ref-held
  in-flight promise keyed by a hash of the inputs). When they tap "generate", await the
  existing promise instead of starting cold. If inputs changed after prefetch, discard and
  refetch. Net: hides several seconds of latency behind the user's last form interaction.
- **Trim input tokens:** `buildExerciseMenu()` + `WORKOUT_PROMPT` (`shared/prompts/workout.ts`)
  are large; reducing the menu to the equipment-filtered set only (already filtered) and
  tightening prompt prose lowers time-to-first-token. Verify the menu isn't sending exercises
  outside `equipSet`.
- **Right-size `maxOutputTokens`:** 8192 is generous; measure a typical skeleton and cap
  closer to real need (keeps the MAX_TOKENS retry as safety) — shorter generations finish sooner.
- Keep `flash-lite` primary (correct) and the existing abort/retry logic.

### 2b. New loader — `components/workout/GeneratingLoader.tsx` (new)
Replaces the inline `view === 'generating'` block (`workout.tsx` ~780–816) and the
`NeobrutalistLoader` helper. On-brand, View+Reanimated only:
- **Hero: blocky stickman lifter.** A figure assembled from bordered Views (head, torso,
  arms, legs) holding a barbell, animating a continuous rep cycle (bar travels up/down,
  knees bend) via Reanimated `withRepeat`/`withSequence`. Hard 3px borders (`BRUTAL.border`),
  `colors.primary` body on `colors.foreground` outline with the signature offset shadow.
  Subtle `highlight` (acid-yellow) flash at the top of each rep for the "loud" pop.
- **Real progress bar + percentage** underneath: a brutalist bar (reuse the visual language
  of `BrutalProgress`) filled by a Reanimated shared value. Progress model:
  `withTiming` toward 90% over the **measured expected duration** (asymptotic ease-out so it
  decelerates and never stalls at 0), then **snap to 100%** with a spring the moment the
  promise resolves. Percentage rendered in `F.mono`. This reads as a genuine progress bar
  without a real server signal.
- **Staged labels** replace the flat rotating list: tie each stage to a progress threshold
  ("reading your profile" → "balancing weekly volume" → "ordering the lifts" → "pulling the
  studies" → "finalizing your split") so text advances *with* the bar, not on an independent
  timer. Keep "build it yourself instead" fallback.
- Reduce-motion: figure holds a static pose, bar fills with a single `withTiming`, labels
  still advance.

Wire `handleGenerate()` to drive the loader's progress signal (start → resolve/throw) so the
bar completes exactly when the plan is ready.

---

## 3. Custom brutalist floating dock

### 3a. Custom tab bar — `components/navigation/BrutalDock.tsx` (new)
Replace the stock bar by passing `tabBar={(props) => <BrutalDock {...props} />}` to `<Tabs>`
in `app/(tabs)/_layout.tsx`. Keep the existing `<Tabs.Screen>` definitions, the
`href: null` hidden routes (evidence, recipes), and the `maybeShowPaywall` tab-press
listeners (re-dispatch them from the dock's `onPress`).

Design:
- A **floating** rounded-rect dock (not edge-to-edge): inset from screen bottom, `BRUTAL.radius`,
  3px `foreground` border, hard offset shadow (absolute shadow View, matching the FAB pattern
  in `index.tsx`), `colors.card`/`background` face.
- **Active tab expands** into a filled pill showing icon **+** label, tinted with that
  section's accent color (home/results=`primary`, tracker/index=`primary`, workout=`orange`,
  coach/trainer=`violet`, profile=`foreground`/neutral). Width animates with a Reanimated
  spring (`SPRING.press`); inactive tabs collapse to icon-only.
- Icons: keep `Ionicons` outline set already mapped (`home/flame/barbell/sparkles/person`).
- Press: scale/`usePressScale` + existing haptics; honor reduce-motion (instant width swap).
- Safe-area aware via `useSafeAreaInsets`; ensure screen content bottom padding accounts for
  the floating dock height (audit `paddingBottom`/`bottomPad` usages in the tab screens and
  the tracker FAB `bottom` offset so nothing is occluded).

### 3b. Tab focus cross-fade
Coordinate with §1d: the dock's active-index change triggers the lightweight `FadeIn` on the
incoming screen root.

---

## Critical files

**New**
- `constants/motion.ts` — shared durations/easings/springs + `reduceMotion()`.
- `components/motion/Appear.tsx`, `components/motion/usePressScale.ts` — reusable motion.
- `components/workout/GeneratingLoader.tsx` — stickman + progress loader.
- `components/navigation/BrutalDock.tsx` — custom tab bar.

**Modified**
- `app/(tabs)/_layout.tsx` — mount `BrutalDock` via `tabBar`, keep screens/listeners.
- `app/(tabs)/workout.tsx` — prefetch in intake flow; swap loader; drive progress; token trims.
- `shared/prompts/workout.ts` — prompt/menu trimming.
- `app/(tabs)/results.tsx`, `index.tsx`, `trainer.tsx`, `profile.tsx` — wrap content in `Appear`; press feedback; bottom-padding for floating dock.
- `app/(onboarding)/step1–4,6,7.tsx` — `Appear` entrances.
- `components/brutal.tsx` — optionally factor press-scale into shared hook; reuse `BrutalProgress` visual language in the loader bar.
- `PaywallModal.tsx`, `step5.tsx` — point existing magic numbers at `constants/motion.ts` (no behavior change).

---

## Verification

1. `npm run typecheck` — must stay clean (strict, no `any`).
2. `npx expo start` and exercise on device/emulator (per memory: reinstall APK + `adb reverse`
   + Metro after emulator restart):
   - **Navigation:** dock floats with hard shadow; active tab expands to accent pill with label;
     inactive icon-only; tab switch cross-fades; no content hidden behind the dock; hidden
     routes (evidence/recipes) still reachable; paywall still fires on first off-home tap.
   - **Loader:** trigger a real generation — stickman animates reps, progress bar climbs
     smoothly toward ~90% then snaps to 100% exactly when the plan appears; staged labels
     track the bar; "build it yourself" fallback works; error path returns to intake step 2.
   - **Prefetch:** add a temp timing log around the awaited promise; confirm perceived wait
     after tapping "generate" is materially shorter than a cold call. Confirm changing inputs
     after prefetch refetches (no stale plan).
   - **Animations:** main screens + onboarding steps reveal with staggered entrance; press
     feedback on cards/chips; enable OS reduce-motion and confirm every animation
     short-circuits to its end state (no motion, no broken layout).
3. Sanity-check both light and dark themes for the dock, loader, and entrances (cream-on-navy
   borders + offset shadows must still read).
