import React, { createContext, useContext, useState } from "react";

import { UnitSystem, UserProfile, GoalTimeline } from "@/types";

type OnboardingData = Partial<UserProfile> & { unitSystem?: UnitSystem };

interface OnboardingContextValue {
  data: OnboardingData;
  setData: (updates: OnboardingData) => void;
  initFromProfile: (profile: UserProfile) => void;
  buildProfile: () => UserProfile | null;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<OnboardingData>({});

  const setData = (updates: OnboardingData) => {
    setDataState((prev) => ({ ...prev, ...updates }));
  };

  const buildProfile = (): UserProfile | null => {
    const {
      age, sex, heightCm, weightKg, experience,
      trainingDaysPerWeek, cardioFrequency, cardioDurationMin,
      dailySteps, sittingHoursPerDay, jobType, goalMode,
    } = data;

    if (
      age == null || sex == null || heightCm == null || weightKg == null ||
      experience == null || trainingDaysPerWeek == null || cardioFrequency == null ||
      cardioDurationMin == null || dailySteps == null || sittingHoursPerDay == null ||
      jobType == null || goalMode == null
    ) {
      return null;
    }

    return {
      age, sex, heightCm, weightKg,
      bodyFatPercent: data.bodyFatPercent,
      experience, trainingDaysPerWeek, cardioFrequency, cardioDurationMin,
      dailySteps, sittingHoursPerDay, jobType, goalMode,
      unitSystem: data.unitSystem,
      // Phase B fields (all optional)
      dietType: data.dietType,
      meatPreferences: data.meatPreferences,
      cookingContext: data.cookingContext,
      budgetTier: data.budgetTier,
      takesSupplements: data.takesSupplements,
      supplements: data.supplements,
      targetWeightKg: data.targetWeightKg,
      goalTimeline: data.goalTimeline,
      sessionMinutes: data.sessionMinutes,
      cardioTypes: data.cardioTypes,
      otherActivities: data.otherActivities,
      healthConditions: data.healthConditions,
      healthNotes: data.healthNotes,
    };
  };

  const initFromProfile = (p: UserProfile) => {
    setDataState({
      age: p.age, sex: p.sex, heightCm: p.heightCm, weightKg: p.weightKg,
      bodyFatPercent: p.bodyFatPercent, experience: p.experience,
      trainingDaysPerWeek: p.trainingDaysPerWeek, cardioFrequency: p.cardioFrequency,
      cardioDurationMin: p.cardioDurationMin, dailySteps: p.dailySteps,
      sittingHoursPerDay: p.sittingHoursPerDay, jobType: p.jobType,
      goalMode: p.goalMode, unitSystem: p.unitSystem ?? 'metric',
      dietType: p.dietType, meatPreferences: p.meatPreferences,
      cookingContext: p.cookingContext, budgetTier: p.budgetTier,
      takesSupplements: p.takesSupplements, supplements: p.supplements,
      targetWeightKg: p.targetWeightKg, goalTimeline: p.goalTimeline,
      sessionMinutes: p.sessionMinutes, cardioTypes: p.cardioTypes,
      otherActivities: p.otherActivities, healthConditions: p.healthConditions,
      healthNotes: p.healthNotes,
    });
  };

  const reset = () => setDataState({});

  return (
    <OnboardingContext.Provider value={{ data, setData, initFromProfile, buildProfile, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be inside OnboardingProvider");
  return ctx;
}
