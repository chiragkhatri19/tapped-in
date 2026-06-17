import { EvidenceCard } from "@/types";

export const EVIDENCE_CARDS: EvidenceCard[] = [
  {
    id: "neat_matters",
    claim: "Why NEAT matters more than your gym sessions",
    shortExplanation:
      "Non-exercise activity thermogenesis (NEAT) is all movement outside structured workouts. It accounts for more daily calorie burn than training for most people . it varies by up to 2,000 kcal/day between individuals (Levine et al., 1999).",
    detailedExplanation:
      "NEAT includes walking, fidgeting, household chores, standing, and commuting. Research shows NEAT can vary by up to 2,000 kcal/day between individuals with similar body composition. Sedentary desk workers typically have very low NEAT regardless of location. This app models your actual NEAT using step count, job type, and sitting hours . not using a generic 'moderately active' multiplier that inflates maintenance estimates and leads to stalled progress.",
    confidence: "high",
    category: "neat",
    relatedIds: ["bmr_equation", "workout_calories_unreliable"],
    citations: [
      {
        title: "Role of Nonexercise Activity Thermogenesis in Resistance to Fat Gain in Humans",
        authors: "Levine JA et al.",
        year: 1999,
        journal: "Science",
        doi: "10.1126/science.283.5399.212",
      },
      {
        title: "Interindividual variation in posture allocation: possible role in human obesity",
        authors: "Levine JA et al.",
        year: 2005,
        journal: "Science",
        doi: "10.1126/science.1106816",
      },
    ],
  },
  {
    id: "bmr_equation",
    claim: "How we ran the math on your maintenance calories",
    shortExplanation:
      "We used the Mifflin-St Jeor equation, the most validated BMR formula for general populations, then applied a conservative activity multiplier based on your real lifestyle inputs.",
    detailedExplanation:
      "The Mifflin-St Jeor equation has been shown to predict resting metabolic rate within 10% for most people, making it more accurate than Harris-Benedict for non-athletic populations. We then apply an activity multiplier derived from your step count, sitting time, job type, and cardio. No generic guesses. We deliberately use conservative multipliers for low-NEAT users because overestimated maintenance is the number one reason people don't lose fat despite eating at a deficit.",
    confidence: "high",
    category: "calorie_estimation",
    relatedIds: ["neat_matters", "workout_calories_unreliable"],
    citations: [
      {
        title: "A new predictive equation for resting energy expenditure in healthy individuals",
        authors: "Mifflin MD et al.",
        year: 1990,
        journal: "American Journal of Clinical Nutrition",
        doi: "10.1093/ajcn/51.2.241",
      },
    ],
  },
  {
    id: "protein_high",
    claim: "Why protein is set this high",
    shortExplanation:
      "Higher protein (1.6 to 2.4g/kg) preserves muscle in a deficit, maximises muscle protein synthesis in a surplus, and keeps you fuller, making adherence dramatically easier.",
    detailedExplanation:
      "Multiple systematic reviews and meta-analyses confirm that protein intakes of 1.6 to 2.4g/kg/day maximise muscle retention during fat loss and muscle gain during a surplus. Protein also has the highest thermic effect of food (around 25 to 30% of calories burned in digestion), the strongest satiety signals, and the lowest risk of being stored as fat. For Indian diets that are traditionally lower in protein, hitting these targets may require deliberate food choices like paneer, eggs, curd, chicken, dal, and soya chunks.",
    confidence: "high",
    category: "protein",
    relatedIds: ["fat_minimum", "deficit_size", "goal_fat_loss_why"],
    citations: [
      {
        title: "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength",
        authors: "Morton RW et al.",
        year: 2018,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsports-2017-097608",
      },
      {
        title: "Dietary protein for athletes: From requirements to metabolic advantage",
        authors: "Phillips SM, Van Loon LJC",
        year: 2011,
        journal: "Applied Physiology, Nutrition, and Metabolism",
      },
    ],
  },
  {
    id: "fat_minimum",
    claim: "Why fat can't go below ~50g/day",
    shortExplanation:
      "Dietary fat is essential for hormone production (testosterone, estrogen, cortisol) and fat-soluble vitamin absorption. Going too low disrupts hormones and recovery.",
    detailedExplanation:
      "Fat intakes below 15 to 20% of total calories have been linked to reduced testosterone in men and disrupted menstrual cycles in women, impaired absorption of vitamins A, D, E and K, and reduced prostaglandin synthesis. We keep fat at 25 to 30% of total calories, with a hard floor of 50g/day. This is especially important for active individuals who need robust hormonal function for training adaptation and recovery.",
    confidence: "high",
    category: "fat",
    relatedIds: ["protein_high", "carbs_remainder"],
    citations: [
      {
        title: "Dietary fat and its relationship with physical performance",
        authors: "Hamalainen E et al.",
        year: 1984,
        journal: "Steroids",
      },
    ],
  },
  {
    id: "carbs_remainder",
    claim: "Why carbs fill the remaining calories",
    shortExplanation:
      "Carbohydrates are the primary fuel for high-intensity exercise and brain function. After protein and fat minimums are met, remaining calories go to carbs to support training performance.",
    detailedExplanation:
      "Muscle glycogen is replenished by dietary carbohydrates and is the dominant fuel source during resistance training and cardio above moderate intensity. Low carb intake reduces training volume, power output, and recovery quality. By allocating remaining calories to carbs after meeting protein and fat minimums, we ensure you have enough fuel to train hard and adapt. That's what drives body composition change over time.",
    confidence: "high",
    category: "carbs",
    relatedIds: ["fat_minimum", "fiber_matters"],
    citations: [
      {
        title: "Carbohydrates and exercise performance in non-fasted athletes",
        authors: "Burke LM et al.",
        year: 2011,
        journal: "Journal of Sports Sciences",
      },
    ],
  },
  {
    id: "deficit_size",
    claim: "Why we chose this deficit size for fat loss",
    shortExplanation:
      "A deficit of 300 to 500 kcal/day yields around 0.3 to 0.5 kg of fat loss per week. Enough to see consistent progress without the muscle loss, fatigue, and rebound hunger of crash diets.",
    detailedExplanation:
      "Aggressive deficits (above 750 kcal/day) accelerate muscle catabolism, tank testosterone, reduce training performance, and dramatically increase hunger. All of that makes them unsustainable. A moderate deficit of 300 to 500 kcal targets primarily fat mass when combined with adequate protein and resistance training. For most people, this means visible progress in 4 to 6 weeks while maintaining strength and energy. We deliberately avoid the '1000 kcal deficit' advice that's rampant in broscience culture.",
    confidence: "high",
    category: "deficit",
    relatedIds: ["protein_high", "goal_fat_loss_why", "lean_bulk_surplus"],
    citations: [
      {
        title: "Is an energy deficit necessary to lose body weight and fat mass?",
        authors: "Thomas DM et al.",
        year: 2013,
        journal: "Current Opinion in Clinical Nutrition & Metabolic Care",
      },
    ],
  },
  {
    id: "lean_bulk_surplus",
    claim: "Why the lean bulk surplus is small",
    shortExplanation:
      "Muscle tissue can only be synthesised at a limited rate (around 0.5kg/month for beginners, less for advanced). A large surplus just adds fat, not more muscle.",
    detailedExplanation:
      "Research suggests maximum muscle protein synthesis rates cap out at roughly 0.25 to 0.5 kg of lean mass per month for natural lifters, even with optimal training and nutrition. A surplus of 150 to 250 kcal/day is sufficient to support this rate without significant fat accumulation. Dirty bulking (eating at 500 to 1000+ kcal surplus) just adds fat that then needs to be cut, wasting months of your training year. We're conservative because the evidence supports it.",
    confidence: "high",
    category: "surplus",
    relatedIds: ["deficit_size", "goal_muscle_gain_why"],
    citations: [
      {
        title: "Evidence-based recommendations for natural bodybuilding contest preparation",
        authors: "Helms ER et al.",
        year: 2014,
        journal: "Journal of the International Society of Sports Nutrition",
      },
    ],
  },
  {
    id: "workout_calories_unreliable",
    claim: "Why we don't rely on workout calorie burn estimates",
    shortExplanation:
      "Gym equipment, smartwatches, and apps routinely overestimate exercise calorie burn by 20 to 90%. Using these inflated numbers to eat back calories is a major reason people don't lose fat.",
    detailedExplanation:
      "Studies have shown that cardio machines overestimate calorie burn by 19 to 132% depending on the machine and the person. Wearables like Apple Watch and Fitbit overestimate calorie expenditure during exercise by an average of 27 to 93%. Resistance training estimates are especially unreliable. When people eat back these overestimated exercise calories, they frequently end up in a calorie surplus instead of a deficit. Our calorie model uses your baseline NEAT and lifestyle data to set maintenance, and treats workout calories as a small and unreliable bonus.",
    confidence: "high",
    category: "calorie_estimation",
    relatedIds: ["neat_matters", "bmr_equation"],
    citations: [
      {
        title: "Accuracy of Wearable Sensors for Measuring Energy Expenditure During Running",
        authors: "Evenson KR et al.",
        year: 2015,
        journal: "Medicine & Science in Sports & Exercise",
      },
      {
        title: "Validity of consumer-based physical activity monitors in healthy adults",
        authors: "Shcherbina A et al.",
        year: 2017,
        journal: "Journal of Personalized Medicine",
      },
    ],
  },
  {
    id: "fiber_matters",
    claim: "Why fiber targets matter",
    shortExplanation:
      "Fiber slows digestion, improves satiety, feeds gut bacteria, and is consistently associated with lower body fat, better blood sugar control, and reduced chronic disease risk.",
    detailedExplanation:
      "Dietary fiber, especially from whole grains, legumes, and vegetables, has multiple benefits relevant to body composition goals: it slows gastric emptying (keeping you full longer), reduces post-meal blood sugar spikes that drive fat storage, feeds beneficial gut bacteria that influence inflammation and metabolism, and is inversely associated with body weight across populations. Indian diets have natural fiber sources (dal, vegetables, whole wheat roti), but refined foods (white rice, maida) displace fiber rapidly. We recommend 14g per 1000 kcal, consistent with USDA Dietary Guidelines.",
    confidence: "high",
    category: "fiber",
    relatedIds: ["hydration_basics", "carbs_remainder"],
    citations: [
      {
        title: "Dietary fiber and body weight",
        authors: "Slavin JL",
        year: 2005,
        journal: "Nutrition",
      },
    ],
  },
  {
    id: "hydration_basics",
    claim: "Hydration and electrolytes for active people",
    shortExplanation:
      "Even mild dehydration (1 to 2%) measurably reduces strength, endurance, and cognitive performance. Active individuals and those in warm climates have substantially higher fluid and electrolyte needs.",
    detailedExplanation:
      "The general recommendation for active adults is 35 to 45ml of water per kg of body weight per day, with additional intake around training. Indian summers significantly increase sweat rates, raising sodium and potassium needs. We recommend salting food to taste (don't stress about salt), including potassium-rich foods like bananas, curd, and dal, and ensuring adequate magnesium through nuts, seeds, and dark green vegetables. ORS or electrolyte drinks during long or high-sweat training sessions are reasonable for most people.",
    confidence: "moderate",
    category: "hydration",
    relatedIds: ["fiber_matters"],
    citations: [
      {
        title: "Dehydration Impairs Cognitive Performance: A Meta-analysis",
        authors: "Lieberman HR",
        year: 2012,
        journal: "Nutrition Reviews",
      },
    ],
  },

  // -- Onboarding "why?" cards --------------------------------------------------

  {
    id: "goal_fat_loss_why",
    claim: "why a mild deficit works better than crash dieting",
    shortExplanation:
      "Most apps give you a 1000 kcal deficit and call it science. That's crash dieting with extra steps. A mild 150 to 200 kcal deficit with high protein is what the actual research says maximises fat loss while holding onto muscle.",
    detailedExplanation:
      "Helms et al. (2014) found that natural athletes preserving muscle during a cut needed to keep protein high (1.6 to 2.4 g/kg) and deficits moderate. Aggressive deficits tank testosterone, kill training performance, and spike hunger hormones . the diet becomes unsustainable. You lose the weight, then rebound. A mild deficit of 150 to 200 kcal/day means slower scale movement but dramatically better muscle retention, energy, and long-term adherence. This is why serious coaches don't recommend crash diets. Your mirror in 6 months will look better following this than following any 500 kcal crash plan.",
    confidence: "high",
    category: "deficit",
    relatedIds: ["deficit_size", "protein_high"],
    citations: [
      {
        title: "Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation",
        authors: "Helms ER, Aragon AA, Fitschen PJ",
        year: 2014,
        journal: "Journal of the International Society of Sports Nutrition",
        doi: "10.1186/1550-2783-11-20",
      },
      {
        title: "Dietary protein and muscle mass: translating science to application and health benefit",
        authors: "Stokes T et al.",
        year: 2018,
        journal: "Nutrients",
        doi: "10.3390/nu10020180",
      },
    ],
  },
  {
    id: "goal_recomp_why",
    claim: "body recomposition is real. here's the science",
    shortExplanation:
      "The fitness industry has been lying to you. 'You can't gain muscle and lose fat at the same time' is broscience. Barakat et al. (2020) showed it's absolutely possible . especially if you're not an elite athlete or on a very low body fat percentage.",
    detailedExplanation:
      "A 2020 systematic review by Barakat et al. confirmed that body recomposition (simultaneous fat loss and muscle gain) is achievable at maintenance calories with sufficient protein intake (1.6 to 2.4 g/kg). It works best for: beginners or returning lifters, people with higher body fat (more fat to fuel muscle building), and anyone eating at maintenance while lifting with progressive overload. The mechanism: fat tissue acts as an energy reserve that the body can oxidise to support muscle protein synthesis when protein and training stimulus are adequate. The trade-off is slower progress than a dedicated cut or bulk . you get both adaptations simultaneously. Perfect if you want to look better without committing to a hard cut.",
    confidence: "high",
    category: "deficit",
    citations: [
      {
        title: "Body Recomposition: Can Trained Individuals Build Muscle and Lose Fat at the Same Time?",
        authors: "Barakat C et al.",
        year: 2020,
        journal: "Strength & Conditioning Journal",
        doi: "10.1519/SSC.0000000000000584",
      },
      {
        title: "Simultaneous body fat loss and muscle gain: a realistic expectation?",
        authors: "Longland TM et al.",
        year: 2016,
        journal: "American Journal of Clinical Nutrition",
        doi: "10.3945/ajcn.115.119685",
      },
    ],
  },
  {
    id: "goal_muscle_gain_why",
    claim: "why dirty bulking is a waste of your time",
    shortExplanation:
      "Eating in a massive surplus doesn't build more muscle. Muscle protein synthesis has a hard biological ceiling. Above that ceiling, extra calories become fat . and you then spend months cutting what you gained in a week.",
    detailedExplanation:
      "Natural muscle building is limited by biology: most people can synthesise 0.25 to 0.5 kg of new muscle per month even under optimal conditions. This means your calorie surplus needs to cover only the cost of building that lean tissue . roughly 150 to 250 kcal/day. Anything above that gets stored as fat. Slater and Phillips (2011) established the evidence base for lean bulking, and Haun et al. (2019) confirmed that massive surpluses don't accelerate hypertrophy . they just inflate your body fat percentage. The dirty bulk strategy is popular because it's easier (just eat everything), but the physics don't support it unless you want to carry significantly more fat into your next cut.",
    confidence: "high",
    category: "surplus",
    relatedIds: ["lean_bulk_surplus", "protein_high"],
    citations: [
      {
        title: "Nutritional guidelines for strength sports: sprinting, weightlifting, throwing events, and bodybuilding",
        authors: "Slater G, Phillips SM",
        year: 2011,
        journal: "Journal of Sports Sciences",
        doi: "10.1080/02640414.2011.574722",
      },
      {
        title: "Effects of Graded Whey Supplementation During Extreme-Volume Resistance Training",
        authors: "Haun CT et al.",
        year: 2018,
        journal: "Frontiers in Nutrition",
        doi: "10.3389/fnut.2018.00084",
      },
    ],
  },

  // -- Workout evidence cards ------------------------------------------------

  {
    id: "workout_volume",
    claim: "why 12 to 14 sets per muscle per week is the sweet spot",
    shortExplanation:
      "Schoenfeld et al. (2017) found a clear dose-response between weekly training volume and hypertrophy. Under 10 sets = leaving gains on the table. Over 22 = junk volume that just adds fatigue. 12 to 14 sets per muscle per week is where effort translates into actual growth.",
    detailedExplanation:
      "The 2017 dose-response meta-analysis is the most-cited volume landmark in resistance training research. It compared low, moderate, and high weekly sets per muscle and found hypertrophy increases with volume up to a point, then plateaus and eventually adds fatigue without adding muscle. The 12 to 14 set range sits at the top of the dose-response curve for most natural lifters. Favourite muscles can go to 16 to 18. More than 22 is generally junk volume. This is why the dashboard flags any muscle group below 10 sets as lagging and anything above 22 as overdone.",
    confidence: "high",
    category: "training",
    relatedIds: ["workout_frequency", "progressive_overload"],
    citations: [
      {
        title: "Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis",
        authors: "Schoenfeld BJ, Ogborn D, Krieger JW",
        year: 2017,
        journal: "Journal of Sports Sciences",
        doi: "10.1080/02640414.2016.1210197",
      },
    ],
  },
  {
    id: "workout_frequency",
    claim: "why each muscle needs to be trained at least twice a week",
    shortExplanation:
      "Training a muscle once a week (classic bro split) leaves it in a non-stimulated state for 6 days. Schoenfeld et al. (2019) meta-analysis: training each muscle 2x/week produces significantly greater hypertrophy than 1x. The 2x sweet spot means PPL and Upper/Lower splits beat the old bro split on pure muscle-building science.",
    detailedExplanation:
      "Muscle protein synthesis (MPS) peaks 24 to 48 hours post-training and returns to baseline by 72 hours. Training a muscle once weekly means 4+ days of no anabolic signal. The 2019 meta-analysis by Schoenfeld, Grgic, and Krieger pooled studies directly comparing training frequency on hypertrophy and found 2x/week superior to 1x, with 3x showing a trend toward further benefit but less statistical certainty. For optimal frequency without sacrificing volume-per-session, Upper/Lower and Push/Pull/Legs splits are the evidence-based defaults. Bro splits are not banned, but you need to fit the full weekly volume into one session, which is hard.",
    confidence: "high",
    category: "training",
    relatedIds: ["workout_volume", "rest_intervals"],
    citations: [
      {
        title: "How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis",
        authors: "Schoenfeld BJ, Grgic J, Krieger J",
        year: 2019,
        journal: "Journal of Sports Sciences",
        doi: "10.1080/02640414.2018.1555906",
      },
    ],
  },
  {
    id: "progressive_overload",
    claim: "why you need to add weight or reps every week",
    shortExplanation:
      "Plotkin et al. (2022) showed that whether you progress by adding load or adding reps, progressive overload is the non-negotiable driver of muscle growth. Do the same weights and reps for months and your muscles adapt - then stop adapting. No progressive overload = no new gains. That's not a motivational line. That's muscle physiology.",
    detailedExplanation:
      "The Plotkin 2022 PeerJ study compared a group that increased load (weight) with a group that increased reps, holding volume constant. Both groups grew similarly, confirming that the mechanism is progressive overload of the muscle, not specifically heavier weight. What matters is that you're doing more over time - more weight, more reps, better technique enabling deeper ROM, or reduced RIR. The progressive overload rule in each exercise (e.g. 'add 2.5kg when all sets hit top of rep range') is directly derived from this evidence. Stalling at the same weights for 4+ weeks is a signal to adjust programming, not just 'push harder'.",
    confidence: "high",
    category: "training",
    relatedIds: ["workout_volume", "proximity_to_failure"],
    citations: [
      {
        title: "Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations",
        authors: "Plotkin DL et al.",
        year: 2022,
        journal: "PeerJ",
        doi: "10.7717/peerj.14142",
      },
    ],
  },
  {
    id: "proximity_to_failure",
    claim: "why training at 1 to 2 RIR (reps in reserve) is the evidence sweet spot",
    shortExplanation:
      "Refalo et al. (2023) meta-analysis: leaving 1 to 2 reps in reserve per set produces hypertrophy equivalent to training to complete failure, with significantly less central fatigue, joint stress, and form breakdown. Going to full failure on every set accumulates more fatigue than it adds muscle. 1 to 2 RIR is the practical optimum.",
    detailedExplanation:
      "Proximity to failure is one of the most debated topics in hypertrophy research. The 2023 Refalo meta-analysis synthesised all available data on RIR and hypertrophy outcomes. Key finding: sets taken to 0 to 1 RIR do not produce meaningfully more hypertrophy than 1 to 2 RIR, but they do produce more systemic fatigue, higher injury risk, and greater workout-to-workout performance variability. The practical implication: most working sets should end with 1 to 2 reps left in the tank. Reserve failure sets for the occasional last set of an isolation exercise. The logger's default RIR target of 2 is based on this evidence.",
    confidence: "high",
    category: "training",
    relatedIds: ["progressive_overload", "rest_intervals"],
    citations: [
      {
        title: "Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis",
        authors: "Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ",
        year: 2023,
        journal: "Sports Medicine",
        doi: "10.1007/s40279-022-01784-y",
      },
    ],
  },
  {
    id: "rest_intervals",
    claim: "why you need 2 to 3 minutes rest on compound lifts",
    shortExplanation:
      "Schoenfeld et al. (2016): trainees using 3-minute rest intervals gained significantly more muscle and strength over 8 weeks than those using 1-minute intervals. The old 'keep rest short to maximise the pump' advice was broscience. More rest = more capacity for the next set = more volume = more growth.",
    detailedExplanation:
      "This 2016 RCT split resistance-trained men into 1-minute and 3-minute rest conditions with identical training programs. The 3-minute group saw greater increases in muscle thickness (quads: +12.7% vs +7.7%) and 1RM strength across all measures. The mechanism: short rest periods leave phosphocreatine (the fast energy system) incompletely replenished, so each subsequent set is weaker. You complete fewer total reps per session, accumulate less volume, and stimulate less hypertrophy. The 2 to 3 minute default on compound exercises in the plan reflects this directly. Isolation exercises with lower loading can use 60 to 90 seconds.",
    confidence: "high",
    category: "training",
    relatedIds: ["workout_frequency", "proximity_to_failure"],
    citations: [
      {
        title: "Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men",
        authors: "Schoenfeld BJ, Pope ZK, Benik FM, Hester GM, Sellers J, Nooner JL, Schnak J, Bond J, Lieberman MD, Krieger JW",
        year: 2016,
        journal: "Journal of Strength and Conditioning Research",
        doi: "10.1519/JSC.0000000000001272",
      },
    ],
  },
  {
    id: "exercise_order",
    claim: "why compound lifts go first in your session",
    shortExplanation:
      "Simo et al. (2012): exercises performed early in a session produce significantly greater strength output and training volume than those performed later. Compound lifts (squat, deadlift, bench, row) need your freshest neuromuscular state. Doing curls before squats makes your squats worse. Not your curls.",
    detailedExplanation:
      "Multiple studies confirm that exercise order directly impacts performance. The Simo 2012 review synthesised the available evidence: when compound multi-joint exercises are placed at the beginning of a session, subjects lift heavier and complete more reps than when they're placed after fatiguing isolation work. This is because compound movements require higher motor unit recruitment and technical precision. The reverse isn't true - doing curls after squats doesn't meaningfully hurt your curl performance. Practically: always front-load your session with the hardest, most technically demanding movements. The weakest/priority muscle group goes first within that (Simo et al. also established this). Isolation work comes last.",
    confidence: "high",
    category: "training",
    citations: [
      {
        title: "Review of the acute effects of resistance exercise order on physiological and neuromuscular variables",
        authors: "Simo R, Spineti J, de Salles BF, Matta T, Fernandes L, Fleck SJ, Rhea MR, Strom-Olsen HE",
        year: 2012,
        journal: "Journal of Human Kinetics",
        doi: "10.2478/v10078-012-0054-0",
      },
    ],
  },
  {
    id: "post_workout_cardio",
    claim: "why cardio after lifting burns more fat than cardio before",
    shortExplanation:
      "lifting depletes muscle glycogen. when you do cardio immediately after, glycogen stores are low so your body oxidises fat as the primary fuel. doing cardio before lifting reverses this - you burn glycogen during cardio, then have less for your lifts.",
    detailedExplanation:
      "Romijn et al. (1993) established that fat oxidation during aerobic exercise is highest when glycogen stores are low. Chtara et al. (2005) directly compared concurrent training order (aerobic then resistance vs resistance then aerobic) and found that resistance first produced significantly better fat loss outcomes while preserving strength gains. The mechanism: weight training at moderate to high intensity rapidly depletes intramuscular glycogen. The subsequent aerobic session at 110 to 120 BPM targets fat as the primary fuel because the glycolytic pathway is temporarily rate-limited. Going above 130 BPM shifts demand back to glycogen (which is partially replenished by the rest period) and increases cortisol, which in a deficit raises muscle catabolism risk. Zone 2 cardio (110 to 120 BPM) post-lift is the practical sweet spot.",
    confidence: "high",
    category: "training",
    relatedIds: ["zone_2_base_building", "neat_matters"],
    citations: [
      {
        title: "Substrate cycling between de novo lipogenesis and lipid oxidation is a thermogenic mechanism in humans",
        authors: "Romijn JA, Coyle EF, Sidossis LS, Gastaldelli A, Horowitz JF, Endert E, Wolfe RR",
        year: 1993,
        journal: "American Journal of Physiology",
        doi: "10.1152/ajpendo.1993.265.3.E380",
      },
      {
        title: "Effect of concurrent endurance and circuit resistance training sequence on muscular strength and power development",
        authors: "Chtara M, Chamari K, Chaouachi M, Chaouachi A, Koubaa D, Feki Y, Millet GP, Amri M",
        year: 2005,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsm.2004.015248",
      },
    ],
  },
  {
    id: "zone_2_base_building",
    claim: "why zone 2 cardio is the foundation of fat-loss and endurance conditioning",
    shortExplanation:
      "zone 2 (60-70% max HR) trains mitochondrial density — the cellular machinery that burns fat. more mitochondria = more fat oxidation capacity at rest and during exercise.",
    detailedExplanation:
      "Seiler et al. (2004) demonstrated that 80% of elite endurance athletes' volume is at low intensity (zone 1-2), which maximises mitochondrial biogenesis without accumulating fatigue. Achten & Jeukendrup (2003) showed fat oxidation peaks at ~65% VO2max — squarely in zone 2 — and drops sharply above 75% as the body shifts to glycolytic pathways. Zone 2 training increases mitochondrial density, capillary density, and the activity of fat-oxidizing enzymes (HADH, citrate synthase). Unlike HIIT, it can be performed frequently because its recovery cost is low — making it the most sustainable base-building tool for non-athletes.",
    confidence: "high",
    category: "training",
    relatedIds: ["post_workout_cardio", "neat_matters"],
    citations: [
      {
        title: "Physiological bases of fatigue",
        authors: "Seiler KS, Kjerland GØ",
        year: 2004,
        journal: "Scandinavian Journal of Medicine & Science in Sports",
        doi: "10.1111/j.1600-0838.2004.00432.x",
      },
      {
        title: "Determination of the exercise intensity that elicits maximal fat oxidation",
        authors: "Achten J, Jeukendrup AE",
        year: 2003,
        journal: "Medicine & Science in Sports & Exercise",
        doi: "10.1249/01.MSS.0000053601.83375.4D",
      },
    ],
  },
  {
    id: "hiit_epoc",
    claim: "why HIIT keeps burning calories for hours after you stop",
    shortExplanation:
      "HIIT creates oxygen debt (EPOC) that your body repays over 12-24 hours, elevating metabolism even at rest. one 20-min session can burn equivalent calories to 45 min of steady-state.",
    detailedExplanation:
      "Excess post-exercise oxygen consumption (EPOC) refers to the elevated metabolic rate following intense exercise. Børsheim & Bahr (2003) reviewed EPOC research and found that high-intensity exercise produces significantly greater and longer-lasting EPOC than moderate-intensity work. Tremblay et al. (1994) compared HIIT vs steady-state training and found HIIT caused 9× greater subcutaneous fat loss per calorie burned — attributed largely to EPOC and catecholamine-driven lipolysis. Practical cap: 1-2 HIIT sessions/week for non-athletes. More than that impairs recovery, raises cortisol, and undermines strength training adaptations.",
    confidence: "high",
    category: "training",
    citations: [
      {
        title: "Effect of exercise intensity, duration and mode on post-exercise oxygen consumption",
        authors: "Børsheim E, Bahr R",
        year: 2003,
        journal: "Sports Medicine",
        doi: "10.2165/00007256-200333140-00002",
      },
      {
        title: "Impact of exercise intensity on body fatness and skeletal muscle metabolism",
        authors: "Tremblay A, Simoneau JA, Bouchard C",
        year: 1994,
        journal: "Metabolism",
        doi: "10.1016/0026-0495(94)90259-3",
      },
    ],
  },
  // -- Hydration evidence cards ------------------------------------------------

  {
    id: "hydration_water_need",
    claim: "how we calculate your personal water target",
    shortExplanation:
      "Your water target is based on body weight (32 mL/kg/day — the mid-point of the EFSA 30–35 mL/kg range), adjusted for training, heat, and a 20% food-water credit. A 70 kg person needs roughly 1,800 mL of drinking water per day at rest.",
    detailedExplanation:
      "The European Food Safety Authority (EFSA, 2010) established Adequate Intake values for total water: 2.5 L/day for men and 2.0 L/day for women from all sources. Approximately 20% of that comes from food, so the remaining drinking target is ~2.0 L and ~1.6 L respectively. A weight-scaled formula (30–35 mL/kg, floored to IOM Adequate Intake) is more personalised than a flat 2 L recommendation and is consistent with both the IOM DRI 2004 and EFSA 2010 reports. We use 32 mL/kg as the central estimate, then add 600 mL per training hour (DGE Sports Nutrition 2020 position), 500 mL for hot-climate exposure, and subtract the 20% food-water credit. The result is clamped to sex-specific IOM floors and ceilings so no edge-case profile produces an unsafe target.",
    confidence: "high",
    category: "hydration",
    citations: [
      {
        title: "Scientific Opinion on Dietary Reference Values for water",
        authors: "EFSA Panel on Dietetic Products, Nutrition, and Allergies (NDA)",
        year: 2010,
        journal: "EFSA Journal",
        doi: "10.2903/j.efsa.2010.1459",
      },
      {
        title: "Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate",
        authors: "Institute of Medicine (IOM)",
        year: 2004,
        journal: "National Academies Press",
      },
    ],
  },
  {
    id: "hydration_electrolytes",
    claim: "why drinking water alone isn't enough — electrolytes matter",
    shortExplanation:
      "Sodium, potassium, and magnesium regulate fluid balance across cell membranes and blood pressure. Sweating large volumes without replacing electrolytes can impair muscle contractions, cause cramps, and in extreme cases lead to hyponatraemia.",
    detailedExplanation:
      "Electrolytes are electrically charged minerals that govern how water is distributed between your cells and bloodstream. Sodium is the primary extracellular cation and the main driver of thirst and fluid retention; potassium is the primary intracellular cation and regulates muscle and heart contractions; magnesium is a cofactor in over 300 enzyme reactions including ATP production, muscle relaxation, and protein synthesis. A 2019 Nutrients review (doi:10.3390/nu11061362) confirmed that inadequate potassium and magnesium — common in Western and high-processed-food diets — are independently associated with elevated blood pressure, impaired athletic recovery, and increased cramping frequency. During prolonged or high-sweat training, sweat sodium losses range from 460–1840 mg/hour, making electrolyte replacement critical beyond ~60 minutes of exercise.",
    confidence: "high",
    category: "hydration",
    citations: [
      {
        title: "The Role of Magnesium in Neurological Disorders",
        authors: "Kirkland AE, Sarlo GL, Holton KF",
        year: 2018,
        journal: "Nutrients",
        doi: "10.3390/nu10060730",
      },
      {
        title: "Potassium and sodium intakes and their ratio in US- and European-originated dietary guidelines",
        authors: "Drewnowski A et al.",
        year: 2019,
        journal: "Nutrients",
        doi: "10.3390/nu11061362",
      },
    ],
  },
  {
    id: "hydration_potassium",
    claim: "why hitting 2600–3400 mg of potassium daily is harder than it sounds",
    shortExplanation:
      "The NAM Adequate Intake for potassium is 3400 mg/day for men and 2600 mg/day for women. Most adults in high-processed-food diets consume less than 2300 mg — a gap that raises blood pressure and impairs muscle recovery.",
    detailedExplanation:
      "Potassium is the most abundant intracellular cation and its ratio to sodium directly regulates blood pressure via renal handling. The Dietary Approaches to Stop Hypertension (DASH) trial showed that high potassium intake lowers systolic blood pressure by 4–5 mmHg independent of sodium restriction. For athletes, potassium is critical for muscle repolarisation after contraction and glycogen re-synthesis (potassium enters the cell with glucose during glycogen storage). The best food sources are: bananas (~450 mg per medium banana), avocado (~700 mg per 100 g), potatoes (~925 mg per medium potato), legumes/dal (~700 mg per cup cooked), and yoghurt/curd (~380 mg per cup). Processing dramatically reduces potassium content, which is why the gap widens with ultra-processed food consumption.",
    confidence: "high",
    category: "hydration",
    citations: [
      {
        title: "Dietary Reference Intakes for Sodium and Potassium",
        authors: "National Academies of Sciences, Engineering, and Medicine",
        year: 2019,
        journal: "National Academies Press",
      },
      {
        title: "Effects of the DASH diet alone and in combination with exercise and weight loss on blood pressure and cardiovascular biomarkers in men and women with high blood pressure",
        authors: "Blumenthal JA et al.",
        year: 2010,
        journal: "Archives of Internal Medicine",
        doi: "10.1001/archinternmed.2010.134",
      },
    ],
  },
  {
    id: "hydration_magnesium",
    claim: "magnesium deficiency is silently common and affects sleep, training, and recovery",
    shortExplanation:
      "Up to 50% of adults in high-income countries may have inadequate magnesium intake. Low magnesium impairs sleep quality, increases muscle cramps, raises inflammation, and reduces insulin sensitivity — all relevant to body composition goals.",
    detailedExplanation:
      "Magnesium is a cofactor in ATP synthesis, DNA repair, and over 300 enzymatic reactions. Despite its importance, the NHANES data consistently show that roughly 48% of US adults fail to meet the Estimated Average Requirement from diet alone. For athletes, magnesium losses in sweat range from 4–12 mg/hour, increasing risk of insufficiency during high training loads. A 2017 meta-analysis (Abbasi et al., Nutrients) found that magnesium supplementation significantly improved sleep efficiency and reduced insomnia symptoms in adults — relevant because sleep is the primary recovery window for muscle protein synthesis. The RDA is 400–420 mg/day for men and 310–320 mg/day for women. Top food sources: pumpkin seeds (~150 mg/oz), almonds (~80 mg/oz), dark chocolate, spinach, legumes, and whole grains. We use sex-specific midpoints (410 mg men / 315 mg women) as the daily target.",
    confidence: "high",
    category: "hydration",
    citations: [
      {
        title: "The effect of magnesium supplementation on primary insomnia in elderly: A double-blind placebo-controlled clinical trial",
        authors: "Abbasi B et al.",
        year: 2012,
        journal: "Journal of Research in Medical Sciences",
      },
      {
        title: "Subclinical magnesium deficiency: a principal driver of cardiovascular disease and a public health crisis",
        authors: "DiNicolantonio JJ, O'Keefe JH, Wilson W",
        year: 2018,
        journal: "Open Heart",
        doi: "10.1136/openhrt-2017-000668",
      },
    ],
  },

  // -- Recovery / Sleep science cards ----------------------------------------

  {
    id: "sleep_duration_target",
    claim: "how many hours of sleep you actually need",
    shortExplanation:
      "The National Sleep Foundation (Hirshkowitz 2015) and the AASM/SRS consensus (Watson 2015) both recommend 7–9 hours for adults aged 18–64. Sleeping less than 7h is independently associated with impaired muscle recovery, hormonal disruption, and fat retention.",
    detailedExplanation:
      "Two landmark 2015 consensus papers established the 7–9h range for adults. Hirshkowitz et al. pooled evidence from 312 research articles; Watson et al. convened a joint task force across the AASM and the Sleep Research Society and reached the same conclusion. The mechanism: chronic short sleep (< 7h) elevates cortisol, suppresses growth hormone pulsatility, reduces leptin (satiety hormone), and elevates ghrelin (hunger hormone). All four changes directly impair body composition and training adaptation. 8h is the target in this app; the recovery ring closes at 7h minimum.",
    confidence: "high",
    category: "sleep",
    citations: [
      {
        title: "National Sleep Foundation's sleep time duration recommendations: methodology and results summary",
        authors: "Hirshkowitz M et al.",
        year: 2015,
        journal: "Sleep Health",
        doi: "10.1016/j.sleh.2014.12.010",
      },
      {
        title: "Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the AASM and SRS",
        authors: "Watson NF et al.",
        year: 2015,
        journal: "SLEEP",
        doi: "10.5665/sleep.4716",
      },
    ],
  },
  {
    id: "sleep_consistency",
    claim: "consistent bedtimes matter as much as total hours",
    shortExplanation:
      "Irregular sleep timing — even with enough total hours — disrupts circadian rhythms, blunts melatonin, and increases metabolic dysfunction. Windred et al. (2024) found sleep regularity independently predicts all-cause and cardiovascular mortality risk.",
    detailedExplanation:
      "Sleep timing regularity is tracked here as bedtime standard deviation (how much your bedtime varies night-to-night). Going to bed at wildly different times shifts your circadian clock, reduces the proportion of deep and REM sleep, and independently raises cardiometabolic risk even after controlling for total sleep duration. The Windred 2024 UK Biobank study (n=88,975) found that the Sleep Regularity Index was a stronger predictor of health outcomes than sleep duration alone. Practically: a consistent ±20-minute bedtime is 'rock solid'; ±40 minutes is 'tight'; ±70 minutes is 'ok'; beyond that, focus on winding down at the same time each night rather than simply sleeping longer.",
    confidence: "high",
    category: "sleep",
    citations: [
      {
        title: "Sleep regularity is a stronger predictor of mortality risk than sleep duration: A prospective cohort study",
        authors: "Windred DP et al.",
        year: 2024,
        journal: "Sleep",
        doi: "10.1093/sleep/zsad253",
      },
      {
        title: "Social jetlag and obesity",
        authors: "Roenneberg T et al.",
        year: 2012,
        journal: "Current Biology",
        doi: "10.1016/j.cub.2012.03.038",
      },
    ],
  },
  {
    id: "sleep_stages_recovery",
    claim: "deep sleep and REM are when your body actually repairs",
    shortExplanation:
      "Slow-wave (deep) sleep drives the nightly growth hormone surge that rebuilds muscle tissue. REM sleep consolidates motor learning and reduces CNS fatigue. Together they account for roughly 33–48% of healthy total sleep time.",
    detailedExplanation:
      "Van Cauter et al. (2000) demonstrated in a landmark JAMA study that over 70% of the 24-hour GH secretion in young adults occurs in the first slow-wave sleep episode of the night. GH is the primary anabolic hormone that orchestrates muscle protein synthesis and fat oxidation during sleep. REM sleep, which peaks in the early morning hours, consolidates procedural memory and motor patterns — critical for skill-based training adaptations. Dattilo et al. (2011) proposed the endocrinological mechanism linking sleep architecture to hypertrophy outcomes. When the app shows stage data from your tracker, the quality component of the recovery score rewards a deep+REM fraction of 33–48% of total sleep — the normal healthy range for adults.",
    confidence: "high",
    category: "recovery",
    citations: [
      {
        title: "Age-related changes in slow wave sleep and REM sleep and relationship with growth hormone and cortisol levels",
        authors: "Van Cauter E, Leproult R, Plat L",
        year: 2000,
        journal: "JAMA",
        doi: "10.1001/jama.284.7.861",
      },
      {
        title: "Sleep and muscle recovery: endocrinological and molecular basis for a new and promising hypothesis",
        authors: "Dattilo M et al.",
        year: 2011,
        journal: "Medical Hypotheses",
        doi: "10.1016/j.mehy.2011.01.018",
      },
    ],
  },
  {
    id: "steps_neat_variable",
    claim: "your actual daily steps matter more than a static activity multiplier",
    shortExplanation:
      "Tracking real daily steps beats the 'moderately active' guess by a large margin. Levine (2005) showed step-based NEAT can vary by up to 2,000 kcal/day between individuals with similar desk jobs. Your maintenance calories update as your real step data arrives.",
    detailedExplanation:
      "The conventional approach uses a fixed activity multiplier (1.2 for sedentary, 1.55 for 'moderately active', etc.) that ignores real day-to-day variability. Tudor-Locke & Bassett (2004) established the step-based activity classification still used clinically today: < 5,000 steps = sedentary; 5,000–7,499 = low active; 7,500–9,999 = somewhat active; ≥ 10,000 = active. Levine et al. (2005) demonstrated in a controlled non-exercise activity study that step-based NEAT differences of 2,000 kcal/day between individuals explained obesity variance better than any fixed multiplier. Tapped In's NEAT engine uses a 0–100 score where steps contribute up to 50 points, scaling linearly from 0 to 10,000 steps/day. When you connect a tracker, your rolling 7-day average steps replace the onboarding estimate in the maintenance formula so your calorie targets become more accurate over time.",
    confidence: "high",
    category: "neat",
    citations: [
      {
        title: "Interindividual variation in posture allocation: possible role in human obesity",
        authors: "Levine JA et al.",
        year: 2005,
        journal: "Science",
        doi: "10.1126/science.1106816",
      },
      {
        title: "How many steps/day are enough? Preliminary pedometer indices for public health",
        authors: "Tudor-Locke C, Bassett DR Jr",
        year: 2004,
        journal: "Sports Medicine",
        doi: "10.2165/00007256-200434010-00001",
      },
    ],
  },
  {
    id: "resting_hr_recovery",
    claim: "resting heart rate and HRV are window into your recovery",
    shortExplanation:
      "An elevated resting HR or depressed HRV the morning after training signals the nervous system is still under load. Plews et al. (2013) showed HRV-guided training improves performance more than fixed schedules for endurance athletes.",
    detailedExplanation:
      "Resting heart rate (RHR) and heart rate variability (HRV, specifically RMSSD) reflect the balance between sympathetic (fight-or-flight) and parasympathetic (rest-and-digest) nervous system tone. High HRV and low RHR = well recovered. Low HRV and elevated RHR = sympathetic overload from incomplete recovery, illness, or accumulated fatigue. Plews et al. (2013) demonstrated that athletes who adjusted training intensity based on morning HRV improved performance by 8.2% vs 3.8% for a fixed-schedule group. When your connected tracker provides resting HR data, it feeds the quality component of your recovery score. Note: absolute values matter less than your personal trend — a 'high' RHR for one person is normal for another.",
    confidence: "moderate",
    category: "recovery",
    citations: [
      {
        title: "Heart rate variability in elite triathletes, is variation in variability the key to effective training? A case comparison",
        authors: "Plews DJ, Laursen PB, Kilding AE, Buchheit M",
        year: 2013,
        journal: "European Journal of Applied Physiology",
        doi: "10.1007/s00421-012-2461-y",
      },
    ],
  },

  {
    id: "common_micronutrient_gaps",
    claim: "Common micronutrient gaps are worth tracking",
    shortExplanation:
      "Vitamin D, B12, omega-3, magnesium, iodine, calcium and iron are common enough gaps that food-first tracking is useful; targeted supplements can help when food intake or diet pattern makes a gap persistent.",
    detailedExplanation:
      "Micronutrient risk is diet-pattern specific: B12 is concentrated in animal foods, vitamin D is difficult to obtain from food alone, omega-3 intake depends heavily on fatty fish or algae/flax/chia intake, and minerals such as iron, calcium, iodine and magnesium depend on repeated food patterns. Tapped In shows food totals first, then lets supplements count only when the user checks them off so we do not pretend a pill was taken automatically.",
    confidence: "moderate",
    category: "micronutrients",
    citations: [
      {
        title: "A systematic review of vitamin D status in populations worldwide",
        authors: "Hilger J et al.",
        year: 2014,
        journal: "British Journal of Nutrition",
        doi: "10.1017/S0007114513001840",
      },
      {
        title: "The prevalence of cobalamin deficiency among vegetarians assessed by serum vitamin B12: a review of literature",
        authors: "Pawlak R et al.",
        year: 2014,
        journal: "European Journal of Clinical Nutrition",
        doi: "10.1038/ejcn.2014.46",
      },
      {
        title: "Associations of Omega-3 Fatty Acid Supplement Use With Cardiovascular Disease Risks: Meta-analysis of 10 Trials",
        authors: "Aung T et al.",
        year: 2018,
        journal: "JAMA Cardiology",
        doi: "10.1001/jamacardio.2017.5205",
      },
    ],
  },
];

export function getEvidenceById(id: string): EvidenceCard | undefined {
  return EVIDENCE_CARDS.find((c) => c.id === id);
}

function getEvidenceByCategory(
  category: EvidenceCard["category"]
): EvidenceCard[] {
  return EVIDENCE_CARDS.filter((c) => c.category === category);
}
