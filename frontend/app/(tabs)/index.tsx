import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { api, Insight, Photo, photoUri, Stats, emotionEmoji } from "../../src/api";
import { theme, radii, spacing, EMOTION_COLORS } from "../../src/theme";

const { width: W } = Dimensions.get("window");

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  heart: "heart", "trend-up": "trending-up", "trend-down": "trending-down",
  sparkles: "sparkles", calendar: "calendar", users: "people",
  map: "map", camera: "camera", flame: "flame", moon: "moon",
};

export default function InsightsScreen() {
  const router = useRouter();
  const [insights, setInsights]       = useState<Insight[]>([]);
  const [photos, setPhotos]           = useState<Photo[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [seeding, setSeeding]         = useState(false);
  const [generatedAt, setGeneratedAt] = useState("");

  const load = useCallback(async (refresh = false) => {
    try {
      const [ins, ph] = await Promise.all([api.insights(refresh), api.listPhotos()]);
      setInsights(ins.insights || []);
      setGeneratedAt(ins.generated_at || "");
      setPhotos(ph);
      if (ph.length > 0) {
        api.stats().then(setStats).catch(() => {});
      }
    } catch (e) {
      console.warn("insights load", e);
    }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true); await load(true); setRefreshing(false);
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await api.seed();
      Alert.alert("Demo loaded 🎉", `${res.inserted} memories analyzed by Groq AI.`);
      await load(true);
    } catch (e: any) {
      Alert.alert("Seed failed", e?.message || "Could not fetch demo photos.");
    } finally { setSeeding(false); }
  };

  const recent  = photos.slice(0, 6);
  const favs    = photos.filter(p => p.is_favorite).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="insights-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl tintColor={theme.primary} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR LIFE, QUERYABLE</Text>
          <Text style={styles.hero}>
            A second brain{"\n"}for your <Text style={styles.heroAccent}>memories.</Text>
          </Text>
          <Text style={styles.subtitle}>
            {photos.length > 0
              ? `${photos.length} moments analyzed · powered by Groq AI`
              : "Load demo memories or upload your own to begin."}
          </Text>
        </View>

        {/* Stats bar */}
        {stats && (
          <View style={styles.statsRow}>
            <StatPill label="Total" value={String(stats.total)} icon="images" />
            <StatPill label="Favourites" value={String(stats.favorites)} icon="heart" />
            <StatPill
              label="Since"
              value={stats.oldest ? new Date(stats.oldest).getFullYear().toString() : "—"}
              icon="calendar"
            />
            <StatPill
              label="Top Mood"
              value={Object.entries(stats.emotion_distribution).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—"}
              icon="sparkles"
            />
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(tabs)/chat")}
            testID="cta-chat" activeOpacity={0.85}
          >
            <LinearGradient colors={[theme.primarySoft, theme.primary]} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={styles.primaryBtnGrad}>
              <Ionicons name="chatbubbles" size={18} color="#1a0a0a" />
              <Text style={styles.primaryBtnText}>Ask your gallery</Text>
            </LinearGradient>
          </TouchableOpacity>

          {photos.length === 0 ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={seed} disabled={seeding} testID="cta-seed" activeOpacity={0.85}>
              {seeding
                ? <ActivityIndicator color={theme.text} />
                : <><Ionicons name="flash" size={16} color={theme.text} /><Text style={styles.secondaryBtnText}>Load demo</Text></>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(tabs)/gallery")} testID="cta-gallery" activeOpacity={0.85}>
              <Ionicons name="add" size={16} color={theme.text} />
              <Text style={styles.secondaryBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Second row of actions */}
        <View style={[styles.actionsRow, { marginTop: -8 }]}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex:1 }]} onPress={() => router.push("/(tabs)/stories")} activeOpacity={0.85}>
            <Ionicons name="film-outline" size={16} color={theme.text} />
            <Text style={styles.secondaryBtnText}>Stories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { flex:1 }]} onPress={() => router.push("/(tabs)/memories")} activeOpacity={0.85}>
            <Ionicons name="time-outline" size={16} color={theme.text} />
            <Text style={styles.secondaryBtnText}>On this day</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { flex:1 }]} onPress={() => router.push("/(tabs)/people")} activeOpacity={0.85}>
            <Ionicons name="people-outline" size={16} color={theme.text} />
            <Text style={styles.secondaryBtnText}>People</Text>
          </TouchableOpacity>
        </View>

        {/* Insights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Life Insights</Text>
          <TouchableOpacity onPress={() => load(true)} testID="refresh-insights">
            <Ionicons name="refresh" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.loadingText}>Groq is reading your memories…</Text>
          </View>
        ) : insights.length === 0 ? (
          <View style={styles.emptyCard} testID="insights-empty">
            <Ionicons name="sparkles-outline" size={28} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptyBody}>Upload at least 2 photos and the AI will discover patterns in your life.</Text>
          </View>
        ) : (
          <View style={styles.insightList}>
            {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
          </View>
        )}

        {/* Favourites */}
        {favs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>❤️ Favourites</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/gallery")}>
                <Text style={styles.linkText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.md }}>
              <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: spacing.md }}>
                {favs.map(p => (
                  <TouchableOpacity key={p.id} style={styles.favCard} onPress={() => router.push(`/photo/${p.id}`)} activeOpacity={0.85}>
                    <Image source={{ uri: photoUri(p) }} style={{ width: "100%", height: "100%" }} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.favOverlay}>
                      <Text style={styles.favEmotion}>{emotionEmoji(p.analysis?.emotion)} {p.analysis?.emotion}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Recent memories */}
        {recent.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Moments</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/gallery")}>
                <Text style={styles.linkText}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bento}>
              {recent.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.bentoItem, idx === 0 && styles.bentoItemLarge]}
                  onPress={() => router.push(`/photo/${p.id}`)}
                  activeOpacity={0.85}
                  testID={`recent-photo-${p.id}`}
                >
                  <Image source={{ uri: photoUri(p) }} style={{ width: "100%", height: "100%" }} />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.bentoOverlay}>
                    <Text style={styles.bentoEmotion} numberOfLines={1}>
                      {emotionEmoji(p.analysis?.emotion)} {p.analysis?.emotion || "—"}
                    </Text>
                    {p.analysis?.event_type && (
                      <Text style={styles.bentoEvent} numberOfLines={1}>{p.analysis.event_type}</Text>
                    )}
                  </LinearGradient>
                  {p.is_favorite && (
                    <View style={styles.favBadge}>
                      <Ionicons name="heart" size={10} color="#FF8C94" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {generatedAt.length > 0 && (
          <Text style={styles.genAt}>
            Insights generated {new Date(generatedAt).toLocaleDateString()}
          </Text>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={13} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const iconName = ICON_MAP[insight.icon] || "sparkles";
  const tint = insight.emotion === "positive"
    ? ["#FFC8A2", "#FF8C94"]
    : insight.emotion === "reflective"
    ? ["#8A9AFF", "#6A7AFF"]
    : ["#2A2A2A", "#1A1A1A"];
  return (
    <View style={styles.insightCard} testID={`insight-${index}`}>
      <LinearGradient colors={[`${tint[0]}18`, `${tint[1]}06`]} style={StyleSheet.absoluteFill} />
      <View style={styles.insightIconWrap}>
        <LinearGradient colors={tint as any} style={styles.insightIconBg}>
          <Ionicons name={iconName} size={18} color="#1a0a0a" />
        </LinearGradient>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightBody}>{insight.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: theme.bg },
  scroll:          { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  header:          { marginBottom: spacing.lg },
  eyebrow:         { color: theme.primary, fontSize: 11, letterSpacing: 2.4, fontWeight: "700", marginBottom: spacing.sm },
  hero:            { color: theme.text, fontSize: 36, lineHeight: 41, fontWeight: "500", letterSpacing: -1.2 },
  heroAccent:      { color: theme.primary, fontStyle: "italic", fontWeight: "400" },
  subtitle:        { color: theme.textMuted, marginTop: spacing.sm, fontSize: 13 },
  statsRow:        { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  statPill:        {
    flex: 1, alignItems: "center", gap: 3, paddingVertical: 10,
    backgroundColor: theme.surface, borderRadius: radii.md,
    borderWidth: 1, borderColor: theme.border,
  },
  statValue:       { color: theme.text, fontSize: 14, fontWeight: "700" },
  statLabel:       { color: theme.textMuted, fontSize: 9, letterSpacing: 0.5 },
  actionsRow:      { flexDirection: "row", gap: 10, marginBottom: spacing.md },
  primaryBtn:      { flex: 1, borderRadius: radii.pill, overflow: "hidden" },
  primaryBtnGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  primaryBtnText:  { color: "#1a0a0a", fontWeight: "700", fontSize: 14 },
  secondaryBtn:    {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: radii.pill,
    borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface,
  },
  secondaryBtnText:{ color: theme.text, fontWeight: "600", fontSize: 12 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle:    { color: theme.text, fontSize: 20, fontWeight: "600", letterSpacing: -0.3 },
  linkText:        { color: theme.primary, fontSize: 13, fontWeight: "600" },
  loadingWrap:     { paddingVertical: 40, alignItems: "center", gap: 10 },
  loadingText:     { color: theme.textMuted, fontSize: 13 },
  emptyCard:       { padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", gap: 8 },
  emptyTitle:      { color: theme.text, fontSize: 16, fontWeight: "600" },
  emptyBody:       { color: theme.textMuted, fontSize: 13, textAlign: "center" },
  insightList:     { gap: spacing.sm },
  insightCard:     { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, backgroundColor: "rgba(18,18,18,0.5)", overflow: "hidden" },
  insightIconWrap: { marginTop: 2 },
  insightIconBg:   { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  insightTitle:    { color: theme.text, fontSize: 15, fontWeight: "600", marginBottom: 4 },
  insightBody:     { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
  favCard:         { width: 140, height: 140, borderRadius: radii.md, overflow: "hidden", borderWidth: 1, borderColor: theme.border },
  favOverlay:      { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, height: "50%", justifyContent: "flex-end" },
  favEmotion:      { color: theme.text, fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  bento:           { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bentoItem:       { width: "48.5%", aspectRatio: 1, borderRadius: radii.md, overflow: "hidden", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  bentoItemLarge:  { width: "100%", aspectRatio: 16 / 9 },
  bentoOverlay:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, height: "50%", justifyContent: "flex-end" },
  bentoEmotion:    { color: theme.text, fontSize: 11, textTransform: "capitalize", fontWeight: "600" },
  bentoEvent:      { color: theme.textMuted, fontSize: 9, textTransform: "capitalize", marginTop: 2 },
  favBadge:        { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  genAt:           { color: theme.textDim, fontSize: 11, textAlign: "center", marginTop: spacing.lg },
});
