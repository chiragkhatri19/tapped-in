// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// evidenceMap.ts — Maps every explanation_key to a user-facing evidence card
// ─────────────────────────────────────────────────────────────────────────────

import type { EvidenceEntry, EvidenceKey } from "./types";

export const EvidenceMap: Record<EvidenceKey, EvidenceEntry> = {
  bmr_msj: {
    title: "Basal Metabolic Rate (Mifflin-St Jeor)",
    summary:
      "Your BMR is the calories your body burns at complete rest — just to keep organs running. " +
      "We use the Mifflin-St Jeor equation, which is the most validated general-population formula. " +
      "It uses your age, sex, height, and weight. It's slightly less accurate for very muscular or " +
      "very high body-fat individuals, but it's the best starting point for most people.",
    citation_placeholder: "Mifflin MD et al. (1990). A new predictive equation for resting energy expenditure. Am J Clin Nutr. 51(2):241–7.",
    confidence: "high",
  },

  neat_logic: {
    title: "NEAT — Non-Exercise Activity Thermogenesis",
    summary:
      "NEAT is the energy you burn through all movement that isn't structured exercise — walking, " +
      "standing, fidgeting, daily tasks. It's one of the biggest sources of calorie variation between " +
      "people. We score your NEAT from 0–100 using steps, sitting time, and structured activity, " +
      "then map that to an activity multiplier. Generic multipliers like '1.55 for moderately active' " +
      "are often inflated for office workers who train a few days a week.",
    citation_placeholder: "Levine JA. (2004). Non-exercise activity thermogenesis (NEAT). Science. 307(5709):584–6.",
    confidence: "moderate",
  },

  maintenance_logic: {
    title: "Maintenance Calories",
    summary:
      "Maintenance = your BMR × your NEAT-based activity multiplier. We return a ±5% range because " +
      "two people with identical stats can differ by 100–200 kcal/day due to individual metabolic variation. " +
      "We intentionally avoid adding large exercise calorie estimates — these are notoriously unreliable " +
      "and already partially captured in the NEAT score. Treat this as an honest starting estimate, " +
      "not an exact number. Adjust based on weekly weigh-in trends over 2–3 weeks.",
    citation_placeholder: "Hall KD et al. (2012). Quantification of the effect of energy imbalance on bodyweight. Lancet. 378(9793):826–37.",
    confidence: "moderate",
  },

  goal_calories_logic: {
    title: "Goal-Based Calorie Adjustment",
    summary:
      "Fat loss: A 300–500 kcal daily deficit is sustainable and protects muscle mass. " +
      "Larger deficits accelerate muscle loss, suppress NEAT, and are hard to maintain. " +
      "Body recomposition: A small 150–200 kcal deficit with adequate protein can reduce fat " +
      "while maintaining muscle — especially effective for newer or returning lifters. " +
      "Lean bulk: A 150–250 kcal surplus minimises unnecessary fat gain while allowing slow, " +
      "quality muscle accretion. More surplus does not mean more muscle — it mostly means more fat.",
    citation_placeholder: "Barakat C et al. (2020). Body recomposition: Can trained individuals build muscle and lose fat at the same time? Strength Cond J. 42(5):7–17.",
    confidence: "high",
  },

  protein_logic: {
    title: "Protein Target",
    summary:
      "For most people who train, 1.6–1.8 g/kg of body weight is sufficient to support muscle " +
      "protein synthesis. The current evidence does not show meaningful benefit above 2.2 g/kg. " +
      "We default to 1.6–1.7 g/kg for recomp and lean bulk, and modestly increase to 1.7–1.8 g/kg " +
      "for fat loss — particularly when the deficit is larger — to help preserve muscle. " +
      "Higher protein is only warranted for very lean individuals in aggressive deficits, " +
      "or those under very high training stress.",
    citation_placeholder: "Morton RW et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength. Br J Sports Med. 52(6):376–384.",
    confidence: "high",
  },

  fat_logic: {
    title: "Dietary Fat Target",
    summary:
      "Dietary fat is essential — it carries fat-soluble vitamins (A, D, E, K) and supports " +
      "hormonal health. We set a minimum of 0.6 g/kg (never less than 60g absolute) to protect " +
      "against hormonal disruption, particularly testosterone suppression. Very low-fat diets " +
      "have been shown to suppress anabolic hormones. Beyond the minimum, fat is kept practical " +
      "so carbohydrates remain useful for training fuel.",
    citation_placeholder: "Hamalainen E et al. (1984). Diet and serum sex hormones in healthy men. J Steroid Biochem. 20(1):459–64.",
    confidence: "moderate",
  },

  carb_logic: {
    title: "Carbohydrate Target",
    summary:
      "Carbohydrates are the body's preferred fuel for resistance training and high-intensity cardio. " +
      "After protein and fat minimums are allocated, remaining calories go to carbs. " +
      "There is no universal minimum — carb needs scale with training intensity and volume. " +
      "More training days = more reason to keep carbs high. Carbs also support muscle glycogen " +
      "replenishment and recovery.",
    citation_placeholder: "Burke LM et al. (2011). Carbohydrates for training and competition. J Sports Sci. 29(S1):S17–27.",
    confidence: "high",
  },

  nutrition_logic: {
    title: "Fiber, Hydration & Electrolytes",
    summary:
      "Fiber at 10–15g per 1000 kcal supports gut health, satiety, and blood sugar stability. " +
      "Hydration needs scale with body weight and activity — 35ml/kg/day is a practical baseline. " +
      "Electrolytes (sodium, potassium, magnesium) are often inadequate on lower-calorie diets " +
      "and can cause fatigue, muscle cramps, and impaired performance. These are unsexy but " +
      "important foundations of a functioning diet.",
    citation_placeholder: "Institute of Medicine. (2005). Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate. National Academies Press.",
    confidence: "high",
  },

  goal_recommendation_logic: {
    title: "Goal Recommendation",
    summary:
      "Body fat percentage is the primary signal for goal selection. Higher body fat responds " +
      "best to a fat loss phase — the composition change is visible and health markers improve. " +
      "Mid-range body fat suits body recomposition — a slow, sustainable approach that works " +
      "well for trained individuals. Leaner individuals gain more from a controlled surplus — " +
      "muscle building is harder at lower body fat and benefits from a positive energy balance.",
    citation_placeholder: "Barakat C et al. (2020). Strength Cond J. 42(5):7–17.",
    confidence: "moderate",
  },
};
