# docs/INTEGRATION_STATUS.md — Integration & Stack Migration Status

> Core record tracking our prototype scaffold exits, Zustand storage migrations, and feature completion status.
> **Last updated:** June 2026

---

## 1. Scaffold Cleanup Audit (2026-05-17)

All prototype Replit folders and redundant codebase duplicates have been fully exited and removed from the active project space:

* **Scaffold Folder Exited:** `tapped-in-scaffold/` has been permanently deleted from the directory structure.
* **Junk Files Cleared:** Extraneous developer items (`tracked_files.txt`, `pi-session-*.html`, `build.log`) are deleted.
* **Direct Roots Active:** Screens and features operate directly from `app/(tabs)/` in the root workspace.

---

## 2. Zustand & MMKV Storage Migration (Phase A - Complete)

The legacy AsyncCompat adapters and Context wrappers have been successfully refactored to use synchronous MMKV stores with Zustand state management:

* **Tracker Store:** Integrated under `stores/tracker-store.ts`. The legacy `context/tracker-context.tsx` has been retired.
* **Profile Store:** Integrated under `stores/profile-store.ts`. The legacy `context/profile-context.tsx` has been retired.
* **Lightweight Helpers:** Active under `lib/storage.ts`. AsyncStorage is completely replaced by `react-native-mmkv` persistence.

---

## 3. SQLite & Drizzle Migration (Phase B - In Progress)

The daily tracker is ready to migrate query-heavy, relational logs from flat MMKV JSON stores to Drizzle managed SQLite:

* **Drizzle Schemas:** Drafted under `lib/db/schema.ts` (defining daily meal logs, ingredients, and oil entries).
* **MMKV-to-SQLite Migrator:** Preparing a one-time migration hook to safely transfer existing user daily logs from MMKV `tapped_in_tracker_logs` directly into SQLite tables on next startup.

---

## 4. Current Feature & Workspace Integration Matrix

All features are now fully standard-compliant, neobrutalist-themed, and organized within the primary route directories:

| Feature / Screen | Production Path | Status | State Storage Engine |
|---|---|---|---|
| **Welcome Screen** | `app/welcome.tsx` | Complete (Rebranded) | Static |
| **Onboarding Steps** | `app/(onboarding)/step1-4.tsx` | Complete (Rebranded) | React Context (Transient) |
| **Daily Calorie Tracker** | `app/(tabs)/index.tsx` | Complete (SQLite planned) | `tracker-store` (Zustand + MMKV) |
| **Log Meal Form** | `app/log-meal.tsx` | Complete (Hardened) | `tracker-store` (Zustand + MMKV) |
| **Calorie & Macro Results** | `app/(tabs)/results.tsx` | Complete | `profile-store` (Zustand + MMKV) |
| **Science & Citations** | `app/(tabs)/evidence.tsx` | Complete | Static Definitions |
| **User Profile Details** | `app/(tabs)/profile.tsx` | Complete | `profile-store` (Zustand + MMKV) |
| **Workout Dashboard** | `components/workout/` | Complete (Zustand sync) | `workout-store` (Zustand + MMKV) |
| **Routine builder** | `components/workout/` | Complete | `workout-store` (Zustand + MMKV) |
| **Desi & Global Foods** | `data/foods.ts` | Complete | SQLite relational cache |
| **Recipe Feed** | `app/(tabs)/recipes.tsx` | Parked (Phase 2A) | MMKV local drafts |
| **Trainer Bot** | `app/(tabs)/trainer.tsx` | Parked (Phase 5) | MMKV chat history |
