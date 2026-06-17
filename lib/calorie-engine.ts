import { CalorieResult, GoalMode, UserProfile } from "@/types";
import {
  classifyNEAT,
  getNEATMultiplier,
} from "@/lib/activity-classifier";

function calculateBMR(profile: UserProfile): number {
  // Mifflin-St Jeor — widely validated and commonly recommended
  if (profile.sex === "male") {
    return (
      10 * profile.weightKg +
      6.25 * profile.heightCm -
      5 * profile.age +
      5
    );
  } else {
    return (
      10 * profile.weightKg +
      6.25 * profile.heightCm -
      5 * profile.age -
      161
    );
  }
}

function getGoalCalories(
  maintenance: number,
  goal: GoalMode
): { target: number; deficit: number } {
  switch (goal) {
    case "fat_loss":
      // Conservative 300-400 kcal deficit — sustainable, protein-sparing
      const fatLossDeficit = Math.min(
        Math.max(maintenance * 0.18, 300),
        500
      );
      return {
        target: Math.round(maintenance - fatLossDeficit),
        deficit: -Math.round(fatLossDeficit),
      };
    case "recomp":
      // Mild deficit of 150-200 — allows simultaneous fat loss and muscle retention
      return {
        target: Math.round(maintenance - 175),
        deficit: -175,
      };
    case "muscle_gain":
      // Small evidence-based surplus — minimises fat gain
      const surplus = Math.min(maintenance * 0.1, 250);
      return {
        target: Math.round(maintenance + surplus),
        deficit: Math.round(surplus),
      };
    case "maintain":
      return { target: maintenance, deficit: 0 };
  }
}

function calculateCalories(profile: UserProfile): CalorieResult {
  const bmr = Math.round(calculateBMR(profile));
  const neatCategory = classifyNEAT(profile);
  const activityMultiplier = getNEATMultiplier(neatCategory);

  const maintenanceCalories = Math.round(bmr * activityMultiplier);
  const { target, deficit } = getGoalCalories(
    maintenanceCalories,
    profile.goalMode
  );

  return {
    bmr,
    maintenanceCalories,
    targetCalories: target,
    neatCategory,
    activityMultiplier,
    goalMode: profile.goalMode,
    deficit,
  };
}

export function getGoalLabel(goal: GoalMode): string {
  switch (goal) {
    case "fat_loss":
      return "Fat Loss";
    case "recomp":
      return "Recomposition";
    case "muscle_gain":
      return "Muscle Gain";
    case "maintain":
      return "Maintain";
  }
}

function getGoalExplanation(goal: GoalMode, deficit: number): string {
  switch (goal) {
    case "fat_loss":
      return `A ${Math.abs(deficit)} kcal deficit — sustainable and enough to lose 0.3–0.5 kg/week without tanking your muscle mass or metabolism.`;
    case "recomp":
      return `A ${Math.abs(deficit)} kcal mild deficit — supports body recomposition. Lose fat slowly while preserving (or even gaining) muscle with high protein and good training.`;
    case "muscle_gain":
      return `A ${deficit} kcal controlled surplus — enough to support muscle growth without significant fat accumulation. This is a slow, evidence-based approach to gaining size.`;
    case "maintain":
      return `Maintenance calories — supporting performance and muscle preservation without intentional weight change.`;
  }
}
