import { JobType, NEATCategory, UserProfile } from "@/types";

export function classifyNEAT(profile: UserProfile): NEATCategory {
  let score = 0;

  // Steps contribution
  if (profile.dailySteps < 3000) score += 3;
  else if (profile.dailySteps < 5000) score += 2;
  else if (profile.dailySteps < 8000) score += 1;
  else score += 0;

  // Sitting hours
  if (profile.sittingHoursPerDay >= 10) score += 3;
  else if (profile.sittingHoursPerDay >= 8) score += 2;
  else if (profile.sittingHoursPerDay >= 6) score += 1;
  else score += 0;

  // Job type
  const jobScores: Record<JobType, number> = {
    desk_job: 3,
    light_activity: 1,
    moderate_activity: 0,
    heavy_labor: -1,
  };
  score += jobScores[profile.jobType];

  // Cardio — guard against undefined on profiles saved before cardioDurationMin was added
  const weeklyCardioMin =
    (profile.cardioFrequency ?? 0) * (profile.cardioDurationMin ?? 0);
  if (weeklyCardioMin < 60) score += 1;
  else if (weeklyCardioMin > 150) score -= 1;

  if (score >= 7) return "ultra_low";
  if (score >= 4) return "low";
  return "moderate";
}

export function getNEATMultiplier(category: NEATCategory): number {
  switch (category) {
    case "ultra_low":
      return 1.2;
    case "low":
      return 1.3;
    case "moderate":
      return 1.45;
    case "active":
      return 1.6;
    case "very_active":
      return 1.75;
  }
}

export function getNEATLabel(category: NEATCategory): string {
  switch (category) {
    case "ultra_low":
      return "Ultra Low NEAT";
    case "low":
      return "Low NEAT";
    case "moderate":
      return "Moderate NEAT";
    case "active":
      return "Active NEAT";
    case "very_active":
      return "Very Active NEAT";
  }
}

export function getNEATDescription(category: NEATCategory): string {
  switch (category) {
    case "ultra_low":
      return "Very sedentary lifestyle — desk job, minimal steps, low daily movement. Your maintenance calories are lower than most apps assume.";
    case "low":
      return "Below-average daily movement. Desk job with limited steps outside of work. We've applied a conservative multiplier — generic estimates tend to inflate this.";
    case "moderate":
      return "Decent daily movement. Your lifestyle includes moderate walking and activity outside structured workouts.";
    case "active":
      return "Highly active lifestyle. You get plenty of steps and train frequently.";
    case "very_active":
      return "Extremely active. Manual labor or very high daily movement plus training.";
  }
}
