/**
 * Inline confirmation card for coach actions that mutate app state.
 * The user must tap "confirm" — nothing fires automatically (CLAUDE.md rule 5).
 *
 * Handles: quick_log (water), edit_profile, manage_plan, edit_workout (set_active / update_meta),
 * edit_notes (plan target).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useProfileStore } from '@/stores/profile-store';
import { useWorkoutStore } from '@/stores/workout-store';
import type { GoalMode } from '@/types';
import type {
  CoachAction,
  QuickLogAction,
  EditProfileAction,
  ManagePlanAction,
  EditWorkoutAction,
  LogWeightAction,
} from '@/lib/coach/actions';

type SupportedAction =
  | QuickLogAction
  | EditProfileAction
  | ManagePlanAction
  | EditWorkoutAction
  | LogWeightAction;

interface Props {
  action: CoachAction;
}

function Preview({ action, colors }: { action: SupportedAction; colors: ReturnType<typeof useColors> }) {
  const plans = useWorkoutStore(s => s.plans);
  const profile = useProfileStore(s => s.profile);

  if (action.kind === 'quick_log') {
    return (
      <Text style={[s.preview, { color: colors.foreground }]}>
        {action.logType === 'water_set' ? '' : '+'}{action.value} {action.unit} water
      </Text>
    );
  }

  if (action.kind === 'log_weight') {
    return (
      <Text style={[s.preview, { color: colors.foreground }]}>
        weight: {action.weightKg} kg
      </Text>
    );
  }

  if (action.kind === 'edit_profile') {
    const patch = action.patch;
    const lines: string[] = [];
    if (patch.goalMode !== undefined)
      lines.push(`goal: ${profile?.goalMode ?? '?'} → ${patch.goalMode}`);
    if (patch.age !== undefined)
      lines.push(`age: ${profile?.age ?? '?'} → ${patch.age}`);
    if (patch.heightCm !== undefined)
      lines.push(`height: ${profile?.heightCm ?? '?'} cm → ${patch.heightCm} cm`);
    if (patch.trainingDaysPerWeek !== undefined)
      lines.push(`training days: ${profile?.trainingDaysPerWeek ?? '?'} → ${patch.trainingDaysPerWeek}`);
    if (patch.dailySteps !== undefined)
      lines.push(`daily steps: ${profile?.dailySteps ?? '?'} → ${patch.dailySteps}`);
    return (
      <View style={{ gap: 2 }}>
        {lines.map((l, i) => (
          <Text key={i} style={[s.preview, { color: colors.foreground }]}>{l}</Text>
        ))}
        {action.warningMessage ? (
          <Text style={[s.warning, { color: colors.orange }]}>{action.warningMessage}</Text>
        ) : null}
      </View>
    );
  }

  if (action.kind === 'manage_plan') {
    const plan = plans.find(p => p.id === action.planId);
    const name = plan?.splitName ?? action.planId;
    if (action.op === 'delete') {
      return (
        <Text style={[s.preview, { color: colors.foreground }]}>
          delete plan "{name}"
        </Text>
      );
    }
    return (
      <Text style={[s.preview, { color: colors.foreground }]}>
        switch active plan to "{name}"
      </Text>
    );
  }

  if (action.kind === 'edit_workout') {
    const plan = plans.find(p => p.id === action.planId);
    const name = plan?.splitName ?? action.planId;
    if (action.op === 'set_active') {
      return (
        <Text style={[s.preview, { color: colors.foreground }]}>
          set active plan: "{name}"
        </Text>
      );
    }
    if (action.op === 'update_meta') {
      const patch = action.patch ?? {};
      const keys = Object.keys(patch);
      return (
        <Text style={[s.preview, { color: colors.foreground }]}>
          update "{name}": {keys.join(', ')}
        </Text>
      );
    }
  }

  return null;
}

export default function CoachActionCard({ action }: Props) {
  const colors = useColors();
  const [applied, setApplied] = useState(false);

  const profile     = useProfileStore(s => s.profile);
  const saveProfile = useProfileStore(s => s.saveProfile);
  const plans       = useWorkoutStore(s => s.plans);
  const setActivePlan = useWorkoutStore(s => s.setActivePlan);
  const deletePlan    = useWorkoutStore(s => s.deletePlan);
  const updatePlan    = useWorkoutStore(s => s.updatePlan);

  const isDestructive =
    (action.kind === 'manage_plan' && action.op === 'delete');

  // quick_log (water) and log_weight are applied in the coach pipeline the
  // moment the response arrives (see trainer.tsx applyCoachAutoActions), so the
  // card only reports the result — no confirm tap needed and no double-apply.
  const autoApplied = action.kind === 'quick_log' || action.kind === 'log_weight';

  const supported: SupportedAction | null = (
    action.kind === 'quick_log' ||
    action.kind === 'log_weight' ||
    action.kind === 'edit_profile' ||
    action.kind === 'manage_plan' ||
    (action.kind === 'edit_workout' && (action.op === 'set_active' || action.op === 'update_meta'))
  ) ? action as SupportedAction : null;

  const handleConfirm = useCallback(() => {
    if (!supported || applied || autoApplied) return;

    if (supported.kind === 'edit_profile') {
      if (!profile) return;
      const patch = supported.patch;
      saveProfile({
        ...profile,
        ...(patch.goalMode            !== undefined ? { goalMode:            patch.goalMode as GoalMode } : {}),
        ...(patch.age                 !== undefined ? { age:                 patch.age }                 : {}),
        ...(patch.heightCm            !== undefined ? { heightCm:            patch.heightCm }            : {}),
        ...(patch.trainingDaysPerWeek !== undefined ? { trainingDaysPerWeek: patch.trainingDaysPerWeek } : {}),
        ...(patch.dailySteps          !== undefined ? { dailySteps:          patch.dailySteps }          : {}),
      });
    } else if (supported.kind === 'manage_plan') {
      if (supported.op === 'delete')     deletePlan(supported.planId);
      else if (supported.op === 'set_active') setActivePlan(supported.planId);
    } else if (supported.kind === 'edit_workout') {
      if (supported.op === 'set_active') {
        setActivePlan(supported.planId);
      } else if (supported.op === 'update_meta') {
        const patch = supported.patch ?? {};
        // Whitelist safe fields only
        const safe: Record<string, unknown> = {};
        if (typeof patch.splitName === 'string') safe.splitName = patch.splitName;
        if (Object.keys(safe).length > 0) updatePlan(supported.planId, safe);
      }
    }

    setApplied(true);
  }, [supported, applied, autoApplied, profile, saveProfile, setActivePlan, deletePlan, updatePlan, plans]);

  if (!supported) return null;

  return (
    <View style={[s.card, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
      <View style={s.iconRow}>
        <Feather name="zap" size={13} color={colors.violet} />
        <Text style={[s.actionLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
      </View>

      <Preview action={supported} colors={colors} />

      {applied || autoApplied ? (
        <View style={[s.btn, s.btnApplied, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
          <Feather name="check" size={13} color={colors.foreground} />
          <Text style={[s.btnTxt, { color: colors.foreground }]}>{autoApplied ? 'logged' : 'applied'}</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [
            s.btn,
            {
              backgroundColor: isDestructive
                ? (pressed ? colors.destructive : colors.card)
                : (pressed ? colors.teal : colors.card),
              borderColor: colors.foreground,
              transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
            },
          ]}
        >
          <Feather name={isDestructive ? 'trash-2' : 'check'} size={13} color={colors.foreground} />
          <Text style={[s.btnTxt, { color: colors.foreground }]}>
            {isDestructive ? 'confirm delete' : 'confirm'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontFamily: F.monoMed,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  preview: {
    fontFamily: F.bodyMed,
    fontSize: 13,
    lineHeight: 19,
  },
  warning: {
    fontFamily: F.bodyReg,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: BRUTAL.shadowSm, height: BRUTAL.shadowSm },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: BRUTAL.shadowSm,
  },
  btnApplied: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnTxt: {
    fontFamily: F.bodyMed,
    fontSize: 13,
    flex: 1,
  },
});
