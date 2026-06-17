/**
 * SwapSheet — bottom-sheet modal for swapping an exercise mid-workout.
 * Preserves all existing swap logic; new brand styling.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { BrutalBox, BrutalButton } from '@/components/brutal';

export interface SwapOption {
  name: string;
  equipment: string;
  category: string;
  cue: string;
  isSamePattern?: boolean;
}

interface Props {
  visible: boolean;
  options: SwapOption[];
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  bottomPad: number;
  onSwap: (name: string) => void;
  onClose: () => void;
}

export default function SwapSheet({
  visible, options, exerciseName, completedSets, totalSets, bottomPad, onSwap, onClose,
}: Props) {
  const colors = useColors();
  const hasPartialSets = completedSets > 0;
  const [query, setQuery] = useState('');

  const filteredOptions = query.trim()
    ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: withAlpha(colors.foreground, 0.4) }]} onPress={onClose} />
      <View style={[s.sheet, {
        backgroundColor: colors.background,
        borderTopColor: colors.foreground,
        paddingBottom: bottomPad + 24,
      }]}>
        {/* Handle bar */}
        <View style={[s.handle, { backgroundColor: withAlpha(colors.foreground, 0.2) }]} />

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.title, { color: colors.foreground }]}>swap exercise</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{exerciseName}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Context banner */}
        {hasPartialSets ? (
          <View style={[s.contextBanner, { backgroundColor: withAlpha(colors.orange, 0.09), borderLeftColor: colors.orange }]}>
            <Text style={[s.contextTitle, { color: colors.orange }]}>
              {completedSets}/{totalSets} sets done
            </Text>
            <Text style={[s.contextBody, { color: colors.mutedForeground }]}>
              swap continues with the remaining {totalSets - completedSets} sets. completed sets are saved.
            </Text>
          </View>
        ) : (
          <View style={[s.contextBanner, { backgroundColor: withAlpha(colors.foreground, 0.04), borderLeftColor: withAlpha(colors.foreground, 0.2) }]}>
            <Text style={[s.contextTitle, { color: colors.foreground }]}>
              gym crowded? equipment unavailable?
            </Text>
            <Text style={[s.contextBody, { color: colors.mutedForeground }]}>
              all alternatives target the same muscle group. volume stays on track.
            </Text>
          </View>
        )}

        {/* Search */}
        <View style={[s.searchRow, { borderColor: withAlpha(colors.foreground, 0.2), backgroundColor: colors.card }]}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="search exercises..."
            placeholderTextColor={colors.mutedForeground}
            style={[s.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Options */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {filteredOptions.length === 0 ? (
            <Text style={[s.empty, { color: colors.mutedForeground }]}>
              {query ? 'no exercises match your search' : 'no alternatives in the database for this muscle group'}
            </Text>
          ) : filteredOptions.map(opt => (
            <Pressable key={opt.name} onPress={() => { onSwap(opt.name); setQuery(''); }}>
              <BrutalBox style={{ padding: 14 }} offset={BRUTAL.shadowSm}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[s.optName, { color: colors.foreground }]}>{opt.name}</Text>
                      {opt.isSamePattern && (
                        <View style={[s.tag, { backgroundColor: withAlpha(colors.teal, 0.1), borderColor: withAlpha(colors.teal, 0.3) }]}>
                          <Text style={[s.tagText, { color: colors.teal }]}>same movement</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                      <View style={[s.tag, { backgroundColor: colors.muted, borderColor: withAlpha(colors.foreground, 0.1) }]}>
                        <Text style={[s.tagText, { color: colors.mutedForeground }]}>{opt.equipment}</Text>
                      </View>
                      <View style={[s.tag, {
                        backgroundColor: opt.category === 'compound' ? withAlpha(colors.violet, 0.1) : colors.muted,
                        borderColor: opt.category === 'compound' ? withAlpha(colors.violet, 0.25) : withAlpha(colors.foreground, 0.1),
                      }]}>
                        <Text style={[s.tagText, { color: opt.category === 'compound' ? colors.violet : colors.mutedForeground }]}>
                          {opt.category}
                        </Text>
                      </View>
                    </View>
                    {opt.cue ? (
                      <Text style={[s.cue, { color: colors.mutedForeground }]} numberOfLines={1}>{opt.cue}</Text>
                    ) : null}
                  </View>
                  <View style={[s.swapCTA, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                    <Text style={[s.swapCTAText, { color: colors.primaryForeground }]}>swap</Text>
                  </View>
                </View>
              </BrutalBox>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  searchRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput:   { flex: 1, fontFamily: F.bodyReg, fontSize: 14, padding: 0 },
  backdrop:      { ...StyleSheet.absoluteFillObject },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: BRUTAL.border, borderTopLeftRadius: BRUTAL.radiusLg, borderTopRightRadius: BRUTAL.radiusLg, paddingTop: 8 },
  handle:        { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  title:         { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic', letterSpacing: -0.5 },
  subtitle:      { fontFamily: F.mono, fontSize: 12, marginTop: 2 },
  contextBanner: { marginHorizontal: 20, borderLeftWidth: 3, borderRadius: BRUTAL.radius, padding: 12, marginBottom: 14 },
  contextTitle:  { fontFamily: F.bodySemi, fontSize: 13, marginBottom: 3 },
  contextBody:   { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18 },
  empty:         { fontFamily: F.bodyReg, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  optName:       { fontFamily: F.bodySemi, fontSize: 15 },
  tag:           { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:       { fontFamily: F.monoSemi, fontSize: 9, textTransform: 'uppercase' },
  cue:           { fontFamily: F.bodyReg, fontSize: 12, fontStyle: 'italic', marginTop: 5 },
  swapCTA:       { borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 7 },
  swapCTAText:   { fontFamily: F.bodySemi, fontSize: 13 },
});
