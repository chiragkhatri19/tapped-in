// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// testScenarios.ts — Sample test cases covering real-world user archetypes
//
// Run with: pnpm --filter @workspace/calc-engine run examples
// ─────────────────────────────────────────────────────────────────────────────

import { generatePlan, EvidenceMap } from "./index";
import type { UserProfile } from "./index";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function divider(char = "═", width = 62): string {
  return char.repeat(width);
}

function printPlan(label: string, user: UserProfile): void {
  const plan = generatePlan(user);

  console.log("\n" + divider());
  console.log(`  ${label}`);
  console.log(divider());

  const m = plan.maintenance;
  console.log(`  BMR:         ${m.bmr} kcal`);
  console.log(`  Maintenance: ${m.maintenance_low}–${m.maintenance_high} kcal  (best: ${m.maintenance_best})`);

  const g = plan.goal;
  const adjSign = g.adjustment >= 0 ? "+" : "";
  console.log(`  Goal (${g.goal_type}): ${g.target_calories} kcal  [${adjSign}${g.adjustment} kcal vs maintenance]`);

  const mac = plan.macros;
  console.log(
    `  Protein:  ${mac.protein_g}g  (${mac.protein_g_per_kg} g/kg)  — ${mac.protein_calories} kcal`
  );
  console.log(`  Fat:      ${mac.fat_g}g  — ${mac.fat_calories} kcal`);
  console.log(`  Carbs:    ${mac.carb_g}g  — ${mac.carb_calories} kcal`);

  const totalMacroKcal = mac.protein_calories + mac.fat_calories + mac.carb_calories;
  console.log(`  Total macro kcal: ${totalMacroKcal}  (target: ${g.target_calories})`);

  console.log(`  Fiber:    ${plan.nutrition.fiber_g}g/day`);

  console.log(`\n  Recommendation: ${plan.recommendation.recommended_goal}`);
  console.log(`  Reason: ${plan.recommendation.reason}`);

  console.log(`\n  Assumptions:`);
  plan.meta.assumptions.forEach((a, i) => console.log(`    ${i + 1}. ${a}`));
}

// ─────────────────────────────────────────────
// TEST CASE 1 — Low-NEAT Indian male, recomp
// Desk job, trains 4 days, low steps, moderate sitting
// Expected: conservative protein (~1.6 g/kg), recomp target
// ─────────────────────────────────────────────

const scenario1: UserProfile = {
  age: 26,
  sex: "male",
  height_cm: 170,
  weight_kg: 78,
  body_fat_percentage: 21,
  training_days_per_week: 4,
  cardio_days_per_week: 1,
  cardio_minutes_per_session: 20,
  steps_per_day: 4000,
  sitting_hours_per_day: 9,
  goal: "recomp",
  diet_preference: "veg",
};

// ─────────────────────────────────────────────
// TEST CASE 2 — Female, fat loss, moderate deficit
// Active-ish lifestyle, moderate training
// Expected: protein ~1.7 g/kg, moderate deficit applied
// ─────────────────────────────────────────────

const scenario2: UserProfile = {
  age: 30,
  sex: "female",
  height_cm: 161,
  weight_kg: 65,
  body_fat_percentage: 29,
  training_days_per_week: 3,
  cardio_days_per_week: 2,
  cardio_minutes_per_session: 30,
  steps_per_day: 7000,
  sitting_hours_per_day: 7,
  goal: "fat_loss",
  diet_preference: "non_veg",
  deficit_preference: "moderate",
};

// ─────────────────────────────────────────────
// TEST CASE 3 — Lean male, lean bulk
// Trains frequently, good steps, wanting to add mass
// Expected: protein ~1.6 g/kg, small surplus
// ─────────────────────────────────────────────

const scenario3: UserProfile = {
  age: 24,
  sex: "male",
  height_cm: 176,
  weight_kg: 72,
  body_fat_percentage: 13,
  training_days_per_week: 5,
  cardio_days_per_week: 2,
  cardio_minutes_per_session: 25,
  steps_per_day: 9000,
  sitting_hours_per_day: 6,
  goal: "lean_bulk",
  diet_preference: "non_veg",
};

// ─────────────────────────────────────────────
// TEST CASE 4 — Ultra-sedentary user
// Very low steps, high sitting, minimal activity
// Expected: ultra_low NEAT, conservative maintenance estimate
// ─────────────────────────────────────────────

const scenario4: UserProfile = {
  age: 38,
  sex: "male",
  height_cm: 174,
  weight_kg: 92,
  body_fat_percentage: 27,
  training_days_per_week: 1,
  cardio_days_per_week: 0,
  cardio_minutes_per_session: 0,
  steps_per_day: 2000,
  sitting_hours_per_day: 12,
  goal: "fat_loss",
  diet_preference: "non_veg",
  deficit_preference: "mild",
};

// ─────────────────────────────────────────────
// RUN ALL SCENARIOS
// ─────────────────────────────────────────────

console.log("\n" + divider("▓"));
console.log("  TAPPED IN — Calculation Engine v2  |  Test Scenarios");
console.log(divider("▓"));

printPlan("Scenario 1 — Low-NEAT Indian Male, Recomp", scenario1);
printPlan("Scenario 2 — Female, Fat Loss (moderate deficit)", scenario2);
printPlan("Scenario 3 — Lean Male, Lean Bulk", scenario3);
printPlan("Scenario 4 — Ultra-Sedentary Male, Fat Loss (mild deficit)", scenario4);

// ─────────────────────────────────────────────
// PROTEIN SANITY CHECK
// Verifies protein stays in the intended 1.6–1.8 g/kg range
// ─────────────────────────────────────────────

console.log("\n" + divider());
console.log("  Protein Sanity Check — all scenarios");
console.log(divider());

const scenarios: [string, UserProfile][] = [
  ["S1 (recomp, 78kg)", scenario1],
  ["S2 (fat loss, 65kg)", scenario2],
  ["S3 (lean bulk, 72kg)", scenario3],
  ["S4 (fat loss mild, 92kg)", scenario4],
];

scenarios.forEach(([name, user]) => {
  const plan = generatePlan(user);
  const { protein_g, protein_g_per_kg } = plan.macros;
  const flag = protein_g_per_kg > 2.0 ? "  ⚠ ABOVE 2.0 g/kg" : "";
  console.log(`  ${name}: ${protein_g}g  (${protein_g_per_kg} g/kg)${flag}`);
});

// ─────────────────────────────────────────────
// EVIDENCE MAP SAMPLE
// ─────────────────────────────────────────────

console.log("\n" + divider());
console.log("  Evidence Map — protein_logic");
console.log(divider());
const entry = EvidenceMap["protein_logic"];
console.log(`  Title:      ${entry.title}`);
console.log(`  Summary:    ${entry.summary}`);
console.log(`  Citation:   ${entry.citation_placeholder}`);
console.log(`  Confidence: ${entry.confidence}`);
console.log("");
