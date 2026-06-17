import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { BrutalBox } from "@/components/brutal";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { EvidenceCard } from "@/types";
import { EVIDENCE_CARDS } from "@/data/evidence";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#00C2A8",
  moderate: "#FF7A1A",
  emerging: "#2B3AFF",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "strong evidence",
  moderate: "moderate evidence",
  emerging: "emerging research",
};

interface Props {
  card: EvidenceCard | null;
  visible: boolean;
  onClose: () => void;
  onSelectRelated?: (card: EvidenceCard) => void;
}

function openStudy(doi?: string, title?: string) {
  if (doi) {
    Linking.openURL(`https://doi.org/${doi}`).catch(() => {
      if (title) Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`);
    });
  } else if (title) {
    Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`);
  }
}

export function EvidenceModal({ card, visible, onClose, onSelectRelated }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!card) return null;

  const confColor = CONFIDENCE_COLOR[card.confidence] ?? colors.primary;
  const confLabel = CONFIDENCE_LABEL[card.confidence] ?? card.confidence;

  const relatedCards = card.relatedIds
    ? card.relatedIds.flatMap(id => {
        const found = EVIDENCE_CARDS.find(c => c.id === id);
        return found ? [found] : [];
      })
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={s.backdrop} onPress={onClose} />

      <View
        style={[
          s.sheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.foreground,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={[s.handle, { backgroundColor: colors.foreground }]} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.foreground }]}>
          <View style={[s.confBadge, { backgroundColor: confColor, borderColor: colors.foreground }]}>
            <View style={[s.confDot, { backgroundColor: colors.background }]} />
            <Text style={[s.confLabel, { color: colors.background }]}>{confLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={[s.closeBtn, { borderColor: colors.foreground }]}>
            <Feather name="x" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.content, { paddingBottom: 40 }]}
        >
          {/* Category chip */}
          <View style={[s.catChip, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
            <Text style={[s.catTxt, { color: colors.mutedForeground }]}>{card.category.replace(/_/g, " ")}</Text>
          </View>

          {/* Claim */}
          <Text style={[s.claim, { color: colors.foreground }]}>{card.claim}</Text>

          {/* TL;DR box */}
          <BrutalBox style={s.tldr} offset={4} background={colors.highlight}>
            <Text style={[s.tldrLabel, { color: "#111111" }]}>TL;DR</Text>
            <Text style={[s.tldrText, { color: "#111111" }]}>{card.shortExplanation}</Text>
          </BrutalBox>

          {/* Deep dive */}
          <Text style={[s.sectionHead, { color: colors.foreground }]}>the full picture</Text>
          <Text style={[s.body, { color: colors.mutedForeground }]}>{card.detailedExplanation}</Text>

          {/* Citations */}
          {card.citations.length > 0 && (
            <>
              <Text style={[s.sectionHead, { color: colors.foreground }]}>
                {card.citations.length === 1 ? "the study" : "the studies"}
              </Text>
              {card.citations.map((cit, i) => {
                const hasLink = !!(cit.doi || cit.title);
                return (
                  <Pressable
                    key={i}
                    onPress={() => hasLink ? openStudy(cit.doi, cit.title) : undefined}
                    style={({ pressed }) => [pressed && hasLink && { opacity: 0.8 }]}
                  >
                    <BrutalBox style={s.citCard} offset={hasLink ? 4 : 0}>
                      <Text style={[s.citTitle, { color: colors.foreground }]} numberOfLines={3}>
                        {cit.title}
                      </Text>
                      <Text style={[s.citMeta, { color: colors.mutedForeground }]}>
                        {cit.authors} · {cit.journal} · {cit.year}
                      </Text>
                      {hasLink && (
                        <View style={s.linkRow}>
                          <View style={[s.linkBadge, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                            <Feather name="external-link" size={10} color={colors.primaryForeground} />
                            <Text style={[s.linkTxt, { color: colors.primaryForeground }]}>
                              {cit.doi ? "open study" : "search pubmed"}
                            </Text>
                          </View>
                          {cit.doi && (
                            <Text style={[s.doiTxt, { color: colors.mutedForeground }]} numberOfLines={1}>
                              doi.org/{cit.doi}
                            </Text>
                          )}
                        </View>
                      )}
                    </BrutalBox>
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Related cards */}
          {relatedCards.length > 0 && onSelectRelated && (
            <>
              <Text style={[s.sectionHead, { color: colors.foreground }]}>related cards</Text>
              {relatedCards.map(related => (
                <TouchableOpacity
                  key={related.id}
                  onPress={() => onSelectRelated(related)}
                  activeOpacity={0.8}
                >
                  <BrutalBox style={s.relatedCard} offset={3}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.catTxt, { color: colors.mutedForeground, marginBottom: 4 }]}>
                        {related.category.replace(/_/g, " ")}
                      </Text>
                      <Text style={[s.relatedClaim, { color: colors.foreground }]} numberOfLines={2}>
                        {related.claim}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </BrutalBox>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Disclaimer */}
          <View style={[s.disclaimer, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
            <Feather name="info" size={13} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            <Text style={[s.disclaimerTxt, { color: colors.mutedForeground }]}>
              for education only. not medical advice. talk to a qualified professional before major dietary changes.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "92%",
    borderTopWidth: BRUTAL.border,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  handle: {
    width: 44,
    height: 5,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: BRUTAL.border,
  },
  confBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BRUTAL.radius,
    borderWidth: 2,
  },
  confDot: { width: 6, height: 6, borderRadius: 3 },
  confLabel: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 18 },
  catChip: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  catTxt: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.8 },
  claim: {
    fontFamily: F.displayBold,
    fontSize: 26,
    fontStyle: "italic",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  tldr: { padding: 16, gap: 6 },
  tldrLabel: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1 },
  tldrText: { fontFamily: F.bodyMed, fontSize: 14, lineHeight: 21 },
  sectionHead: {
    fontFamily: F.monoSemi,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: -6,
  },
  body: { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 22 },
  citCard: { padding: 14, gap: 6 },
  citTitle: { fontFamily: F.bodySemi, fontSize: 13, lineHeight: 19 },
  citMeta: { fontFamily: F.bodyReg, fontSize: 12 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  linkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkTxt: { fontFamily: F.bodyBold, fontSize: 11 },
  doiTxt: { fontFamily: F.mono, fontSize: 10, flex: 1 },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    padding: 12,
  },
  disclaimerTxt: {
    fontFamily: F.bodyReg,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  relatedCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  relatedClaim: {
    fontFamily: F.bodySemi,
    fontSize: 13,
    lineHeight: 18,
  },
});
