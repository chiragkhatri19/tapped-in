// Curated exercise database
// Primary muscle counts 1.0 set; each secondary muscle counts 0.5 set toward weekly volume.
// IDs are stable - used in logs, PRs, and analytics. Never rename.

export type VolumeGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
  | 'kettlebell' | 'band' | 'smith' | 'ez_bar' | 'other';

// Movement pattern — used for accurate swap matching.
export type ExercisePattern =
  | 'horizontal_push' | 'vertical_push' | 'fly'
  | 'horizontal_pull' | 'vertical_pull' | 'pullover'
  | 'hip_hinge' | 'squat' | 'lunge'
  | 'knee_flex' | 'knee_ext'
  | 'calf_raise' | 'hip_ext'
  | 'core_flex' | 'core_anti_ext' | 'core_rotation'
  | 'curl' | 'triceps_ext'
  | 'lateral_raise' | 'rear_delt' | 'shrug';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: VolumeGroup;
  secondaryMuscles: VolumeGroup[];
  equipment: Equipment;
  category: 'compound' | 'isolation';
  isUnilateral: boolean;
  defaultReps: string;
  defaultRestSec: number;
  pattern?: ExercisePattern;
  cue?: string;
  isCustom?: boolean;
  evidenceId?: string;
}

export const EXERCISES: Exercise[] = [
  // -- CHEST ---------------------------------------------------------------------
  { id: 'barbell_bench_press',       name: 'Barbell Bench Press',          primaryMuscle: 'chest',     secondaryMuscles: ['shoulders','triceps'], equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '6-10',  defaultRestSec: 180, pattern: 'horizontal_push', cue: 'retract scapula, drive feet into floor' },
  { id: 'incline_barbell_press',     name: 'Incline Barbell Press',        primaryMuscle: 'chest',     secondaryMuscles: ['shoulders','triceps'], equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'horizontal_push' },
  { id: 'decline_barbell_press',     name: 'Decline Barbell Press',        primaryMuscle: 'chest',     secondaryMuscles: ['triceps'],             equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'horizontal_push' },
  { id: 'dumbbell_bench_press',      name: 'Dumbbell Bench Press',         primaryMuscle: 'chest',     secondaryMuscles: ['shoulders','triceps'], equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'horizontal_push' },
  { id: 'incline_db_press',          name: 'Incline Dumbbell Press',       primaryMuscle: 'chest',     secondaryMuscles: ['shoulders','triceps'], equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'horizontal_push' },
  { id: 'machine_chest_press',       name: 'Machine Chest Press',          primaryMuscle: 'chest',     secondaryMuscles: ['triceps'],             equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'horizontal_push' },
  { id: 'cable_fly',                 name: 'Cable Fly',                    primaryMuscle: 'chest',     secondaryMuscles: [],                      equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'fly', cue: 'squeeze at the peak, control the stretch' },
  { id: 'incline_cable_fly',         name: 'Incline Cable Fly',            primaryMuscle: 'chest',     secondaryMuscles: [],                      equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'fly' },
  { id: 'pec_deck',                  name: 'Pec Deck / Machine Fly',       primaryMuscle: 'chest',     secondaryMuscles: [],                      equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'fly' },
  { id: 'dumbbell_fly',              name: 'Dumbbell Fly',                 primaryMuscle: 'chest',     secondaryMuscles: [],                      equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'fly' },
  { id: 'chest_dip',                 name: 'Chest Dip',                    primaryMuscle: 'chest',     secondaryMuscles: ['triceps','shoulders'], equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'horizontal_push', cue: 'lean forward to shift load to chest' },
  { id: 'push_up',                   name: 'Push-Up',                      primaryMuscle: 'chest',     secondaryMuscles: ['triceps','shoulders'], equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '10-20', defaultRestSec: 90,  pattern: 'horizontal_push' },
  { id: 'close_grip_push_up',        name: 'Close-Grip Push-Up',           primaryMuscle: 'chest',     secondaryMuscles: ['triceps'],             equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '10-20', defaultRestSec: 90,  pattern: 'horizontal_push' },
  { id: 'landmine_press',            name: 'Landmine Press',               primaryMuscle: 'chest',     secondaryMuscles: ['shoulders','triceps'], equipment: 'barbell',    category: 'compound',  isUnilateral: true,  defaultReps: '10-12', defaultRestSec: 90,  pattern: 'horizontal_push', cue: 'safe shoulder alternative to overhead press' },
  { id: 'smith_bench_press',         name: 'Smith Machine Bench Press',    primaryMuscle: 'chest',     secondaryMuscles: ['triceps'],             equipment: 'smith',      category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'horizontal_push' },

  // -- BACK ----------------------------------------------------------------------
  { id: 'deadlift',                  name: 'Conventional Deadlift',        primaryMuscle: 'back',      secondaryMuscles: ['hamstrings','glutes','core'], equipment: 'barbell', category: 'compound',  isUnilateral: false, defaultReps: '3-6',   defaultRestSec: 240, pattern: 'hip_hinge', cue: 'push floor away, hinge at hips', evidenceId: 'exercise_order' },
  { id: 'rack_pull',                 name: 'Rack Pull',                    primaryMuscle: 'back',      secondaryMuscles: ['hamstrings','glutes'], equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '4-6',   defaultRestSec: 210, pattern: 'hip_hinge', cue: 'bar starts at knee height — loads upper back hard' },
  { id: 'trap_bar_deadlift',         name: 'Trap Bar Deadlift',            primaryMuscle: 'back',      secondaryMuscles: ['quads','hamstrings','glutes'], equipment: 'barbell', category: 'compound', isUnilateral: false, defaultReps: '4-8',   defaultRestSec: 180, pattern: 'hip_hinge', cue: 'lower back pain alternative to conventional deadlift' },
  { id: 'barbell_row',               name: 'Barbell Row',                  primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '6-10',  defaultRestSec: 150, pattern: 'horizontal_pull', cue: 'pull to lower chest, squeeze shoulder blades' },
  { id: 'pendlay_row',               name: 'Pendlay Row',                  primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '5-8',   defaultRestSec: 180, pattern: 'horizontal_pull' },
  { id: 'dumbbell_row',              name: 'Dumbbell Row',                 primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'dumbbell',   category: 'compound',  isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 120, pattern: 'horizontal_pull' },
  { id: 'cable_row',                 name: 'Seated Cable Row',             primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'horizontal_pull', cue: 'chest up, drive elbows back' },
  { id: 'machine_row',               name: 'Machine Row',                  primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'horizontal_pull' },
  { id: 't_bar_row',                 name: 'T-Bar Row',                    primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'horizontal_pull' },
  { id: 'chest_supported_row',       name: 'Chest-Supported Row',          primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'horizontal_pull', cue: 'removes lower back from the equation' },
  { id: 'pull_up',                   name: 'Pull-Up',                      primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '5-10',  defaultRestSec: 150, pattern: 'vertical_pull', cue: 'full dead hang to chin over bar' },
  { id: 'chin_up',                   name: 'Chin-Up',                      primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '5-10',  defaultRestSec: 150, pattern: 'vertical_pull' },
  { id: 'assisted_pull_up',          name: 'Assisted Pull-Up',             primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'vertical_pull', cue: 'same pattern as pull-up — great stepping stone' },
  { id: 'lat_pulldown',              name: 'Lat Pulldown',                 primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'vertical_pull' },
  { id: 'wide_grip_lat_pulldown',    name: 'Wide-Grip Lat Pulldown',       primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'vertical_pull' },
  { id: 'close_grip_pulldown',       name: 'Close-Grip Pulldown',          primaryMuscle: 'back',      secondaryMuscles: ['biceps'],              equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'vertical_pull' },
  { id: 'straight_arm_pulldown',     name: 'Straight-Arm Pulldown',        primaryMuscle: 'back',      secondaryMuscles: [],                      equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'pullover' },
  { id: 'cable_pullover',            name: 'Cable Pullover',               primaryMuscle: 'back',      secondaryMuscles: ['chest'],               equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'pullover' },
  { id: 'face_pull',                 name: 'Face Pull',                    primaryMuscle: 'shoulders', secondaryMuscles: ['back'],                equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 90,  pattern: 'rear_delt', cue: 'external rotate at end, great for shoulder health' },
  { id: 'barbell_shrug',             name: 'Barbell Shrug',                primaryMuscle: 'back',      secondaryMuscles: [],                      equipment: 'barbell',    category: 'isolation', isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'shrug' },
  { id: 'dumbbell_shrug',            name: 'Dumbbell Shrug',               primaryMuscle: 'back',      secondaryMuscles: [],                      equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'shrug' },
  { id: 'good_morning',              name: 'Good Morning',                 primaryMuscle: 'hamstrings',secondaryMuscles: ['back','glutes'],        equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'hip_hinge' },

  // -- SHOULDERS -----------------------------------------------------------------
  { id: 'barbell_ohp',               name: 'Barbell Overhead Press',       primaryMuscle: 'shoulders', secondaryMuscles: ['triceps','core'],       equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '5-8',   defaultRestSec: 180, pattern: 'vertical_push', cue: 'brace core hard, press in a straight line' },
  { id: 'dumbbell_ohp',              name: 'Dumbbell Shoulder Press',      primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'],              equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'vertical_push' },
  { id: 'seated_db_press',           name: 'Seated Dumbbell Press',        primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'],              equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'vertical_push' },
  { id: 'machine_shoulder_press',    name: 'Machine Shoulder Press',       primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'],              equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'vertical_push' },
  { id: 'arnold_press',              name: 'Arnold Press',                 primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'],              equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '10-12', defaultRestSec: 120, pattern: 'vertical_push' },
  { id: 'lateral_raise_db',          name: 'Dumbbell Lateral Raise',       primaryMuscle: 'shoulders', secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '12-20', defaultRestSec: 60,  pattern: 'lateral_raise', cue: 'lead with elbows, slight forward lean' },
  { id: 'lateral_raise_cable',       name: 'Cable Lateral Raise',          primaryMuscle: 'shoulders', secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: true,  defaultReps: '12-20', defaultRestSec: 60,  pattern: 'lateral_raise' },
  { id: 'lateral_raise_machine',     name: 'Machine Lateral Raise',        primaryMuscle: 'shoulders', secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-20', defaultRestSec: 60,  pattern: 'lateral_raise' },
  { id: 'rear_delt_fly_db',          name: 'Rear Delt Fly (DB)',           primaryMuscle: 'shoulders', secondaryMuscles: ['back'],                equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'rear_delt' },
  { id: 'rear_delt_fly_cable',       name: 'Rear Delt Fly (Cable)',        primaryMuscle: 'shoulders', secondaryMuscles: ['back'],                equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'rear_delt' },
  { id: 'rear_delt_machine',         name: 'Reverse Pec Deck',             primaryMuscle: 'shoulders', secondaryMuscles: ['back'],                equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'rear_delt' },
  { id: 'upright_row',               name: 'Upright Row',                  primaryMuscle: 'shoulders', secondaryMuscles: ['biceps','back'],        equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 90,  pattern: 'lateral_raise' },
  { id: 'front_raise_db',            name: 'Dumbbell Front Raise',         primaryMuscle: 'shoulders', secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 60,  pattern: 'lateral_raise' },

  // -- BICEPS --------------------------------------------------------------------
  { id: 'barbell_curl',              name: 'Barbell Curl',                 primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'barbell',    category: 'isolation', isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 90,  pattern: 'curl' },
  { id: 'ez_bar_curl',               name: 'EZ-Bar Curl',                  primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'ez_bar',     category: 'isolation', isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 90,  pattern: 'curl', cue: 'easier on wrists than straight bar' },
  { id: 'dumbbell_curl',             name: 'Dumbbell Curl',                primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'hammer_curl',               name: 'Hammer Curl',                  primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 90,  pattern: 'curl', cue: 'neutral grip hits brachialis too' },
  { id: 'incline_db_curl',           name: 'Incline Dumbbell Curl',        primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'preacher_curl',             name: 'Preacher Curl',                primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'ez_bar',     category: 'isolation', isUnilateral: false, defaultReps: '10-14', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'cable_curl',                name: 'Cable Curl',                   primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'concentration_curl',        name: 'Concentration Curl',           primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: true,  defaultReps: '12-15', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'machine_curl',              name: 'Machine Curl',                 primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'spider_curl',               name: 'Spider Curl',                  primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'barbell',    category: 'isolation', isUnilateral: false, defaultReps: '10-14', defaultRestSec: 90,  pattern: 'curl' },
  { id: 'bayesian_curl',             name: 'Bayesian Cable Curl',          primaryMuscle: 'biceps',    secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: true,  defaultReps: '12-15', defaultRestSec: 90,  pattern: 'curl', cue: 'cable behind you — peak bicep stretch' },

  // -- TRICEPS -------------------------------------------------------------------
  { id: 'close_grip_bench',          name: 'Close-Grip Bench Press',       primaryMuscle: 'triceps',   secondaryMuscles: ['chest','shoulders'],    equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '6-10',  defaultRestSec: 150, pattern: 'horizontal_push' },
  { id: 'skull_crusher',             name: 'Skull Crusher',                primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'ez_bar',     category: 'isolation', isUnilateral: false, defaultReps: '10-14', defaultRestSec: 90,  pattern: 'triceps_ext', cue: 'lower to forehead, keep elbows in' },
  { id: 'overhead_tricep_ext',       name: 'Overhead Tricep Extension',    primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'triceps_ext' },
  { id: 'cable_pushdown_rope',       name: 'Cable Pushdown (Rope)',        primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'triceps_ext', cue: 'flare wrists at bottom for peak contraction' },
  { id: 'cable_pushdown_bar',        name: 'Cable Pushdown (Bar)',         primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'triceps_ext' },
  { id: 'tricep_dip',                name: 'Tricep Dip',                   primaryMuscle: 'triceps',   secondaryMuscles: ['chest','shoulders'],    equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '8-15',  defaultRestSec: 120, pattern: 'horizontal_push', cue: 'stay upright to keep load on triceps' },
  { id: 'overhead_cable_ext',        name: 'Overhead Cable Extension',     primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'triceps_ext' },
  { id: 'tricep_kickback',           name: 'Tricep Kickback',              primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: true,  defaultReps: '12-15', defaultRestSec: 60,  pattern: 'triceps_ext' },
  { id: 'machine_tricep_ext',        name: 'Machine Tricep Extension',     primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'triceps_ext' },
  { id: 'jm_press',                  name: 'JM Press',                     primaryMuscle: 'triceps',   secondaryMuscles: [],                       equipment: 'barbell',    category: 'isolation', isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 90,  pattern: 'triceps_ext', cue: 'hybrid skull crusher + close-grip press' },

  // -- QUADS ---------------------------------------------------------------------
  { id: 'back_squat',                name: 'Back Squat',                   primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes','core'], equipment: 'barbell', category: 'compound',  isUnilateral: false, defaultReps: '5-8',   defaultRestSec: 210, pattern: 'squat', cue: 'knees out, chest up, squat to parallel+', evidenceId: 'exercise_order' },
  { id: 'front_squat',               name: 'Front Squat',                  primaryMuscle: 'quads',     secondaryMuscles: ['core','glutes'],        equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '5-8',   defaultRestSec: 210, pattern: 'squat' },
  { id: 'leg_press',                 name: 'Leg Press',                    primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '10-15', defaultRestSec: 120, pattern: 'squat', cue: 'knee pain alternative to squats' },
  { id: 'hack_squat',                name: 'Hack Squat',                   primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'machine',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'squat' },
  { id: 'bulgarian_split_squat',     name: 'Bulgarian Split Squat',        primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'dumbbell',   category: 'compound',  isUnilateral: true,  defaultReps: '8-12',  defaultRestSec: 150, pattern: 'lunge', cue: 'front foot further out = more glute, closer = more quad' },
  { id: 'lunge',                     name: 'Barbell Lunge',                primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'barbell',    category: 'compound',  isUnilateral: true,  defaultReps: '10-12', defaultRestSec: 120, pattern: 'lunge' },
  { id: 'db_lunge',                  name: 'Dumbbell Lunge',               primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'dumbbell',   category: 'compound',  isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 120, pattern: 'lunge' },
  { id: 'leg_extension',             name: 'Leg Extension',                primaryMuscle: 'quads',     secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'knee_ext' },
  { id: 'goblet_squat',              name: 'Goblet Squat',                 primaryMuscle: 'quads',     secondaryMuscles: ['glutes','core'],        equipment: 'kettlebell', category: 'compound',  isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'squat' },
  { id: 'step_up',                   name: 'Step-Up',                      primaryMuscle: 'quads',     secondaryMuscles: ['glutes','hamstrings'],   equipment: 'dumbbell',   category: 'compound',  isUnilateral: true,  defaultReps: '10-12', defaultRestSec: 90,  pattern: 'lunge' },
  { id: 'smith_squat',               name: 'Smith Machine Squat',          primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes'],   equipment: 'smith',      category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'squat' },
  { id: 'sissy_squat',               name: 'Sissy Squat',                  primaryMuscle: 'quads',     secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'knee_ext' },
  { id: 'pause_squat',               name: 'Pause Squat',                  primaryMuscle: 'quads',     secondaryMuscles: ['hamstrings','glutes','core'], equipment: 'barbell', category: 'compound', isUnilateral: false, defaultReps: '4-6',   defaultRestSec: 210, pattern: 'squat', cue: '2-3s pause at bottom — eliminates stretch reflex' },

  // -- HAMSTRINGS ----------------------------------------------------------------
  { id: 'romanian_deadlift',         name: 'Romanian Deadlift',            primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes','back'],        equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'hip_hinge', cue: 'feel the stretch in hammies, hinge at hips' },
  { id: 'db_rdl',                    name: 'Dumbbell Romanian Deadlift',   primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes','back'],        equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '10-14', defaultRestSec: 120, pattern: 'hip_hinge' },
  { id: 'lying_leg_curl',            name: 'Lying Leg Curl',               primaryMuscle: 'hamstrings',secondaryMuscles: [],                      equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'knee_flex' },
  { id: 'seated_leg_curl',           name: 'Seated Leg Curl',              primaryMuscle: 'hamstrings',secondaryMuscles: [],                      equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'knee_flex' },
  { id: 'nordic_curl',               name: 'Nordic Hamstring Curl',        primaryMuscle: 'hamstrings',secondaryMuscles: [],                      equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '4-8',   defaultRestSec: 150, pattern: 'knee_flex' },
  { id: 'sumo_deadlift',             name: 'Sumo Deadlift',                primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes','quads','back'],equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '4-8',   defaultRestSec: 210, pattern: 'hip_hinge' },
  { id: 'cable_pull_through',        name: 'Cable Pull-Through',           primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes'],              equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'hip_hinge' },
  { id: 'glute_ham_raise',           name: 'Glute-Ham Raise',              primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes'],              equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '6-10',  defaultRestSec: 120, pattern: 'knee_flex' },
  { id: 'stiff_leg_deadlift',        name: 'Stiff-Leg Deadlift',           primaryMuscle: 'hamstrings',secondaryMuscles: ['glutes','back'],        equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 150, pattern: 'hip_hinge' },
  { id: 'single_leg_leg_curl',       name: 'Single-Leg Leg Curl',          primaryMuscle: 'hamstrings',secondaryMuscles: [],                      equipment: 'machine',    category: 'isolation', isUnilateral: true,  defaultReps: '10-14', defaultRestSec: 90,  pattern: 'knee_flex' },

  // -- GLUTES --------------------------------------------------------------------
  { id: 'hip_thrust',                name: 'Barbell Hip Thrust',           primaryMuscle: 'glutes',    secondaryMuscles: ['hamstrings'],           equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'hip_ext', cue: 'squeeze at top, posterior pelvic tilt' },
  { id: 'db_hip_thrust',             name: 'Dumbbell Hip Thrust',          primaryMuscle: 'glutes',    secondaryMuscles: ['hamstrings'],           equipment: 'dumbbell',   category: 'compound',  isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'hip_ext' },
  { id: 'glute_bridge',              name: 'Glute Bridge',                 primaryMuscle: 'glutes',    secondaryMuscles: ['hamstrings'],           equipment: 'bodyweight', category: 'compound',  isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'hip_ext' },
  { id: 'cable_kickback',            name: 'Cable Kickback',               primaryMuscle: 'glutes',    secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: true,  defaultReps: '12-15', defaultRestSec: 60,  pattern: 'hip_ext' },
  { id: 'machine_abduction',         name: 'Hip Abduction Machine',        primaryMuscle: 'glutes',    secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'hip_ext' },
  { id: 'single_leg_rdl',            name: 'Single-Leg RDL',               primaryMuscle: 'glutes',    secondaryMuscles: ['hamstrings'],           equipment: 'dumbbell',   category: 'compound',  isUnilateral: true,  defaultReps: '10-12', defaultRestSec: 90,  pattern: 'hip_hinge' },
  { id: 'donkey_kick',               name: 'Donkey Kick',                  primaryMuscle: 'glutes',    secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: true,  defaultReps: '15-20', defaultRestSec: 60,  pattern: 'hip_ext' },
  { id: 'clamshell',                 name: 'Clamshell',                    primaryMuscle: 'glutes',    secondaryMuscles: [],                       equipment: 'band',       category: 'isolation', isUnilateral: true,  defaultReps: '15-20', defaultRestSec: 60,  pattern: 'hip_ext' },
  { id: 'smith_hip_thrust',          name: 'Smith Machine Hip Thrust',     primaryMuscle: 'glutes',    secondaryMuscles: ['hamstrings'],           equipment: 'smith',      category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 120, pattern: 'hip_ext' },

  // -- CALVES --------------------------------------------------------------------
  { id: 'standing_calf_raise',       name: 'Standing Calf Raise',          primaryMuscle: 'calves',    secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-20', defaultRestSec: 60,  pattern: 'calf_raise', cue: 'full ROM — stretch at bottom, squeeze at top' },
  { id: 'seated_calf_raise',         name: 'Seated Calf Raise',            primaryMuscle: 'calves',    secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '12-20', defaultRestSec: 60,  pattern: 'calf_raise', cue: 'hits soleus more than standing variant' },
  { id: 'leg_press_calf_raise',      name: 'Leg Press Calf Raise',         primaryMuscle: 'calves',    secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'calf_raise' },
  { id: 'db_calf_raise',             name: 'Dumbbell Calf Raise',          primaryMuscle: 'calves',    secondaryMuscles: [],                       equipment: 'dumbbell',   category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'calf_raise' },
  { id: 'single_leg_calf_raise',     name: 'Single-Leg Calf Raise',        primaryMuscle: 'calves',    secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: true,  defaultReps: '15-20', defaultRestSec: 60,  pattern: 'calf_raise' },
  { id: 'jump_rope',                 name: 'Jump Rope',                    primaryMuscle: 'calves',    secondaryMuscles: ['core'],                 equipment: 'other',      category: 'compound',  isUnilateral: false, defaultReps: '60s',   defaultRestSec: 60,  pattern: 'calf_raise' },

  // -- CORE ----------------------------------------------------------------------
  { id: 'hanging_leg_raise',         name: 'Hanging Leg Raise',            primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '10-15', defaultRestSec: 90,  pattern: 'core_flex', cue: 'posterior pelvic tilt at top, control the descent' },
  { id: 'cable_crunch',              name: 'Cable Crunch',                 primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 90,  pattern: 'core_flex' },
  { id: 'plank',                     name: 'Plank',                        primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '30-60s', defaultRestSec: 60, pattern: 'core_anti_ext' },
  { id: 'ab_wheel',                  name: 'Ab Wheel Rollout',             primaryMuscle: 'core',      secondaryMuscles: ['back','shoulders'],     equipment: 'other',      category: 'compound',  isUnilateral: false, defaultReps: '8-12',  defaultRestSec: 90,  pattern: 'core_anti_ext' },
  { id: 'russian_twist',             name: 'Russian Twist',                primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'other',      category: 'isolation', isUnilateral: false, defaultReps: '20-30', defaultRestSec: 60,  pattern: 'core_rotation' },
  { id: 'sit_up',                    name: 'Sit-Up',                       primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'core_flex' },
  { id: 'decline_crunch',            name: 'Decline Crunch',               primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'machine',    category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'core_flex' },
  { id: 'dragon_flag',               name: 'Dragon Flag',                  primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '5-10',  defaultRestSec: 90,  pattern: 'core_anti_ext' },
  { id: 'hollow_body',               name: 'Hollow Body Hold',             primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '20-40s', defaultRestSec: 60, pattern: 'core_anti_ext' },
  { id: 'landmine_rotation',         name: 'Landmine Rotation',            primaryMuscle: 'core',      secondaryMuscles: ['shoulders'],            equipment: 'barbell',    category: 'compound',  isUnilateral: false, defaultReps: '10-12', defaultRestSec: 90,  pattern: 'core_rotation' },
  { id: 'pallof_press',              name: 'Pallof Press',                 primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'cable',      category: 'isolation', isUnilateral: false, defaultReps: '12-15', defaultRestSec: 60,  pattern: 'core_anti_ext' },
  { id: 'dead_bug',                  name: 'Dead Bug',                     primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'bodyweight', category: 'isolation', isUnilateral: false, defaultReps: '10-14', defaultRestSec: 60,  pattern: 'core_anti_ext' },
  { id: 'wood_chop',                 name: 'Cable Wood Chop',              primaryMuscle: 'core',      secondaryMuscles: ['shoulders'],            equipment: 'cable',      category: 'compound',  isUnilateral: false, defaultReps: '12-15', defaultRestSec: 60,  pattern: 'core_rotation' },
  { id: 'weighted_crunch',           name: 'Weighted Crunch',              primaryMuscle: 'core',      secondaryMuscles: [],                       equipment: 'other',      category: 'isolation', isUnilateral: false, defaultReps: '15-20', defaultRestSec: 60,  pattern: 'core_flex' },
];

// -- Helpers ------------------------------------------------------------------

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id);
}

export function getExercisesByMuscle(muscle: VolumeGroup): Exercise[] {
  return EXERCISES.filter(e => e.primaryMuscle === muscle);
}

export function getCompoundsByMuscle(muscle: VolumeGroup): Exercise[] {
  return EXERCISES.filter(e => e.primaryMuscle === muscle && e.category === 'compound');
}

/** Return exercises sharing the same movement pattern, ranked by pattern match then muscle match. */
export function getSimilarExercises(source: Exercise, limit = 12): Exercise[] {
  const candidates = EXERCISES.filter(e => e.id !== source.id);
  const scored = candidates.map(e => {
    let score = 0;
    if (source.pattern && e.pattern === source.pattern) score += 10;
    if (e.primaryMuscle === source.primaryMuscle) score += 5;
    const secOverlap = source.secondaryMuscles.filter(
      m => e.primaryMuscle === m || e.secondaryMuscles.includes(m)
    ).length;
    score += secOverlap * 2;
    if (e.category === source.category) score += 1;
    return { exercise: e, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.exercise);
}

// Fractional weekly volume: primary = 1.0, each secondary = 0.5
export function computeFractionalSets(
  exerciseId: string,
  setsLogged: number,
  customExercises: Exercise[] = []
): Record<VolumeGroup, number> {
  const db = [...EXERCISES, ...customExercises];
  const ex = db.find(e => e.id === exerciseId);
  if (!ex) return {} as Record<VolumeGroup, number>;
  const result: Partial<Record<VolumeGroup, number>> = {};
  result[ex.primaryMuscle] = (result[ex.primaryMuscle] ?? 0) + setsLogged * 1.0;
  for (let i = 0; i < ex.secondaryMuscles.length; i++) {
    const sec = ex.secondaryMuscles[i];
    result[sec] = (result[sec] ?? 0) + setsLogged * 0.5;
  }
  return result as Record<VolumeGroup, number>;
}

export const VOLUME_GROUPS: VolumeGroup[] = [
  'chest','back','shoulders','biceps','triceps',
  'quads','hamstrings','glutes','calves','core',
];
