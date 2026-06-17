import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox } from '@/components/brutal';
import { EvidenceModal } from '@/components/EvidenceModal';
import { useProfile } from '@/stores/profile-store';
import { useHydrationStore } from '@/stores/hydration-store';
import { getTodayKey, useTrackerStore } from '@/stores/tracker-store';
import { computeElectrolyteTargets } from '@/lib/hydration-engine';
import { EVIDENCE_CARDS, getEvidenceById } from '@/data/evidence';
import type { EvidenceCard } from '@/types';

// Electrolyte presets for quick-add (name, icon-key, amounts in mg)
const ELECTROLYTE_PRESETS: Array<{
  label: string;
  icon: keyof typeof Feather.glyphMap;
  sodium: number;
  potassium: number;
  magnesium: number;
}> = [
  { label: 'electrolyte drink', icon: 'droplet', sodium: 500, potassium: 200, magnesium: 50 },
  { label: 'salt pinch', icon: 'minus-circle', sodium: 200, potassium: 0, magnesium: 0 },
  { label: 'banana', icon: 'feather', sodium: 1, potassium: 450, magnesium: 32 },
  { label: 'coconut water (250ml)', icon: 'coffee', sodium: 45, potassium: 600, magnesium: 30 },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

const HYDRATION_CARD_IDS = [
  'hydration_water_need',
  'hydration_electrolytes',
  'hydration_potassium',
  'hydration_magnesium',
];

interface ElectroBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  isCeiling?: boolean;
  onPress: () => void;
}

function ElectroBar({ label, current, unit, target, color, isCeiling, onPress }: ElectroBarProps) {
  const colors = useColors();
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const over = isCeiling && current > target;
  const barColor = over ? colors.persimmon : color;
  const displayCurrent = Math.round(current);
  const displayTarget = Math.round(target);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.electroRow, pressed && { opacity: 0.8 }]}>
      <View style={s.electroLabelRow}>
        <Text style={[s.electroLabel, { color: colors.foreground }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isCeiling && <Text style={[s.electroKind, { color: colors.mutedForeground }]}>ceiling</Text>}
          <Text style={[s.electroAmount, { color: over ? colors.persimmon : colors.foreground }]}>
            {displayCurrent}
            <Text style={[s.electroTarget, { color: colors.mutedForeground }]}>/{displayTarget}{unit}</Text>
          </Text>
          <Feather name="info" size={12} color={colors.mutedForeground} />
        </View>
      </View>
      <View style={[s.electroBarBg, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
        <View style={[s.electroBarFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
    </Pressable>
  );
}

interface AddElectrolytesSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (sodium: number, potassium: number, magnesium: number) => void;
  colors: ReturnType<typeof useColors>;
}

function AddElectrolytesSheet({ visible, onClose, onAdd, colors }: AddElectrolytesSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
        <View style={[s.sheetHandle, { backgroundColor: colors.foreground }]} />
        <Text style={[s.sheetTitle, { color: colors.foreground }]}>add electrolytes</Text>
        <Text style={[s.sheetSub, { color: colors.mutedForeground }]}>
          sourced from food? tracked automatically from meals. add manual sources here.
        </Text>
        <View style={s.presetList}>
          {ELECTROLYTE_PRESETS.map(preset => (
            <Pressable
              key={preset.label}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAdd(preset.sodium, preset.potassium, preset.magnesium);
                onClose();
              }}
              style={({ pressed }) => [
                s.presetRow,
                {
                  borderColor: colors.foreground,
                  backgroundColor: pressed ? colors.muted : colors.card,
                },
              ]}
            >
              <View style={[s.presetIcon, { backgroundColor: colors.teal + '33', borderColor: colors.foreground }]}>
                <Feather name={preset.icon} size={14} color={colors.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.presetLabel, { color: colors.foreground }]}>{preset.label}</Text>
                <Text style={[s.presetMeta, { color: colors.mutedForeground }]}>
                  Na {preset.sodium} - K {preset.potassium} - Mg {preset.magnesium} mg
                </Text>
              </View>
              <Feather name="plus" size={16} color={colors.teal} />
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// Stable reference for the "nothing logged yet" case so the Zustand selector
// below doesn't return a fresh object every render (which triggers an infinite
// "getSnapshot should be cached" re-render loop).
const EMPTY_ELECTROLYTES = { sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0 } as const;

export function HydrationPanel() {
  const colors = useColors();
  const { profile } = useProfile();
  const { settings, addElectrolytes } = useHydrationStore();
  const todayKey = getTodayKey();
  const manualElectrolytes = useHydrationStore(s => s.electrolyteLogs[todayKey] ?? EMPTY_ELECTROLYTES);
  const foodMicros = useTrackerStore(s => s.dailyLogs[todayKey]?.micros ?? null);

  const [activeEvidence, setActiveEvidence] = useState<EvidenceCard | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const targets = useMemo(() => {
    if (!profile) return { sodiumMg: 1500, potassiumMg: 3400, magnesiumMg: 410 };
    return computeElectrolyteTargets(profile);
  }, [profile]);

  const totalElectrolytes = useMemo(() => ({
    sodiumMg: (foodMicros?.sodium ?? 0) + manualElectrolytes.sodiumMg,
    potassiumMg: (foodMicros?.potassium ?? 0) + manualElectrolytes.potassiumMg,
    magnesiumMg: (foodMicros?.magnesium ?? 0) + manualElectrolytes.magnesiumMg,
  }), [foodMicros, manualElectrolytes]);

  // Rotating hydration science pick
  const hydrationCards = useMemo(() => {
    return HYDRATION_CARD_IDS.map(id => getEvidenceById(id)).filter((c): c is EvidenceCard => c !== null);
  }, []);
  const scienceCard = hydrationCards.length > 0
    ? hydrationCards[getDayOfYear() % hydrationCards.length]
    : EVIDENCE_CARDS.find(c => c.category === 'hydration') ?? null;

  const openEvidence = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const card = getEvidenceById(id);
    if (card) setActiveEvidence(card);
  };

  return (
    <>
      <BrutalBox style={s.panel} offset={4}>
        {/* Electrolytes section */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>electrolytes</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setShowAddSheet(true);
            }}
            style={[s.addBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}
          >
            <Feather name="plus" size={12} color={colors.primaryForeground} />
            <Text style={[s.addBtnTxt, { color: colors.primaryForeground }]}>add</Text>
          </Pressable>
        </View>

        <Text style={[s.electroSub, { color: colors.mutedForeground }]}>
          from meals + manual. tap any row to see the science.
        </Text>

        <View style={s.electroBars}>
          <ElectroBar
            label="sodium"
            current={totalElectrolytes.sodiumMg}
            target={2300}
            unit="mg"
            color={colors.orange}
            isCeiling
            onPress={() => openEvidence('hydration_electrolytes')}
          />
          <ElectroBar
            label="potassium"
            current={totalElectrolytes.potassiumMg}
            target={targets.potassiumMg}
            unit="mg"
            color={colors.blue}
            onPress={() => openEvidence('hydration_potassium')}
          />
          <ElectroBar
            label="magnesium"
            current={totalElectrolytes.magnesiumMg}
            target={targets.magnesiumMg}
            unit="mg"
            color={colors.violet}
            onPress={() => openEvidence('hydration_magnesium')}
          />
        </View>

        {/* Hydration science pick */}
        {scienceCard && (
          <>
            <View style={[s.divider, { backgroundColor: colors.foreground }]} />
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setActiveEvidence(scienceCard);
              }}
            >
              <View style={s.scienceRow}>
                <View style={[s.scienceIcon, { backgroundColor: colors.teal + '33', borderColor: colors.foreground }]}>
                  <Feather name="book-open" size={14} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.scienceTopRow}>
                    <View style={[s.confChip, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
                      <Text style={s.confChipTxt}>{scienceCard.confidence.toUpperCase()}</Text>
                    </View>
                    <Text style={[s.scienceCat, { color: colors.mutedForeground }]}>hydration science</Text>
                  </View>
                  <Text style={[s.scienceClaim, { color: colors.foreground }]} numberOfLines={2}>
                    {scienceCard.claim}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </Pressable>
          </>
        )}

        {/* Reminder toggle */}
        <View style={[s.divider, { backgroundColor: colors.foreground }]} />
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            const newEnabled = !settings.remindersEnabled;
            useHydrationStore.getState().updateSettings({ remindersEnabled: newEnabled });
            if (newEnabled) {
              import('@/lib/hydration-notifications').then(({ scheduleWaterReminders }) => {
                scheduleWaterReminders(settings).then(entries => {
                  useHydrationStore.getState().setReminderEntries(entries);
                }).catch(() => {});
              });
            } else {
              import('@/lib/hydration-notifications').then(({ cancelWaterReminders }) => {
                const entries = useHydrationStore.getState().reminderEntries;
                cancelWaterReminders(entries).then(() => {
                  useHydrationStore.getState().setReminderEntries([]);
                }).catch(() => {});
              });
            }
          }}
          style={s.reminderRow}
        >
          <View style={[s.toggleIcon, {
            backgroundColor: settings.remindersEnabled ? colors.primary : colors.muted,
            borderColor: colors.foreground,
          }]}>
            <Feather name="bell" size={14} color={settings.remindersEnabled ? colors.primaryForeground : colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.reminderTitle, { color: colors.foreground }]}>water reminders</Text>
            <Text style={[s.reminderSub, { color: colors.mutedForeground }]}>
              {settings.remindersEnabled
                ? `${6} reminders scheduled - cancelled when you hit your target`
                : 'get nudged across your waking hours'}
            </Text>
          </View>
          <View style={[s.togglePill, {
            backgroundColor: settings.remindersEnabled ? colors.primary : colors.muted,
            borderColor: colors.foreground,
          }]}>
            <Text style={[s.toggleTxt, { color: settings.remindersEnabled ? colors.primaryForeground : colors.mutedForeground }]}>
              {settings.remindersEnabled ? 'on' : 'off'}
            </Text>
          </View>
        </Pressable>
      </BrutalBox>

      <AddElectrolytesSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={(sodium, potassium, magnesium) => {
          addElectrolytes(todayKey, { sodiumMg: sodium, potassiumMg: potassium, magnesiumMg: magnesium });
        }}
        colors={colors}
      />

      <EvidenceModal
        card={activeEvidence}
        visible={activeEvidence !== null}
        onClose={() => setActiveEvidence(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  panel: { padding: 16, marginHorizontal: 20, gap: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: F.displayBold, fontSize: 18, fontStyle: 'italic', letterSpacing: -0.3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BRUTAL.radiusPill },
  addBtnTxt: { fontFamily: F.bodyBold, fontSize: 12 },

  electroSub: { fontFamily: F.bodyReg, fontSize: 12, marginTop: -4 },
  electroBars: { gap: 12 },

  electroRow: { gap: 6 },
  electroLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  electroLabel: { fontFamily: F.bodySemi, fontSize: 13 },
  electroKind: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.5 },
  electroAmount: { fontFamily: F.monoSemi, fontSize: 13 },
  electroTarget: { fontFamily: F.mono, fontSize: 11 },
  electroBarBg: { height: 8, borderRadius: 2, borderWidth: 1.5, overflow: 'hidden' },
  electroBarFill: { height: '100%' },

  divider: { height: 1, marginHorizontal: -16, opacity: 0.15 },

  scienceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scienceIcon: { width: 34, height: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderRadius: BRUTAL.radius, flexShrink: 0 },
  scienceTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  confChip: { borderWidth: 1.5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BRUTAL.radius },
  confChipTxt: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.5, color: '#111111' },
  scienceCat: { fontFamily: F.bodyMed, fontSize: 11 },
  scienceClaim: { fontFamily: F.bodyBold, fontSize: 13, lineHeight: 18, flex: 1 },

  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleIcon: { width: 34, height: 34, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderRadius: BRUTAL.radius, flexShrink: 0 },
  reminderTitle: { fontFamily: F.bodySemi, fontSize: 13 },
  reminderSub: { fontFamily: F.bodyReg, fontSize: 11, lineHeight: 16 },
  togglePill: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BRUTAL.radiusPill },
  toggleTxt: { fontFamily: F.bodyBold, fontSize: 11 },

  // Bottom sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: BRUTAL.border, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20, gap: 14,
  },
  sheetHandle: { width: 44, height: 5, alignSelf: 'center', marginBottom: 4, borderRadius: 0 },
  sheetTitle: { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic', letterSpacing: -0.5 },
  sheetSub: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19, marginTop: -6 },
  presetList: { gap: 10 },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: BRUTAL.radius, padding: 12 },
  presetIcon: { width: 32, height: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderRadius: BRUTAL.radius },
  presetLabel: { fontFamily: F.bodySemi, fontSize: 13 },
  presetMeta: { fontFamily: F.mono, fontSize: 11, marginTop: 2 },
});
