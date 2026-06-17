# Replit Prompt: Tapped In Sleep & Recovery Screen

> Paste everything inside the horizontal rules below into Replit as a single prompt. It is written so Replit reproduces our exact design system and file layout, so the result drops into our repo with zero edits. Do not remove any section. There are no em dashes in this prompt on purpose; do not add any in the generated code or copy.

---

## ROLE AND GOAL

You are building ONE feature for an existing React Native app called "Tapped In", an evidence-first fitness app with a neo-brutalist design. Build a complete, self-contained **Sleep & Recovery** feature: one screen plus its store, types, and small sub-components. It must compile and run in Expo, and it must match the exact design system specified below so it can be copied into the main repo without changing anything.

Hard rules:
1. TypeScript strict. No `any`. No type assertions without a one-line comment explaining why.
2. Do NOT invent your own design system, colors, fonts, or spacing. Use ONLY the tokens and primitive components defined in section "DESIGN SYSTEM (RECREATE EXACTLY)" below.
3. All numbers (durations, hours, counts, scores) render in the mono font `F.mono` / `F.monoSemi`. All headings use `F.displayBold`. All body and UI text uses the Hanken family `F.bodyReg` / `F.bodyMed` / `F.bodySemi` / `F.bodyBold`.
4. Copy voice is lowercase, blunt, encouraging, no fluff. Example: "log last night", "you slept 7h 20m", "recovery is where muscle is built". Do NOT use em dashes anywhere in code, comments, or UI copy. Use commas or hyphens.
5. Never auto-save device data without user confirmation (mirrors the app rule that scans never auto-log).
6. Keep all styles in a single `StyleSheet.create` per file. Match the existing border, shadow, and radius conventions exactly via the `BRUTAL` constants.

## TECH STACK (MUST MATCH)

- Expo SDK 54, React Native 0.81, React 19, expo-router v6 (file-based routing), TypeScript strict.
- State: Zustand v5 with `persist` middleware.
- Animation: `react-native-reanimated` v4 (already used for entrance animations via an `Appear` wrapper, defined below).
- Icons: `@expo/vector-icons` (use `Feather` and `Ionicons` only, both already installed). Do not add `lucide` or any new icon library.
- Date and time picker: `@react-native-community/datetimepicker`. Add it to dependencies.
- Haptics: `expo-haptics`.
- Safe area: `react-native-safe-area-context` (`useSafeAreaInsets`).
- Do NOT add any other dependencies beyond `@react-native-community/datetimepicker`.

## EXACT FILE LAYOUT TO PRODUCE

Recreate this folder structure exactly (paths matter, our repo uses the `@/` alias mapped to project root):

```
app/
  sleep.tsx                      # the screen (default export), top-level route
components/
  sleep/
    SleepLogModal.tsx            # bottom-sheet modal for manual + estimate logging
    SleepDashboard.tsx           # 7-day bars, averages, debt, consistency
    SleepRingBadge.tsx           # small recovery ring/donut for last night
    SleepScienceCard.tsx         # one cited science card (static content ok)
stores/
  sleep-store.ts                 # zustand + persist, mirrors tracker-store pattern
data/
  sleep-types.ts                 # SleepEntry + helpers
lib/
  sleep-utils.ts                 # pure duration/format/debt helpers (unit-testable)
_replit_stubs/                   # THROWAWAY: only so it runs in Replit. See notes.
  storage.ts
  components-brutal.tsx
  constants-fonts.ts
  constants-brutal.ts
  constants-colors.ts
  hooks-useColors.ts
  components-motion-Appear.tsx
```

IMPORTANT about `_replit_stubs/`: The real app already contains `lib/storage.ts`, `components/brutal.tsx`, `constants/fonts.ts`, `constants/brutal.ts`, `constants/colors.ts`, `hooks/useColors.ts`, and `components/motion/Appear.tsx`. To make your project run standalone in Replit, place runnable copies of those files at the real paths too, but ALSO leave the originals listed in `_replit_stubs/` as a manifest so we know which files to discard on integration. The files that import these (your sleep files) must import from the real `@/` paths (for example `@/components/brutal`, `@/hooks/useColors`, `@/lib/storage`). When we integrate, we copy ONLY the sleep files and our existing primitives win.

## DESIGN SYSTEM (RECREATE EXACTLY)

Create these files at their real paths with this exact content so your screen looks identical to ours.

### constants/colors.ts
```typescript
const colors = {
  light: {
    background: '#F2ECDE', foreground: '#111111', card: '#FBF7EC', cardForeground: '#111111',
    primary: '#2B3AFF', primaryForeground: '#FFFFFF', secondary: '#FBF7EC', secondaryForeground: '#111111',
    muted: '#E7E0CE', mutedForeground: '#4A453B', border: '#111111', input: '#111111', surface: '#F2ECDE',
    tag: '#E8FF00', tagText: '#111111', highlight: '#E8FF00', pistachio: '#E8FF00', persimmon: '#FF3B2F',
    mustard: '#E8FF00', iris: '#2B3AFF', pop: '#E8FF00', pink: '#FF3DA5', teal: '#00C2A8', orange: '#FF7A1A',
    violet: '#7C5CFF', blue: '#2B3AFF', destructive: '#FF3B2F', destructiveForeground: '#FFFFFF',
    accent: '#E8FF00', accentForeground: '#111111', warning: '#FF3B2F', info: '#2B3AFF', oil: '#FF7A00',
    text: '#111111', tint: '#2B3AFF',
  },
  dark: {
    background: '#0D0F1C', foreground: '#F2ECDE', card: '#131626', cardForeground: '#F2ECDE',
    primary: '#3B4AFF', primaryForeground: '#FFFFFF', secondary: '#131626', secondaryForeground: '#F2ECDE',
    muted: '#1A1D2E', mutedForeground: '#9BA3C0', border: '#F2ECDE', input: '#F2ECDE', surface: '#0D0F1C',
    tag: '#E8FF00', tagText: '#111111', highlight: '#E8FF00', pistachio: '#E8FF00', persimmon: '#FF5247',
    mustard: '#E8FF00', iris: '#3B4AFF', pop: '#E8FF00', pink: '#FF4FAF', teal: '#00CCAF', orange: '#FF7A1A',
    violet: '#8A6BFF', blue: '#3B4AFF', destructive: '#FF5247', destructiveForeground: '#FFFFFF',
    accent: '#E8FF00', accentForeground: '#111111', warning: '#FF5247', info: '#3B4AFF', oil: '#FF7A1A',
    text: '#F2ECDE', tint: '#3B4AFF',
  },
  radius: 10,
};
export default colors;
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return hex + a.toString(16).padStart(2, '0');
}
```

### hooks/useColors.ts
```typescript
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
// Standalone Replit version: follow the OS scheme. The real app adds a theme store; that is fine, the API is identical.
export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
```

### constants/fonts.ts
```typescript
export const F = {
  displayBold: 'BricolageGrotesque_700Bold', displaySemi: 'BricolageGrotesque_600SemiBold', displayMed: 'BricolageGrotesque_500Medium',
  bodyReg: 'HankenGrotesk_400Regular', bodyMed: 'HankenGrotesk_500Medium', bodySemi: 'HankenGrotesk_600SemiBold', bodyBold: 'HankenGrotesk_700Bold',
  mono: 'GeistMono_400Regular', monoMed: 'GeistMono_500Medium', monoSemi: 'GeistMono_600SemiBold',
} as const;
```
Load these fonts in the Replit app root with `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/hanken-grotesk`, and `@expo-google-fonts/geist-mono` so the preview renders correctly. The font family string values above must stay exactly as written.

### constants/brutal.ts
```typescript
export const BRUTAL = {
  border: 3, borderThin: 2, shadowLg: 8, shadow: 5, shadowSm: 3, radius: 10, radiusLg: 14, radiusPill: 100,
} as const;
```

### components/brutal.tsx (primitives, recreate exactly)
Provide these components with these EXACT prop signatures and behavior:

- `BrutalBox({ children, style, shadow = true, offset = BRUTAL.shadow, radius = BRUTAL.radiusLg, background })`: a card with a `BRUTAL.border` (3px) border in `colors.foreground`, background `background ?? colors.card`, rounded `radius`, and a hard offset drop shadow (a solid `colors.foreground` rectangle translated by `offset` in x and y, behind the face). The shadow must be a real offset block, not a soft shadow. When `shadow` is false, render the face with no shadow. The component splits incoming `style` so margin/position go on the outer wrapper and padding/background go on the inner face (write a small `splitStyle` helper that routes `margin*`, `position`, `top/left/right/bottom`, `flex`, `alignSelf`, `width`, `height` to outer and the rest to inner).
- `BrutalButton({ label, onPress, disabled, loading, variant = 'primary', icon, height = 56, style })`: a button that visually presses INTO its shadow. Default height 56, border 3px, radius `BRUTAL.radius` (10). `variant` primary uses `colors.primary` bg with `colors.primaryForeground` text; `pop` uses `colors.highlight` bg with `#111111` text; `secondary` uses `colors.card` bg with `colors.foreground` text. On press, translate the face by `BRUTAL.shadow` (5) in x and y and hide the shadow so it looks pressed. Disabled uses `colors.muted` bg and `colors.mutedForeground` text. `loading` shows an `ActivityIndicator`. Optional `icon` renders to the right of the label. Button label text uses `F.bodyBold`, fontSize 16.
- `BrutalChip({ label, selected, onPress, style })`: a small pill-ish toggle with 3px border, radius 10, `shadowSm` (3) offset shadow, bg `colors.primary` when selected else `colors.card`, text `colors.primaryForeground` when selected else `colors.foreground`, `F.bodySemi`, paddingHorizontal 14, paddingVertical 9. Presses into its small shadow.
- `BrutalInput({ value, onChangeText, placeholder, suffix, keyboardType })`: a bordered input row, 3px border, radius 10, mono font for the value. `suffix` renders a muted unit label on the right (for example "min" or "kg"). Use `colors.background` as the field fill and `colors.mutedForeground` for placeholder.

All four must use `useColors()` and `BRUTAL` and must visually match the descriptions exactly.

### components/motion/Appear.tsx
```typescript
import React from 'react';
import Animated, { FadeInDown, FadeIn, ReduceMotion } from 'react-native-reanimated';
import { ViewStyle, StyleProp } from 'react-native';
type Direction = 'up' | 'none';
const STAGGER = 60; const BASE = 420;
interface AppearProps { children: React.ReactNode; index?: number; delay?: number; from?: Direction; style?: StyleProp<ViewStyle>; }
export function Appear({ children, index = 0, delay, from = 'up', style }: AppearProps) {
  const totalDelay = delay !== undefined ? delay : index * STAGGER;
  const entering = from === 'up'
    ? FadeInDown.duration(BASE).delay(totalDelay).reduceMotion(ReduceMotion.System)
    : FadeIn.duration(BASE).delay(totalDelay).reduceMotion(ReduceMotion.System);
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}
```

### lib/storage.ts (Replit stub, real app overrides on integration)
Create a minimal stub exposing the SAME surface our store imports, so `stores/sleep-store.ts` can import `{ zustandMMKVStorage, STORAGE_KEYS }` from `@/lib/storage` exactly like our real `tracker-store` does. In Replit, back it with an in-memory object (or `@react-native-async-storage/async-storage` if you prefer, but do NOT add it as a dep, use in-memory). Shape:
```typescript
// THROWAWAY in the real repo. Provides the same named exports our real lib/storage.ts has.
export const STORAGE_KEYS = { SLEEP_LOGS: 'tapped_in_sleep_logs_v1' } as const;
const mem = new Map<string, string>();
export const zustandMMKVStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); },
};
```

## DATA MODEL

### data/sleep-types.ts
```typescript
export type SleepSource = 'manual' | 'estimate' | 'healthkit' | 'health_connect';

export interface SleepEntry {
  dateKey: string;      // the WAKE date in YYYY-MM-DD (the morning the user woke up)
  bedtime: string;      // ISO datetime the user fell asleep
  wakeTime: string;     // ISO datetime the user woke up
  durationMin: number;  // computed minutes asleep
  quality?: 1 | 2 | 3 | 4 | 5;
  wakeCount?: number;   // times woken during the night
  source: SleepSource;
  notes?: string;
}

export const SLEEP_TARGET_MIN = 480; // 8h default target, configurable later
```

### lib/sleep-utils.ts (pure, no React)
Implement and export:
- `getTodayKey(): string` returns local date as `YYYY-MM-DD`.
- `computeDurationMin(bedtimeISO, wakeISO): number` handles the overnight case where wake is the next calendar day (if wake <= bedtime, add 24h).
- `formatDuration(min): string` returns like `7h 20m`.
- `formatClock(iso): string` returns like `11:15 pm` lowercase.
- `recentEntries(entries, days): SleepEntry[]` returns the last `days` nights ending today, filling missing nights with `null`-equivalent placeholders the dashboard can render as empty bars.
- `averageDurationMin(entries): number`.
- `sleepDebtMin(entries, days, targetMin): number` cumulative shortfall vs target across the window (never negative per night summed).
- `bedtimeConsistency(entries): { variminutes: number; label: string }` standard-deviation-ish spread of bedtimes, with a label like "tight", "ok", "all over the place".

## STORE

### stores/sleep-store.ts
Mirror our `tracker-store` pattern exactly: Zustand `create` with `persist`, `createJSONStorage(() => zustandMMKVStorage)`, name `STORAGE_KEYS.SLEEP_LOGS`, version 1. Keep entries keyed by wake `dateKey`.

```typescript
interface SleepState {
  entries: Record<string, SleepEntry>;     // keyed by dateKey
  lastNight: () => SleepEntry | null;       // entry for today's wake date
  recent: (days: number) => SleepEntry[];
  upsert: (entry: SleepEntry) => void;      // add or replace by dateKey
  remove: (dateKey: string) => void;
}
```
Export selector hooks like `useLastNight()` and `useRecentSleep(days)` so screens subscribe narrowly, matching our convenience-hook convention.

## THE SCREEN: app/sleep.tsx

A scrollable screen, default export named `SleepScreen`. Use `useSafeAreaInsets()` for top and bottom padding. Background `colors.background`. Horizontal padding 20, vertical gap 16 between blocks. Wrap each major block in `<Appear index={n}>` with increasing index for staggered entrance.

Layout top to bottom:

1. **Header row**: left side a lowercase greeting line in `F.bodyMed` muted ("recovery") and a big title in `F.displayBold`, italic, fontSize 28, letterSpacing -0.8, that reads the current date like "tuesday, june 10". Right side: a back chevron pressable (`Feather name="chevron-left"`) calling `router.back()`. Keep it consistent with a brutalist header (no native nav header, set the route to `headerShown: false` via a `Stack.Screen` options or expo-router config).

2. **Last night hero card** (`BrutalBox` with `offset={BRUTAL.shadowLg}`): shows last night's sleep. If an entry exists: a large mono duration like `7h 20m` (fontSize 48, letterSpacing -1.5), a subline with bedtime and wake using `formatClock` ("11:15 pm to 6:35 am"), a small `SleepRingBadge` on the right showing fill vs `SLEEP_TARGET_MIN`, and a quality row of 5 dots filled to `quality`. If NO entry: an empty state with copy "no sleep logged for last night" and a `BrutalButton variant="primary" label="log last night"` opening the log modal.

3. **Primary actions row**: two buttons side by side. `BrutalButton label="log sleep"` (primary) opens the modal in manual mode. `BrutalButton variant="secondary" label="quick estimate"` opens the modal in estimate mode.

4. **Recovery dashboard** (`SleepDashboard`): a `BrutalBox` containing a section mini-title "7-day recovery" in `F.displayBold` italic fontSize 17, then a row of 7 vertical bars (plain Views, no chart library) whose heights map to nightly hours against the window max, colored `colors.violet` when at or above target and `colors.muted` when below or empty. Under the bars show three stat tiles: avg sleep (`formatDuration(averageDurationMin)`), sleep debt (`formatDuration(sleepDebtMin)`), and bedtime consistency label. Numbers in mono. Tapping a bar opens that night in the log modal for editing.

5. **Device sync teaser** (`BrutalBox`, not yet functional): a row with a `Feather name="watch"` icon square, title "connect your tracker", subline "auto-import sleep from apple health or health connect. coming soon." Disabled look, no action yet. This is a placeholder for a later phase; do not implement health APIs.

6. **Science card** (`SleepScienceCard`): a `BrutalBox` styled like an evidence card. Top row has a small badge "HIGH" on `colors.teal` and a category label "recovery". Then a claim in `F.bodyBold` fontSize 15 such as "sleep is when muscle is actually built", a 2 to 3 line short explanation in muted body text about sleep, recovery, and hormonal repair, and a "tap to read" affordance. Use static placeholder citation text (title, authors, year, journal, doi as plain strings). Do not fetch anything.

## THE MODAL: components/sleep/SleepLogModal.tsx

A bottom-sheet style `Modal` (`animationType="slide"`, transparent) anchored to the bottom, with a `KeyboardAvoidingView`. Props:
```typescript
{ visible: boolean; mode: 'manual' | 'estimate'; initial?: SleepEntry; onClose: () => void; onSave: (entry: SleepEntry) => void; }
```
Sheet content (matches our weight-check-in modal style: top border-only rounded sheet, 24 padding, gap 14):
- Title in `F.displayBold` italic: "log last night" for manual, "quick estimate" for estimate.
- Sub line muted: manual = "be honest. accurate sleep makes the recovery ring real." estimate = "rough is fine. this counts for less but still counts."
- Two time fields using `@react-native-community/datetimepicker` in time mode: "went to bed" and "woke up". Show the picked time via `formatClock`. On Android open the picker on press; on iOS use the inline spinner inside a small bordered box.
- Manual mode only: a quality selector (5 `BrutalChip` style dots or chips labelled 1 to 5), a wake-count stepper (minus and plus `Pressable`s around a mono number), and a notes `BrutalInput`.
- Estimate mode: hide quality, wake-count, notes. Just the two times.
- Live computed duration shown prominently via `computeDurationMin` and `formatDuration`, updating as times change.
- Save button: `BrutalButton label="save sleep"`. On press, build a `SleepEntry` with `source` set to `manual` or `estimate`, `dateKey` from the wake date, fire `Haptics.notificationAsync(Success)`, call `onSave`, then `onClose`. Validate that duration is between 1 and 16 hours; if invalid, do not save and show an inline brutalist warning row (icon `Feather alert-triangle`, `colors.orange`).
- A "skip for now" text pressable under the save button calling `onClose`.

## SUB-COMPONENTS

- `components/sleep/SleepRingBadge.tsx`: a compact circular progress badge (donut) showing `fill` 0 to 1 vs target. Implement with two stacked Views and a rotation trick, or a simple thick-bordered arc, or `react-native-svg` ONLY if already available; if not available, use a chunky segmented ring made of Views. Center shows percent in mono. Color `colors.violet`, track `colors.muted`, border `colors.foreground`. Do not add new deps for this; the View-based version is acceptable and preferred.
- `components/sleep/SleepDashboard.tsx`: pure presentational, receives `entries: SleepEntry[]` and renders bars and stat tiles as described.
- `components/sleep/SleepScienceCard.tsx`: static cited card as described, with an `onPress` prop (can be a no-op for now) and the same visual language as our home "science pick" card.

## INTERACTIONS AND STATE

- The screen owns modal visibility and mode in local `useState`. Saving writes through `useSleepStore().upsert`. Reading uses the selector hooks.
- Use `expo-haptics` `selectionAsync()` on button presses and `notificationAsync(Success)` on successful save.
- Everything must work fully offline with the in-memory storage stub.

## ACCEPTANCE BEFORE YOU FINISH

Verify ALL of these, then fix anything failing:
1. `tsc --noEmit` passes with strict mode, zero `any`.
2. The app runs in Expo and the Sleep screen renders with the fonts loaded.
3. Logging a manual entry updates the hero card and the 7-day dashboard immediately.
4. Quick estimate saves an entry flagged `source: 'estimate'`.
5. Overnight duration math is correct across midnight (for example bed 11:30 pm, wake 7:00 am gives 7h 30m).
6. No em dashes exist anywhere in the code, comments, or UI copy.
7. All numbers use the mono font, all headings use `F.displayBold`, all body text uses the Hanken family.
8. The only added dependency is `@react-native-community/datetimepicker`.
9. The sleep files import shared primitives from the real `@/` paths, not from `_replit_stubs/`.

## DELIVERY FORMAT (DO THIS LAST)

When and ONLY when every item in "ACCEPTANCE BEFORE YOU FINISH" passes:
1. Print a short file tree of everything you created, grouped into two lists: "INTEGRATE THESE" (the sleep screen, components/sleep/*, stores/sleep-store.ts, data/sleep-types.ts, lib/sleep-utils.ts) and "DISCARD ON INTEGRATION" (the recreated primitives and the storage stub, since the main repo already has its own).
2. Print the one line we must add to dependencies: the exact `@react-native-community/datetimepicker` version compatible with Expo SDK 54.
3. Package the entire project as a single downloadable **.zip** file and provide the download link. Do not paste the whole codebase back as text; the deliverable is the zip plus the two short lists above.
```
```
---

## After you receive the zip (notes for us, not for Replit)

When Chirag returns the zip, integration is: copy only the "INTEGRATE THESE" files into the repo, run `npm i @react-native-community/datetimepicker` (the version Replit prints) and `npx expo prebuild --clean` if a dev build is needed, then do the dock swap and home Profile button per [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md) A.0, wire the Recovery ring per [STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md), and run `npm run typecheck`.
