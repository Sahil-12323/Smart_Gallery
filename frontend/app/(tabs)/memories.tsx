import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { api, Photo, photoUri, EmotionTimeline, emotionEmoji } from "../../src/api";
import { theme, radii, spacing, EMOTION_COLORS } from "../../src/theme";

const { width: W } = Dimensions.get("window");
const BAR_MAX_H = 80;

export default function MemoriesScreen() {
  const router = useRouter();
  const [date, setDate]             = useState("");
  const [photos, setPhotos]         = useState<Photo[]>([]);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [monthCount, setMonthCount] = useState(0);
  const [timeline, setTimeline]     = useState<EmotionTimeline | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, tl] = await Promise.all([api.onThisDay(), api.emotionTimeline(90)]);
      setDate(r.date); setPhotos(r.photos);
      setPrediction(r.prediction); setMonthCount(r.month_count);
      setTimeline(tl);
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getYear = (taken: string) => { try { return new Date(taken).getFullYear(); } catch { return "—"; } };
  const currentYear = new Date().getFullYear();

  // Emotion distribution for ring chart
  const dist = timeline?.distribution || {};
  const total = Object.values(dist).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="memories-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl tintColor={theme.primary} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MEMORY REWIND</Text>
          <Text style={styles.title}>On this day</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Prediction */}
        {prediction && (
          <View style={styles.predictionCard} testID="memories-prediction">
            <LinearGradient colors={["rgba(138,154,255,0.15)","rgba(106,122,255,0.05)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.predIconWrap}>
              <Ionicons name="telescope" size={18} color="#8A9AFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.predTitle}>AI PREDICTION</Text>
              <Text style={styles.predBody}>{prediction}</Text>
              {monthCount > 0 && <Text style={styles.predSub}>{monthCount} photos this month in past years</Text>}
            </View>
          </View>
        )}

        {/* Emotion Timeline Chart */}
        {timeline && timeline.timeline.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emotion Timeline</Text>
              <Text style={styles.sectionSub}>Last 90 days</Text>
            </View>
            <View style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 8 }}>
                <View style={styles.chart}>
                  {timeline.timeline.map((pt, i) => {
                    const h = Math.max(8, Math.round(pt.avg_score * BAR_MAX_H));
                    const col = pt.avg_score > 0.7 ? theme.primary : pt.avg_score > 0.4 ? theme.secondary : theme.textDim;
                    return (
                      <View key={i} style={styles.chartCol}>
                        <View style={[styles.chartBar, { height: h, backgroundColor: col }]} />
                        <Text style={styles.chartLabel} numberOfLines={1}>{pt.week.slice(-2)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot}>
                  <View style={[styles.legendCircle, { backgroundColor: theme.primary }]} />
                  <Text style={styles.legendText}>Happy</Text>
                </View>
                <View style={styles.legendDot}>
                  <View style={[styles.legendCircle, { backgroundColor: theme.secondary }]} />
                  <Text style={styles.legendText}>Neutral</Text>
                </View>
                <View style={styles.legendDot}>
                  <View style={[styles.legendCircle, { backgroundColor: theme.textDim }]} />
                  <Text style={styles.legendText}>Low</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Emotion Distribution */}
        {total > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mood Palette</Text>
            </View>
            <View style={styles.moodPalette}>
              {Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([em, count]) => {
                const pct = (count / total) * 100;
                const cols = EMOTION_COLORS[em] || EMOTION_COLORS.neutral;
                return (
                  <View key={em} style={styles.moodPill}>
                    <LinearGradient colors={cols as any} style={styles.moodPillGrad} />
                    <Text style={styles.moodPillEmoji}>{emotionEmoji(em)}</Text>
                    <Text style={styles.moodPillLabel}>{em}</Text>
                    <Text style={styles.moodPillPct}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* On this day photos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Day in Your Life</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="time-outline" size={32} color={theme.textMuted} />
            <Text style={styles.empty}>No flashbacks for today yet. Keep uploading photos — we'll surface them on their anniversary.</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.md, gap: 12 }}>
            {photos.map((p, idx) => {
              const y = getYear(p.taken_at);
              const diff = typeof y === "number" ? currentYear - y : "?";
              const emoColors = EMOTION_COLORS[p.analysis?.emotion || "neutral"] || EMOTION_COLORS.neutral;
              return (
                <TouchableOpacity
                  key={p.id} style={styles.memCard}
                  onPress={() => router.push(`/photo/${p.id}`)}
                  activeOpacity={0.88} testID={`memory-${idx}`}
                >
                  <Image source={{ uri: photoUri(p) }} style={StyleSheet.absoluteFill as any} />
                  <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.92)"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.memContent}>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                      <LinearGradient colors={emoColors as any} style={styles.yearBadge}>
                        <Text style={styles.yearBadgeText}>{diff === 0 ? "TODAY" : `${diff} YEAR${diff === 1 ? "" : "S"} AGO`}</Text>
                      </LinearGradient>
                      {p.analysis?.emotion && (
                        <View style={[styles.yearBadge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                          <Text style={[styles.yearBadgeText, { color: theme.text }]}>{emotionEmoji(p.analysis.emotion)} {p.analysis.emotion}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memYear}>{y}</Text>
                    <Text style={styles.memDesc} numberOfLines={2}>{p.analysis?.description || "A moment from your past."}</Text>
                    {p.location && <Text style={styles.memLoc}>📍 {p.location}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: theme.bg },
  header:         { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  eyebrow:        { color: theme.primary, fontSize: 11, letterSpacing: 2.4, fontWeight: "700" },
  title:          { color: theme.text, fontSize: 34, fontWeight: "500", letterSpacing: -1, marginTop: 6 },
  date:           { color: theme.textMuted, fontSize: 16, marginTop: 4 },
  predictionCard: { flexDirection: "row", gap: 12, padding: 16, marginHorizontal: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(138,154,255,0.25)", backgroundColor: "rgba(18,18,24,0.5)", marginBottom: spacing.md, overflow: "hidden" },
  predIconWrap:   { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(138,154,255,0.2)", alignItems: "center", justifyContent: "center" },
  predTitle:      { color: "#8A9AFF", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  predBody:       { color: theme.text, fontSize: 14, marginTop: 4, lineHeight: 20 },
  predSub:        { color: theme.textMuted, fontSize: 11, marginTop: 4 },
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle:   { color: theme.text, fontSize: 20, fontWeight: "600", letterSpacing: -0.3 },
  sectionSub:     { color: theme.textMuted, fontSize: 12 },
  chartCard:      { marginHorizontal: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, padding: spacing.md },
  chart:          { flexDirection: "row", alignItems: "flex-end", gap: 6, height: BAR_MAX_H + 24, paddingBottom: 24 },
  chartCol:       { alignItems: "center", gap: 4 },
  chartBar:       { width: 22, borderRadius: 4, minHeight: 8 },
  chartLabel:     { color: theme.textDim, fontSize: 9, width: 22, textAlign: "center" },
  chartLegend:    { flexDirection: "row", gap: 16, marginTop: spacing.sm },
  legendDot:      { flexDirection: "row", alignItems: "center", gap: 5 },
  legendCircle:   { width: 8, height: 8, borderRadius: 4 },
  legendText:     { color: theme.textMuted, fontSize: 11 },
  moodPalette:    { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: spacing.md },
  moodPill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, overflow: "hidden", flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  moodPillGrad:   { ...StyleSheet.absoluteFillObject, opacity: 0.12 },
  moodPillEmoji:  { fontSize: 14 },
  moodPillLabel:  { color: theme.text, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  moodPillPct:    { color: theme.textMuted, fontSize: 11 },
  center:         { alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: 10, minHeight: 180 },
  empty:          { color: theme.textMuted, textAlign: "center", fontSize: 13 },
  memCard:        { height: 240, borderRadius: radii.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  memContent:     { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  yearBadge:      { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  yearBadgeText:  { color: "#1a0a0a", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  memYear:        { color: theme.text, fontSize: 36, fontWeight: "500", letterSpacing: -0.8 },
  memDesc:        { color: "#D0D0D2", fontSize: 13, marginTop: 4, lineHeight: 18 },
  memLoc:         { color: theme.textMuted, fontSize: 11, marginTop: 6 },
});
