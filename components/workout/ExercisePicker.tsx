// ExercisePicker - full-screen modal: search + filter the curated DB, tap to add,
// or add a custom exercise. Used by the manual SplitBuilder (6.2).

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalButton } from '@/components/brutal';
import {
  EXERCISES, VOLUME_GROUPS, type Exercise, type VolumeGroup, type Equipment,
} from '@/data/exercises';

// MUSCLE_COLOR imported via muscleColor() from @/constants/muscles

const EQUIPMENT: Equipment[] = [
  'barbell','dumbbell','machine','cable','bodyweight','kettlebell','band','smith','ez_bar','other',
];

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

interface Props {
  visible: boolean;
  customExercises: Exercise[];
  initialMuscle?: VolumeGroup | null;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
  onAddCustom: (ex: Exercise) => void;
}

export default function ExercisePicker({
  visible, customExercises, initialMuscle, onClose, onPick, onAddCustom,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<VolumeGroup | null>(initialMuscle ?? null);
  const [equip, setEquip] = useState<Equipment | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // custom-add form
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<VolumeGroup>('chest');
  const [customEquip, setCustomEquip] = useState<Equipment>('barbell');

  const all = useMemo(() => [...EXERCISES, ...customExercises], [customExercises]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return all.filter(e => {
      if (muscle && e.primaryMuscle !== muscle) return false;
      if (equip && e.equipment !== equip) return false;
      if (q && !(e.name.toLowerCase().includes(q) || e.primaryMuscle.includes(q) || e.equipment.includes(q))) return false;
      return true;
    });
  }, [all, query, muscle, equip]);

  function handlePick(ex: Exercise) {
    onPick(ex);
    setAddedIds(prev => prev.includes(ex.id) ? prev : [...prev, ex.id]);
  }

  function reset() {
    setQuery(''); setMuscle(initialMuscle ?? null); setEquip(null);
    setAddedIds([]); setShowCustom(false);
    setCustomName(''); setCustomMuscle('chest'); setCustomEquip('barbell');
  }

  function handleClose() { reset(); onClose(); }

  function submitCustom() {
    const name = customName.trim();
    if (!name) return;
    const id = `custom_${slugify(name)}_${Date.now().toString(36)}`;
    const ex: Exercise = {
      id, name,
      primaryMuscle: customMuscle,
      secondaryMuscles: [],
      equipment: customEquip,
      category: 'isolation',
      isUnilateral: false,
      defaultReps: '8-12',
      defaultRestSec: 90,
      isCustom: true,
    };
    onAddCustom(ex);
    handlePick(ex);
    setShowCustom(false);
    setCustomName('');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex:1, backgroundColor: colors.background, paddingTop: insets.top }}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.foreground }]}>
          <Text style={[s.title, { color: colors.foreground }]}>add exercise</Text>
          <Pressable onPress={handleClose} hitSlop={12}
            style={[s.closeBtn, { borderColor: colors.foreground }]}>
            <Feather name="x" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal:16, paddingTop:12 }}>
          <View style={[s.searchBox, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="search exercises..."
              placeholderTextColor={colors.mutedForeground}
              style={[s.searchInput, { color: colors.foreground }]}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Muscle filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flexGrow:0 }}
          contentContainerStyle={{ paddingHorizontal:16, paddingVertical:10, gap:8 }}>
          <FilterChip label="all" active={!muscle} onPress={() => setMuscle(null)} colors={colors} />
          {VOLUME_GROUPS.map(m => (
            <FilterChip key={m} label={m} active={muscle === m}
              dot={muscleColor(m)} onPress={() => setMuscle(muscle === m ? null : m)} colors={colors} />
          ))}
        </ScrollView>

        {/* Equipment filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flexGrow:0 }}
          contentContainerStyle={{ paddingHorizontal:16, paddingBottom:10, gap:8 }}>
          <FilterChip label="any gear" active={!equip} onPress={() => setEquip(null)} colors={colors} />
          {EQUIPMENT.map(eq => (
            <FilterChip key={eq} label={eq.replace('_',' ')} active={equip === eq}
              onPress={() => setEquip(equip === eq ? null : eq)} colors={colors} />
          ))}
        </ScrollView>

        {/* Results */}
        <View style={{ flex:1 }}>
          <FlashList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal:16, paddingBottom: insets.bottom + 90 }}
            ListEmptyComponent={
              <View style={{ paddingVertical:40, alignItems:'center' }}>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  no match. add it as a custom exercise below.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const added = addedIds.includes(item.id);
              return (
                <Pressable onPress={() => handlePick(item)}
                  style={[s.row, { borderBottomColor: withAlpha(colors.foreground, 0.09) }]}>
                  <View style={{ width:9, height:9, borderRadius:5, backgroundColor: muscleColor(item.primaryMuscle), marginTop:4 }} />
                  <View style={{ flex:1 }}>
                    <Text style={[s.exName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[s.exMeta, { color: colors.mutedForeground }]}>
                      {item.primaryMuscle} . {item.equipment.replace('_',' ')} . {item.category}
                      {item.isCustom ? ' . custom' : ''}
                    </Text>
                  </View>
                  <View style={[s.addBtn, {
                    borderColor: added ? colors.teal : colors.foreground,
                    backgroundColor: added ? colors.teal : 'transparent',
                  }]}>
                    <Feather name={added ? 'check' : 'plus'} size={15}
                      color={added ? '#111111' : colors.foreground} />
                  </View>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Custom add */}
        {showCustom ? (
          <View style={[s.customSheet, { backgroundColor: colors.card, borderTopColor: colors.foreground, paddingBottom: insets.bottom + 14 }]}>
            <Text style={[s.customTitle, { color: colors.foreground }]}>add custom exercise</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="exercise name"
              placeholderTextColor={colors.mutedForeground}
              style={[s.customInput, { color: colors.foreground, borderColor: colors.foreground, backgroundColor: colors.background }]}
              autoFocus
            />
            <Text style={[s.customLabel, { color: colors.mutedForeground }]}>primary muscle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:4 }}>
              {VOLUME_GROUPS.map(m => (
                <FilterChip key={m} label={m} active={customMuscle === m}
                  dot={muscleColor(m)} onPress={() => setCustomMuscle(m)} colors={colors} />
              ))}
            </ScrollView>
            <Text style={[s.customLabel, { color: colors.mutedForeground }]}>equipment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:4 }}>
              {EQUIPMENT.map(eq => (
                <FilterChip key={eq} label={eq.replace('_',' ')} active={customEquip === eq}
                  onPress={() => setCustomEquip(eq)} colors={colors} />
              ))}
            </ScrollView>
            <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
              <BrutalButton label="cancel" variant="secondary" height={46} style={{ flex:1 }}
                onPress={() => setShowCustom(false)} />
              <BrutalButton label="add it" variant="primary" height={46} style={{ flex:1 }}
                disabled={!customName.trim()} onPress={submitCustom} />
            </View>
          </View>
        ) : (
          <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: withAlpha(colors.foreground, 0.13) }]}>
            <View style={{ flexDirection:'row', gap:10 }}>
              <BrutalButton label="+ custom" variant="secondary" height={50} style={{ flex:1 }}
                onPress={() => setShowCustom(true)} />
              <BrutalButton label={addedIds.length > 0 ? `done (${addedIds.length})` : 'done'}
                variant="primary" height={50} style={{ flex:1 }} onPress={handleClose} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// -- Filter chip ---------------------------------------------------------------
function FilterChip({ label, active, dot, onPress, colors }: {
  label: string; active: boolean; dot?: string; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable onPress={onPress}
      style={[s.filterChip, {
        borderColor: colors.foreground,
        backgroundColor: active ? colors.foreground : colors.card,
      }]}>
      {dot && <View style={{ width:7, height:7, borderRadius:4, backgroundColor: dot, marginRight:5 }} />}
      <Text style={[s.filterChipText, { color: active ? colors.background : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:BRUTAL.border },
  title:        { fontFamily:F.displayBold, fontSize:24, letterSpacing:-0.5 },
  closeBtn:     { width:32, height:32, borderWidth:2, borderRadius:BRUTAL.radius, alignItems:'center', justifyContent:'center' },

  searchBox:    { flexDirection:'row', alignItems:'center', gap:8, borderWidth:BRUTAL.border, borderRadius:BRUTAL.radius, paddingHorizontal:12, height:48 },
  searchInput:  { flex:1, fontFamily:F.bodyMed, fontSize:15, padding:0 },

  filterChip:     { flexDirection:'row', alignItems:'center', borderWidth:2, borderRadius:BRUTAL.radius, paddingHorizontal:11, paddingVertical:6 },
  filterChipText: { fontFamily:F.monoSemi, fontSize:11, letterSpacing:0.3 },

  row:          { flexDirection:'row', alignItems:'flex-start', gap:11, paddingVertical:12, borderBottomWidth:1 },
  exName:       { fontFamily:F.bodySemi, fontSize:14 },
  exMeta:       { fontFamily:F.bodyReg, fontSize:12, marginTop:2 },
  addBtn:       { width:30, height:30, borderWidth:2, borderRadius:BRUTAL.radius, alignItems:'center', justifyContent:'center' },

  emptyText:    { fontFamily:F.bodyReg, fontSize:14, textAlign:'center' },

  footer:       { paddingHorizontal:16, paddingTop:12, borderTopWidth:1 },

  customSheet:  { paddingHorizontal:16, paddingTop:16, borderTopWidth:BRUTAL.border },
  customTitle:  { fontFamily:F.bodyBold, fontSize:16, marginBottom:12 },
  customInput:  { borderWidth:BRUTAL.border, borderRadius:BRUTAL.radius, paddingHorizontal:14, height:50, fontFamily:F.bodyMed, fontSize:15, marginBottom:12 },
  customLabel:  { fontFamily:F.monoSemi, fontSize:10, letterSpacing:1, marginTop:8, marginBottom:4 },
});
