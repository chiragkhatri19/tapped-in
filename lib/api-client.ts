// Typed wrapper around the Railway backend API.
// Auth: pass the Supabase session access_token as Bearer.
//   const { data: { session } } = await supabase.auth.getSession();
//   await apiClient.someMethod(session.access_token, ...);

import type { GenerateWorkoutRequest, WorkoutSkeleton } from '@/shared/types/api';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const hasBody = options?.body != null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? `API error ${res.status}`);
  }
  return json.data as T;
}

export const apiClient = {
  scanMeal: (token: string, body: { imageBase64: string; mimeType: string; isCooked: boolean }) =>
    apiFetch('/api/scan-meal', token, { method: 'POST', body: JSON.stringify(body) }),

  getProfile: (token: string) =>
    apiFetch('/api/profile', token),

  upsertProfile: (token: string, profile: object) =>
    apiFetch('/api/profile', token, { method: 'PUT', body: JSON.stringify(profile) }),

  getLogs: (token: string, dateKey: string) =>
    apiFetch(`/api/logs/${dateKey}`, token),

  syncLogs: (token: string, meals: object[]) =>
    apiFetch('/api/logs', token, { method: 'POST', body: JSON.stringify(meals) }),

  deleteMeal: (token: string, mealId: string) =>
    apiFetch(`/api/logs/${mealId}`, token, { method: 'DELETE' }),

  generateWorkout: (token: string, body: GenerateWorkoutRequest) =>
    apiFetch<WorkoutSkeleton>('/api/generate-workout', token, { method: 'POST', body: JSON.stringify(body) }),

  postCoach: (token: string, body: {
    userMessage: string;
    history: object[];
    context: object;
  }) => apiFetch<unknown>('/api/coach', token, { method: 'POST', body: JSON.stringify(body) }),

  deleteAccount: (token: string) =>
    apiFetch<null>('/api/account', token, { method: 'DELETE' }),

  syncPull: (token: string, lastPulledAt: number | null) =>
    apiFetch<{ changes: unknown; timestamp: number }>(
      '/api/sync/pull',
      token,
      { method: 'POST', body: JSON.stringify({ lastPulledAt }) },
    ),

  syncPush: (token: string, changes: object, lastPulledAt: number | null) =>
    apiFetch<void>(
      '/api/sync/push',
      token,
      { method: 'POST', body: JSON.stringify({ changes, lastPulledAt }) },
    ),
};
