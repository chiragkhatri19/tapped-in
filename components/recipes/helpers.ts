import { storage } from '@/lib/storage';
import type { Recipe } from './types';

const RECIPES_KEY = 'tapped_in_recipes';
const VOTES_KEY   = 'tapped_in_recipe_votes';
const SAVED_KEY   = 'tapped_in_saved_recipes';

function hotScore(r: Recipe): number {
  const h = (Date.now() - new Date(r.postedAt).getTime()) / 3600000;
  return r.upvotes / Math.pow(h + 2, 1.5);
}

export function sortRecipes(recipes: Recipe[], mode: string, votes: Record<string, 'up' | null>): Recipe[] {
  const withVotes = recipes.map(r => ({
    ...r,
    upvotes: r.upvotes + (votes[r.id] === 'up' ? 1 : 0),
  }));
  switch (mode) {
    case 'hot':     return [...withVotes].sort((a, b) => hotScore(b) - hotScore(a));
    case 'top':     return [...withVotes].sort((a, b) => b.upvotes - a.upvotes);
    case 'new':     return [...withVotes].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    case 'protein': return [...withVotes].sort((a, b) => b.macrosPerServing.proteinG - a.macrosPerServing.proteinG);
    case 'lowcal':  return [...withVotes].sort((a, b) => a.macrosPerServing.calories - b.macrosPerServing.calories);
    default:        return withVotes;
  }
}

export function computeQualityScore(
  macros: { calories: number; proteinG: number; carbsG: number; fatG: number },
  micros: { ironMg: number; calciumMg: number; b12Mcg: number; vitaminDIu: number; zincMg: number },
  prepTimeMin: number
): number {
  let score = 0;
  const density = (macros.proteinG * 4) / macros.calories;
  if (density >= 0.35) score += 3;
  else if (density >= 0.25) score += 2;
  else if (density >= 0.15) score += 1;

  if (macros.proteinG >= 35) score += 2;
  else if (macros.proteinG >= 25) score += 1.5;
  else if (macros.proteinG >= 20) score += 1;

  if (prepTimeMin <= 10) score += 2;
  else if (prepTimeMin <= 20) score += 1.5;
  else if (prepTimeMin <= 30) score += 1;

  let microHits = 0;
  if (micros.ironMg >= 3) microHits++;
  if (micros.calciumMg >= 200) microHits++;
  if (micros.b12Mcg >= 1) microHits++;
  score += Math.min(microHits, 2);

  return Math.min(Math.round(score * 10) / 10, 10);
}

export function computeQualityReason(
  macros: { calories: number; proteinG: number; carbsG: number; fatG: number },
  micros: { ironMg: number; calciumMg: number; b12Mcg: number; vitaminDIu: number; zincMg: number },
  prepTimeMin: number
): string {
  const parts: string[] = [];
  const density = (macros.proteinG * 4) / macros.calories;
  if (density >= 0.3) parts.push(`protein density is excellent (${Math.round(density * 100)}% of calories)`);
  else parts.push(`protein density is moderate — consider adding a lean protein source`);
  if (macros.proteinG >= 30) parts.push(`absolute protein strong at ${macros.proteinG}g per serving`);
  if (prepTimeMin <= 10) parts.push(`quick prep time is a big win`);
  if (micros.b12Mcg < 1 && micros.ironMg < 2) parts.push(`micronutrient profile is limited — pair with dairy or eggs for B12`);
  else if (micros.ironMg >= 4) parts.push(`strong iron content — good for vegetarians`);
  if (micros.calciumMg >= 400) parts.push(`high calcium from dairy`);
  return parts.join('. ') + '.';
}

export async function loadRecipes(): Promise<Recipe[]> {
  const raw = storage.getString(RECIPES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  storage.set(RECIPES_KEY, JSON.stringify(recipes));
}

export async function loadVotes(): Promise<Record<string, 'up' | null>> {
  const raw = storage.getString(VOTES_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function saveVotes(votes: Record<string, 'up' | null>): Promise<void> {
  storage.set(VOTES_KEY, JSON.stringify(votes));
}

export async function loadSaved(): Promise<string[]> {
  const raw = storage.getString(SAVED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSaved(saved: string[]): Promise<void> {
  storage.set(SAVED_KEY, JSON.stringify(saved));
}

export function toggleVote(id: string, votes: Record<string, 'up' | null>): Record<string, 'up' | null> {
  const next = { ...votes };
  next[id] = next[id] === 'up' ? null : 'up';
  return next;
}

export function toggleSave(id: string, saved: string[]): string[] {
  const idx = saved.indexOf(id);
  if (idx === -1) return [...saved, id];
  return saved.filter(s => s !== id);
}

export function hasOil(ingredients: { name: string }[]): boolean {
  return ingredients.some(i => /oil|ghee/i.test(i.name));
}

export function timeAgo(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return 'just now';
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}
