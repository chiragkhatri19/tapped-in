/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox, BrutalButton } from '@/components/brutal';
import { SectionLabel, WeekStrip, makeWeekStripDays, ExerciseRow } from '@/components/workout/ui';
import { storageAsyncCompat as AsyncStorage } from '@/lib/storage';
import { EvidenceModal } from '@/components/EvidenceModal';
import { EVIDENCE_CARDS } from '@/data/evidence';
import type { WorkoutPlan, CardioSession } from '@/stores/workout-store';
import type { EvidenceCard } from '@/types';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

interface Props {
  plan: WorkoutPlan | any;
  daysPerWeek: number;
  sessionMinutes: number;
  goalLabel: string;
  topPad: number;
  bottomPad: number;
  existingPlans?: any[];
  onReset: () => void;
  onSaved?: (plan: any, setAsActive: boolean) => void;
  onEdit?: () => void;
}

export default function WorkoutPlanDisplay({
  plan, daysPerWeek, sessionMinutes, goalLabel,
  topPad, bottomPad, existingPlans, onReset, onSaved, onEdit,
}: Props) {
  const colors = useColors();

  const sessions: any[] = plan.sessions ?? [];
  const [expandedSessions, setExpandedSessions] = useState<boolean[]>(() =>
    sessions.map(() => false)
  );
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [showVolume, setShowVolume] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState<EvidenceCard | null>(null);
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  const schedule      = plan.weeklySchedule ?? {};
  const volume        = plan.weeklyVolumeByMuscle ?? {};
  const cardioProgram = plan.cardioProgram ?? null;
  // legacy back-compat
  const cardioLegacy  = !cardioProgram ? (plan.cardioSummary ?? null) : null;
  const citations: any[] = plan.citations ?? [];

  function toggleSession(idx: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSessions(prev => prev.map((v, i) => i === idx ? !v : v));
  }

  function toggleExercise(key: string) {
    setExpandedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function openEvidence(id: string) {
    const card = EVIDENCE_CARDS.find(c => c.id === id);
    if (card) { setEvidenceModal(card); setEvidenceVisible(true); }
  }

  async function handleSave() {
    if (!onSaved) {
      await AsyncStorage.setItem('tapped_in_workout_plan', JSON.stringify(plan));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    const hasExisting = (existingPlans ?? []).length > 0;
    if (hasExisting) {
      Alert.alert('set as active plan?', 'this will become your current active plan.', [
        { text: 'keep current active', onPress: () => { onSaved(plan, false); setSaved(true); } },
        { text: 'set as active', style: 'default', onPress: () => { onSaved(plan, true); setSaved(true); } },
      ]);
    } else {
      onSaved(plan, true);
      setSaved(true);
    }
  }

  // -- Session cards -----------------------------------------------------------
  function SessionCards() {
    return (
      <View style={{ marginBottom: 20 }}>
        <SectionLabel style={{ marginBottom: 10 }}>YOUR SESSIONS</SectionLabel>
        {sessions.map((session: any, idx: number) => {
          const isExpanded = expandedSessions[idx] ?? false;
          const totalSets  = (session.exercises ?? []).reduce((a: number, e: any) => a + (e.sets ?? 0), 0);
          const muscles: string[] = session.musclesFocused ?? [];

          return (
            <BrutalBox key={idx} style={{ marginBottom: 12 }}>
              {/* Session header */}
              <Pressable onPress={() => toggleSession(idx)} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[s.sessionName, { color: colors.foreground }]}>{session.name}</Text>
                    {session.sessionGoal ? (
                      <Text style={[s.sessionGoal, { color: colors.mutedForeground }]} numberOfLines={isExpanded ? undefined : 1}>
                        {session.sessionGoal}
                      </Text>
                    ) : null}
                    {isExpanded && session.selectionRationale ? (
                      <Text style={[s.selectionRationale, { color: colors.violet, marginTop: 4 }]}>
                        {session.selectionRationale}
                      </Text>
                    ) : null}
                  </View>
                  <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} style={{ marginTop: 3 }} />
                </View>

                {/* Muscle tags */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {muscles.map((m: string) => (
                    <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: muscleColor(m) }} />
                      <Text style={[s.muscleName, { color: colors.mutedForeground }]}>{m}</Text>
                    </View>
                  ))}
                </View>

                {/* Stats row — separate line so muscle tags never push it off screen */}
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                  {session.estimatedDurationMin ? (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                      <Text style={[s.statNum, { color: colors.foreground }]}>{session.estimatedDurationMin}</Text>
                      <Text style={[s.statUnit, { color: colors.mutedForeground }]}>min</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={[s.statNum, { color: colors.foreground }]}>{(session.exercises ?? []).length}</Text>
                    <Text style={[s.statUnit, { color: colors.mutedForeground }]}>exercises</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={[s.statNum, { color: colors.foreground }]}>{totalSets}</Text>
                    <Text style={[s.statUnit, { color: colors.mutedForeground }]}>sets</Text>
                  </View>
                </View>
              </Pressable>

              {/* Expanded: exercises */}
              {isExpanded && (
                <View style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.foreground, 0.1), paddingHorizontal: 16 }}>
                  {(session.exercises ?? []).map((ex: any, i: number) => (
                    <ExerciseRowExpanded
                      key={ex.order}
                      ex={ex}
                      sessionKey={`s${idx}`}
                      expanded={!!expandedExercises[`s${idx}_${ex.order}`]}
                      onToggle={() => toggleExercise(`s${idx}_${ex.order}`)}
                    />
                  ))}

                  {/* Post-lift cardio block */}
                  {session.cardioBlock && (
                    <View style={[s.cardioBlock, { borderTopColor: withAlpha(colors.foreground, 0.1), borderColor: colors.orange, backgroundColor: withAlpha(colors.orange, 0.06) }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Feather name="activity" size={12} color={colors.orange} />
                        <Text style={[s.cardioLabel, { color: colors.orange }]}>
                          post-workout: {session.cardioBlock.modality ?? session.cardioBlock.type ?? 'cardio'}
                        </Text>
                      </View>
                      <Text style={[s.cardioMeta, { color: colors.mutedForeground }]}>
                        {session.cardioBlock.durationMin} min · {session.cardioBlock.targetHRbpm}
                      </Text>
                      {session.cardioBlock.evidenceId && (
                        <Pressable onPress={() => openEvidence(session.cardioBlock.evidenceId)} style={{ marginTop: 6 }}>
                          <Text style={[s.whyLink, { color: colors.orange }]}>why after lifting? →</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}
            </BrutalBox>
          );
        })}
      </View>
    );
  }

  // -- Per-exercise row (with cue expansion) -----------------------------------
  function ExerciseRowExpanded({ ex, sessionKey, expanded, onToggle }: { ex: any; sessionKey: string; expanded: boolean; onToggle: () => void }) {
    const hasDetail = ex.coachingCue || (ex.alternatives ?? []).length > 0 || ex.healthModification;
    return (
      <View style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.foreground, 0.08) }}>
        <Pressable onPress={hasDetail ? onToggle : undefined} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11, gap: 10 }}>
          <Text style={[s.exerciseOrder, { color: colors.mutedForeground, marginTop: 1 }]}>{String(ex.order).padStart(2, '0')}</Text>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: muscleColor(ex.muscleGroup ?? ''), marginTop: 4 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.exerciseName, { color: colors.foreground }]} numberOfLines={2}>{ex.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
              <Text style={[s.exerciseMeta, { color: colors.mutedForeground }]}>{ex.muscleGroup}</Text>
              {ex.isCompound && (
                <View style={{ backgroundColor: withAlpha(colors.violet, 0.12), paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={[s.badge, { color: colors.violet }]}>COMPOUND</Text>
                </View>
              )}
              {ex.isPriorityLift && (
                <View style={{ backgroundColor: withAlpha(colors.orange, 0.12), paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={[s.badge, { color: colors.orange }]}>PRIORITY</Text>
                </View>
              )}
            </View>
          </View>
          {/* Prescription — fixed right column, never shrinks */}
          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={[s.prescription, { color: colors.foreground }]}>{ex.sets}×{ex.reps}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 5, marginTop: 3, maxWidth: 110 }}>
              <Text style={[s.prescriptionMeta, { color: colors.mutedForeground }]}>{ex.restSeconds}s</Text>
              {ex.tempo ? <Text style={[s.prescriptionMeta, { color: colors.mutedForeground }]}>{ex.tempo}</Text> : null}
              {ex.rir != null ? <Text style={[s.prescriptionMeta, { color: colors.mutedForeground }]}>RIR {ex.rir}</Text> : null}
            </View>
          </View>
          {hasDetail ? <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} style={{ marginTop: 2, flexShrink: 0 }} /> : null}
        </Pressable>

        {expanded && hasDetail && (
          <View style={{ paddingLeft: 37, paddingBottom: 12 }}>
            {ex.coachingCue ? (
              <Text style={[s.cue, { color: colors.mutedForeground, borderLeftColor: colors.violet }]}>
                "{ex.coachingCue}"
              </Text>
            ) : null}
            {ex.healthModification ? (
              <Text style={[s.modification, { color: colors.orange }]}>modified: {ex.healthModification}</Text>
            ) : null}
            {(ex.alternatives ?? []).length > 0 && (
              <Text style={[s.alts, { color: colors.mutedForeground }]}>alts: {(ex.alternatives ?? []).join(' · ')}</Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // -- Cardio programme card ---------------------------------------------------
  function CardioProgramCard() {
    if (!cardioProgram && !cardioLegacy) return null;

    // New: full programme
    if (cardioProgram) {
      const PLACEMENT_LABEL: Record<string, string> = { post_lift: 'post-lift', standalone: 'own session' };
      return (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel style={{ marginBottom: 10 }}>CARDIO PROGRAMME</SectionLabel>
          <BrutalBox style={{ padding: 16 }}>
            {/* Programme summary header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardioProgramTitle, { color: colors.foreground }]}>
                  {cardioProgram.sessionsPerWeek}×/week · {cardioProgram.totalCardioMinPerWeek} min total
                </Text>
                <Text style={[s.cardioProgramSub, { color: colors.mutedForeground }]}>
                  max HR: {cardioProgram.maxHR} BPM (Tanaka formula)
                </Text>
              </View>
              <View style={[s.cardioBadge, { backgroundColor: withAlpha(colors.orange, 0.12), borderColor: colors.orange }]}>
                <Text style={[s.cardioBadgeText, { color: colors.orange }]}>scheduled</Text>
              </View>
            </View>

            <Text style={[s.cardioProgramRationale, { color: colors.mutedForeground }]}>
              {cardioProgram.goalRationale}
            </Text>

            {/* Per-session rows */}
            <View style={{ marginTop: 14, gap: 10 }}>
              {cardioProgram.sessions.map((cs: CardioSession, i: number) => (
                <View key={i} style={[s.cardioSessionRow, { borderColor: withAlpha(colors.foreground, 0.1), backgroundColor: colors.background }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[s.cardioDay, { color: colors.foreground }]}>
                      {cs.day.charAt(0).toUpperCase() + cs.day.slice(1)} · {cs.modality}
                    </Text>
                    <View style={[s.placementTag, { borderColor: withAlpha(colors.foreground, 0.25) }]}>
                      <Text style={[s.placementTagText, { color: colors.mutedForeground }]}>{PLACEMENT_LABEL[cs.placement] ?? cs.placement}</Text>
                    </View>
                  </View>
                  <Text style={[s.cardioZone, { color: colors.orange }]}>
                    {cs.hrZone.label} · {cs.hrZone.bpmLow}-{cs.hrZone.bpmHigh} BPM
                  </Text>
                  <Text style={[s.cardioDuration, { color: colors.mutedForeground }]}>
                    {cs.durationMin} min · {cs.structure}
                  </Text>
                  <Pressable onPress={() => openEvidence(cs.evidenceId)} style={{ marginTop: 6 }}>
                    <Text style={[s.whyLink, { color: colors.teal }]}>why? →</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </BrutalBox>
        </View>
      );
    }

    // Legacy fallback
    return (
      <View style={{ marginBottom: 20 }}>
        <SectionLabel style={{ marginBottom: 10 }}>CARDIO</SectionLabel>
        <BrutalBox style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} />
            <Text style={[s.cardioProgramTitle, { color: colors.foreground }]}>cardio prescription</Text>
          </View>
          <Text style={[s.cardioProgramRationale, { color: colors.mutedForeground }]}>
            {cardioLegacy?.goalRationale ?? ''}
          </Text>
          <Pressable onPress={() => openEvidence('post_workout_cardio')} style={{ marginTop: 8 }}>
            <Text style={[s.whyLink, { color: colors.orange }]}>why post-lift? →</Text>
          </Pressable>
        </BrutalBox>
      </View>
    );
  }

  // -- Volume overview ---------------------------------------------------------
  function VolumeOverview() {
    const volumeEntries = Object.entries(volume) as [string, { setsPerWeek: number; frequency: number }][];
    if (volumeEntries.length === 0) return null;
    return (
      <View style={{ marginBottom: 20 }}>
        <Pressable
          onPress={() => setShowVolume(v => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel>WEEKLY VOLUME</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: F.monoSemi, fontSize: 10, color: colors.violet }}>{showVolume ? 'hide' : 'show'}</Text>
            <Feather name={showVolume ? 'chevron-up' : 'chevron-down'} size={12} color={colors.violet} />
          </View>
        </Pressable>

        {showVolume && (
          <BrutalBox style={{ padding: 14 }}>
            {volumeEntries.map(([muscle, data], i) => {
              const good = data.setsPerWeek >= 10 && data.setsPerWeek <= 22;
              const color = data.setsPerWeek < 10 ? colors.persimmon : data.setsPerWeek <= 14 ? colors.teal : colors.orange;
              return (
                <View key={muscle} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: i < volumeEntries.length - 1 ? 1 : 0, borderBottomColor: withAlpha(colors.foreground, 0.08) }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: muscleColor(muscle), marginRight: 10 }} />
                  <Text style={[s.volumeMuscle, { color: colors.foreground }]}>{muscle}</Text>
                  <Text style={[s.volumeSets, { color, marginRight: 12 }]}>{data.setsPerWeek} sets</Text>
                  <Text style={[s.volumeFreq, { color: colors.mutedForeground }]}>{data.frequency}×/wk</Text>
                </View>
              );
            })}
            <Pressable onPress={() => openEvidence('workout_volume')} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: F.monoSemi, fontSize: 11, color: colors.violet }}>why 12-14 sets?</Text>
              <Feather name="external-link" size={11} color={colors.violet} />
            </Pressable>
          </BrutalBox>
        )}
      </View>
    );
  }

  // -- Main render -------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EvidenceModal
        card={evidenceModal}
        visible={evidenceVisible}
        onClose={() => { setEvidenceVisible(false); setEvidenceModal(null); }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
            <Text style={[s.planTitle, { color: colors.foreground, flex: 1 }]}>
              {plan.splitName ?? 'your programme.'}
            </Text>
            <Pressable onPress={onEdit ?? onReset} hitSlop={8} style={{ marginTop: 6 }}>
              <Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: colors.violet }}>
                {onEdit ? 'edit' : 'change inputs'}
              </Text>
            </Pressable>
          </View>

          {/* Meta chips */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <View style={[s.goalChip, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
              <Text style={[s.goalChipText, { color: colors.primaryForeground }]}>{goalLabel}</Text>
            </View>
            {daysPerWeek > 0 && (
              <View style={[s.metaChip, { borderColor: withAlpha(colors.foreground, 0.3) }]}>
                <Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{daysPerWeek} days/wk</Text>
              </View>
            )}
            {sessionMinutes > 0 && (
              <View style={[s.metaChip, { borderColor: withAlpha(colors.foreground, 0.3) }]}>
                <Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{sessionMinutes} min/session</Text>
              </View>
            )}
            {cardioProgram && (
              <View style={[s.metaChip, { borderColor: withAlpha(colors.orange, 0.4) }]}>
                <Text style={[s.metaChipText, { color: colors.orange }]}>{cardioProgram.sessionsPerWeek}× cardio/wk</Text>
              </View>
            )}
          </View>

          {plan.programmeRationale && (
            <Text style={[s.rationale, { color: colors.mutedForeground }]}>
              {plan.programmeRationale}
            </Text>
          )}
        </View>

        {/* Save CTA — above sessions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 22 }}>
          <BrutalButton
            label={saved ? 'saved to my plans' : 'save to my plans'}
            variant={saved ? 'pop' : 'primary'}
            height={52}
            onPress={handleSave}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Week strip */}
          <View style={{ marginBottom: 22 }}>
            <SectionLabel style={{ marginBottom: 10 }}>YOUR WEEK</SectionLabel>
            <BrutalBox style={{ padding: 14 }}>
              <WeekStrip days={makeWeekStripDays(schedule)} />
            </BrutalBox>
          </View>

          <SessionCards />
          <CardioProgramCard />
          <VolumeOverview />

          {/* Progression plan */}
          {plan.progressionPlan && (
            <View style={{ marginBottom: 20 }}>
              <BrutalBox style={{ padding: 16 }}>
                <SectionLabel style={{ marginBottom: 10 }}>HOW TO PROGRESS</SectionLabel>
                <Text style={[s.rationaleText, { color: colors.mutedForeground }]}>{plan.progressionPlan}</Text>
              </BrutalBox>
            </View>
          )}

          {/* Hot takes */}
          {(plan.hotTakes ?? []).length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionLabel style={{ marginBottom: 10 }}>THE REAL TALK</SectionLabel>
              {(plan.hotTakes ?? []).map((take: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal, marginTop: 7 }} />
                  <Text style={[s.hotTake, { color: colors.foreground }]}>{take}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Pressable
                onPress={() => setShowCitations(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SectionLabel>THE STUDIES BEHIND THIS PLAN</SectionLabel>
                <Feather name={showCitations ? 'chevron-up' : 'chevron-down'} size={12} color={colors.mutedForeground} style={{ marginBottom: 10 }} />
              </Pressable>
              {showCitations && (
                <>
                  <Text style={[s.citationsIntro, { color: colors.mutedForeground }]}>
                    no bro science. every major decision in this programme is cited.
                  </Text>
                  {citations.map((c: any, i: number) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        setEvidenceModal({ id: `plan_cit_${i}`, claim: c.claim ?? 'Evidence', shortExplanation: c.claim ?? '', detailedExplanation: c.claim ?? '', confidence: 'high', category: 'training', citations: [{ title: c.claim ?? c.journal ?? '', authors: `${c.authors ?? ''} (${c.year ?? ''})`, year: c.year ?? 0, journal: c.journal ?? '', doi: c.doi }] });
                        setEvidenceVisible(true);
                      }}
                      style={[s.citationCard, { borderColor: withAlpha(colors.foreground, 0.25), backgroundColor: colors.card }]}>
                      <Text style={[s.citationClaim, { color: colors.foreground }]}>{c.claim}</Text>
                      <Text style={[s.citationAuthors, { color: colors.violet }]}>{c.authors} ({c.year})</Text>
                      <Text style={[s.citationJournal, { color: colors.mutedForeground }]}>{c.journal}</Text>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          )}

          <BrutalButton label="change my inputs" variant="secondary" height={44} style={{ marginBottom: 40 }} onPress={onReset} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  planTitle:         { fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.5, lineHeight: 34 },
  goalChip:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BRUTAL.radius, borderWidth: 1 },
  goalChipText:      { fontFamily: F.monoSemi, fontSize: 11 },
  metaChip:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BRUTAL.radius, borderWidth: 1 },
  metaChipText:      { fontFamily: F.mono, fontSize: 11 },
  rationale:         { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 20 },

  sessionName:       { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic', letterSpacing: -0.3, lineHeight: 24 },
  sessionGoal:       { fontFamily: F.bodyReg, fontSize: 12, marginTop: 3, lineHeight: 17 },
  selectionRationale:{ fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  muscleName:        { fontFamily: F.mono, fontSize: 10 },
  statNum:           { fontFamily: F.monoSemi, fontSize: 13 },
  statUnit:          { fontFamily: F.mono, fontSize: 11 },

  exerciseOrder:     { fontFamily: F.monoSemi, fontSize: 11, width: 20, textAlign: 'right' },
  exerciseName:      { fontFamily: F.bodySemi, fontSize: 14 },
  exerciseMeta:      { fontFamily: F.mono, fontSize: 10 },
  badge:             { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.3 },
  prescription:      { fontFamily: F.monoSemi, fontSize: 14 },
  prescriptionMeta:  { fontFamily: F.mono, fontSize: 10 },
  cue:               { fontFamily: F.bodyReg, fontSize: 12, fontStyle: 'italic', lineHeight: 18, borderLeftWidth: 2, paddingLeft: 8, marginBottom: 6 },
  modification:      { fontFamily: F.bodyMed, fontSize: 12, marginBottom: 4 },
  alts:              { fontFamily: F.bodyReg, fontSize: 12 },

  cardioBlock:       { borderTopWidth: 1, borderWidth: 1, borderRadius: BRUTAL.radius, padding: 12, marginVertical: 10 },
  cardioLabel:       { fontFamily: F.bodySemi, fontSize: 13 },
  cardioMeta:        { fontFamily: F.mono, fontSize: 11 },
  whyLink:           { fontFamily: F.bodySemi, fontSize: 11 },

  cardioProgramTitle:{ fontFamily: F.bodySemi, fontSize: 15 },
  cardioProgramSub:  { fontFamily: F.mono, fontSize: 11, marginTop: 2 },
  cardioProgramRationale: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 20 },
  cardioBadge:       { borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 3 },
  cardioBadgeText:   { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5 },
  cardioSessionRow:  { borderWidth: 1, borderRadius: BRUTAL.radius, padding: 12 },
  cardioDay:         { fontFamily: F.bodySemi, fontSize: 13 },
  cardioZone:        { fontFamily: F.monoSemi, fontSize: 12, marginTop: 4 },
  cardioDuration:    { fontFamily: F.mono, fontSize: 11, marginTop: 2 },
  placementTag:      { borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 6, paddingVertical: 2 },
  placementTagText:  { fontFamily: F.mono, fontSize: 10 },

  volumeMuscle:      { fontFamily: F.bodySemi, fontSize: 13, flex: 1, textTransform: 'capitalize' },
  volumeSets:        { fontFamily: F.monoSemi, fontSize: 13, marginRight: 12 },
  volumeFreq:        { fontFamily: F.mono, fontSize: 11 },

  rationaleText:     { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 21 },
  hotTake:           { fontFamily: F.bodyReg, fontSize: 14, flex: 1, lineHeight: 22 },
  citationsIntro:    { fontFamily: F.bodyReg, fontSize: 13, marginBottom: 12 },
  citationCard:      { borderWidth: 1, borderRadius: BRUTAL.radius, padding: 12, marginBottom: 8 },
  citationClaim:     { fontFamily: F.bodySemi, fontSize: 13, marginBottom: 3 },
  citationAuthors:   { fontFamily: F.bodyMed, fontSize: 12 },
  citationJournal:   { fontFamily: F.bodyReg, fontSize: 11, marginTop: 1 },
});
