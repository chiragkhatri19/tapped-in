import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EvidenceModal } from "@/components/EvidenceModal";
import { HeaderMenuButton } from "@/components/navigation/HeaderMenuButton";
import { EVIDENCE_CARDS } from "@/data/evidence";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalChip, BrutalBox } from "@/components/brutal";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { EvidenceCard } from "@/types";

const CATEGORY_LABELS: Record<EvidenceCard["category"], string> = {
  calorie_estimation: "calorie science", protein: "protein", fat: "fat", carbs: "carbs",
  neat: "neat & activity", deficit: "deficit", surplus: "surplus", fiber: "fiber",
  hydration: "hydration", training: "training", micronutrients: "micronutrients",
  supplements: "supplements", sleep: "sleep", recovery: "recovery", body_composition: "body comp",
};
const CATEGORY_ICONS: Record<EvidenceCard["category"], React.ComponentProps<typeof Feather>["name"]> = {
  calorie_estimation: "cpu", protein: "trending-up", fat: "droplet", carbs: "zap",
  neat: "activity", deficit: "arrow-down", surplus: "arrow-up", fiber: "layers",
  hydration: "droplet", training: "bar-chart-2", micronutrients: "target",
  supplements: "plus-circle", sleep: "moon", recovery: "refresh-cw", body_composition: "pie-chart",
};

function loadBookmarks(): string[] {
  try {
    const raw = storage.getString(STORAGE_KEYS.EVIDENCE_BOOKMARKS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveBookmarks(ids: string[]) {
  storage.set(STORAGE_KEYS.EVIDENCE_BOOKMARKS, JSON.stringify(ids));
}

export default function EvidenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCard, setActiveCard] = useState<EvidenceCard | null>(null);
  const [activeCategory, setActiveCategory] = useState<EvidenceCard["category"] | "all" | "bookmarked">("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);

  const categories = useMemo(() => Array.from(new Set(EVIDENCE_CARDS.map((c) => c.category))), []);

  const filtered = useMemo(() => {
    let list = EVIDENCE_CARDS;
    if (activeCategory === "bookmarked") list = list.filter(c => bookmarks.includes(c.id));
    else if (activeCategory !== "all") list = list.filter(c => c.category === activeCategory);
    if (query.trim().length > 1) {
      const q = query.toLowerCase();
      list = list.filter(c =>
        c.claim.toLowerCase().includes(q) ||
        c.shortExplanation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, query, bookmarks]);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  const confLabel = (c: EvidenceCard["confidence"]) =>
    c === "high" ? "strong" : c === "moderate" ? "moderate" : "emerging";

  function toggleBookmark(id: string) {
    Haptics.selectionAsync();
    const next = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(next);
    saveBookmarks(next);
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[s.content, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title row with menu */}
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.foreground }]}>science library.</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
              every rec in tapped in is backed by peer-reviewed research. no broscience.
            </Text>
          </View>
          <HeaderMenuButton />
        </View>

        {/* Search bar */}
        <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="search claims…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Category filter rail */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          <BrutalChip label="all" selected={activeCategory === "all"}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory("all"); }} />
          <BrutalChip
            label={`saved (${bookmarks.length})`}
            selected={activeCategory === "bookmarked"}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory("bookmarked"); }}
          />
          {categories.map((cat) => (
            <BrutalChip key={cat} label={CATEGORY_LABELS[cat]} selected={activeCategory === cat}
              onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }} />
          ))}
        </ScrollView>

        {/* Empty state */}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Feather name="search" size={28} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              {activeCategory === "bookmarked" ? "no saved cards yet. tap the bookmark icon on any card." : "no cards match your search."}
            </Text>
          </View>
        )}

        {filtered.map((card) => {
          const isBookmarked = bookmarks.includes(card.id);
          return (
            <Pressable key={card.id} onPress={() => { Haptics.selectionAsync(); setActiveCard(card); }}>
              <BrutalBox style={s.card} offset={4}>
                <View style={s.cardHeader}>
                  <View style={[s.catTag, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
                    <Feather name={CATEGORY_ICONS[card.category]} size={11} color="#111111" />
                    <Text style={[s.catText, { color: "#111111" }]}>{CATEGORY_LABELS[card.category]}</Text>
                  </View>
                  <View style={s.cardHeaderRight}>
                    <View style={[s.confBadge, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
                      <Text style={[s.confText, { color: colors.foreground }]}>{confLabel(card.confidence)}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); toggleBookmark(card.id); }}
                      hitSlop={10}
                      style={[s.bookmarkBtn, { backgroundColor: colors.card, borderColor: colors.foreground }]}
                    >
                      <Feather
                        name={isBookmarked ? "bookmark" : "bookmark"}
                        size={13}
                        color={isBookmarked ? colors.primary : colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>
                <Text style={[s.claim, { color: colors.foreground }]}>{card.claim}</Text>
                <Text style={[s.summary, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {card.shortExplanation}
                </Text>
                <View style={s.cardFooter}>
                  <Text style={[s.citCount, { color: colors.mutedForeground }]}>
                    {card.citations.length} reference{card.citations.length !== 1 ? "s" : ""}
                  </Text>
                  <View style={s.readMore}>
                    <Text style={[s.readMoreText, { color: colors.teal }]}>tap to read</Text>
                    <Feather name="arrow-right" size={13} color={colors.teal} />
                  </View>
                </View>
              </BrutalBox>
            </Pressable>
          );
        })}
      </ScrollView>

      <EvidenceModal
        card={activeCard}
        visible={activeCard !== null}
        onClose={() => setActiveCard(null)}
        onSelectRelated={(related) => { Haptics.selectionAsync(); setActiveCard(related); }}
      />
    </>
  );
}

const s = StyleSheet.create({
  content:      { paddingHorizontal: 20, gap: 14 },
  titleRow:     { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title:        { fontFamily: F.displayBold, fontSize: 30, fontStyle: "italic", letterSpacing: -1 },
  subtitle:     { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 20, marginTop: -4 },
  searchWrap:   { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput:  { flex: 1, fontFamily: F.bodyReg, fontSize: 15, padding: 0 },
  filterRow:    { flexDirection: "row", gap: 10, paddingBottom: 6, paddingRight: 8 },
  empty:        { alignItems: "center", gap: 12, paddingVertical: 48 },
  emptyText:    { fontFamily: F.bodyReg, fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 260 },
  card:         { padding: 16, gap: 10 },
  cardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catTag:       { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BRUTAL.radius },
  catText:      { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.3 },
  confBadge:    { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BRUTAL.radius },
  confText:     { fontFamily: F.monoSemi, fontSize: 10 },
  bookmarkBtn:  { borderWidth: 2, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: BRUTAL.radius },
  claim:        { fontFamily: F.bodyBold, fontSize: 16, lineHeight: 22 },
  summary:      { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 20 },
  cardFooter:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  citCount:     { fontFamily: F.mono, fontSize: 11 },
  readMore:     { flexDirection: "row", alignItems: "center", gap: 4 },
  readMoreText: { fontFamily: F.bodyBold, fontSize: 13 },
});
