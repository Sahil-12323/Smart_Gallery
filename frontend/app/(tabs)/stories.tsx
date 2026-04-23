import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Modal, Dimensions, FlatList, Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api, Story, Photo, photoUri, emotionEmoji } from "../../src/api";
import { theme, radii, spacing, EMOTION_COLORS } from "../../src/theme";

const { width: W, height: H } = Dimensions.get("window");

export default function StoriesScreen() {
  const [stories, setStories]       = useState<Story[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingStory, setViewing]  = useState<Story | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.stories();
      setStories(r.stories);
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const moodColor = (score: number): [string, string] => {
    if (score >= 0.8) return ["#FFD700", "#FFA500"];
    if (score >= 0.6) return ["#74FCCE", "#00C896"];
    if (score >= 0.4) return ["#8A9AFF", "#6A7AFF"];
    return ["#636E72", "#2D3436"];
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="stories-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Stories</Text>
        <Text style={styles.sub}>AI-crafted from your moments</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Weaving your story clusters…</Text>
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="film-outline" size={40} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.empty}>Upload multiple photos from the same event and AI will craft a story automatically.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 140, gap: 16 }}
          refreshControl={<RefreshControl tintColor={theme.primary} refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {stories.map((s, idx) => {
            const mc = moodColor(s.mood_score);
            const emoColors = EMOTION_COLORS[s.dominant_emotion] || EMOTION_COLORS.neutral;
            return (
              <TouchableOpacity key={s.id} style={styles.card} onPress={() => setViewing(s)} activeOpacity={0.88} testID={`story-${idx}`}>
                {(s.cover_url || s.cover_base64) ? (
                  <Image source={{ uri: s.cover_url || `data:${s.mime_type};base64,${s.cover_base64}` }} style={StyleSheet.absoluteFill as any} />
                ) : (
                  <View style={[StyleSheet.absoluteFill as any, { backgroundColor: theme.surface }]} />
                )}
                <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.94)"]} style={StyleSheet.absoluteFill} />

                {/* Mood bar */}
                <View style={styles.moodBar}>
                  <LinearGradient colors={emoColors as any} style={styles.moodBarFill} />
                  <Text style={styles.moodText}>{emotionEmoji(s.dominant_emotion)} {s.dominant_emotion}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <View style={styles.pill}>
                      <Ionicons name="images" size={11} color={theme.text} />
                      <Text style={styles.pillText}>{s.photo_count} photos</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: `${emoColors[0]}30`, borderColor: `${emoColors[0]}50` }]}>
                      <Text style={[styles.pillText, { color: emoColors[0] }]}>
                        {Math.round(s.mood_score * 100)}% happy
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  {!!s.subtitle && <Text style={styles.cardSub} numberOfLines={2}>{s.subtitle}</Text>}
                  <Text style={styles.cardDate}>{s.date_range}</Text>
                </View>

                {/* Photo strip preview */}
                {s.photos && s.photos.length > 1 && (
                  <View style={styles.photoStrip}>
                    {s.photos.slice(1, 4).map(p => (
                      <Image key={p.id} source={{ uri: photoUri(p) }} style={styles.stripThumb} />
                    ))}
                    {s.photo_count > 4 && (
                      <View style={styles.stripMore}>
                        <Text style={styles.stripMoreText}>+{s.photo_count - 4}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {viewingStory && (
        <StoryViewer story={viewingStory} onClose={() => setViewing(null)} />
      )}
    </SafeAreaView>
  );
}

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [narration, setNarration]     = useState<string | null>(null);
  const [loadingNar, setLoadingNar]   = useState(false);
  const photos = story.photos || [];

  useEffect(() => {
    if (photos.length > 0 && !narration) {
      setLoadingNar(true);
      api.narrateStory(story.id, story.photo_ids)
        .then(r => setNarration(r.narration))
        .catch(() => setNarration("A beautiful collection of memories."))
        .finally(() => setLoadingNar(false));
    }
  }, []);

  const go = (dir: number) => {
    setCurrentIdx(i => Math.max(0, Math.min(photos.length - 1, i + dir)));
  };

  if (photos.length === 0) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={[sv.safe, { justifyContent:"center", alignItems:"center" }]}>
          <Text style={sv.noPhotoText}>No photos in this story</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: theme.primary }}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const current = photos[currentIdx];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={sv.safe}>
        {/* Full-screen photo */}
        <Image source={{ uri: photoUri(current) }} style={sv.photo} resizeMode="cover" />
        <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent", "transparent", "rgba(0,0,0,0.92)"]} style={StyleSheet.absoluteFill} />

        {/* Top bar */}
        <View style={[sv.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={sv.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={sv.storyTitle} numberOfLines={1}>{story.title}</Text>
            <Text style={sv.storyDate}>{story.date_range}</Text>
          </View>
          <Text style={sv.progress}>{currentIdx + 1} / {photos.length}</Text>
        </View>

        {/* Progress dots */}
        <View style={sv.dots}>
          {photos.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrentIdx(i)}>
              <View style={[sv.dot, i === currentIdx && sv.dotActive, { width: i === currentIdx ? 24 : 6 }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo info */}
        <View style={[sv.infoArea, { paddingBottom: insets.bottom + 16 }]}>
          {loadingNar && currentIdx === 0 && (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={sv.narLoading}>Crafting narration…</Text>
            </View>
          )}
          {narration && currentIdx === 0 && (
            <Text style={sv.narration}>{narration}</Text>
          )}

          {current.analysis?.description ? (
            <Text style={sv.photoDesc} numberOfLines={3}>{current.analysis.description}</Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {current.analysis?.emotion && (
              <View style={sv.tag}>
                <Text style={sv.tagText}>{emotionEmoji(current.analysis.emotion)} {current.analysis.emotion}</Text>
              </View>
            )}
            {current.location && (
              <View style={sv.tag}>
                <Text style={sv.tagText}>📍 {current.location}</Text>
              </View>
            )}
            {current.taken_at && (
              <View style={sv.tag}>
                <Text style={sv.tagText}>📅 {current.taken_at.slice(0,10)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Nav buttons */}
        <TouchableOpacity style={[sv.navBtn, { left: 16 }]} onPress={() => go(-1)} disabled={currentIdx === 0}>
          <Ionicons name="chevron-back" size={24} color={currentIdx === 0 ? theme.textDim : theme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[sv.navBtn, { right: 16 }]} onPress={() => go(1)} disabled={currentIdx === photos.length - 1}>
          <Ionicons name="chevron-forward" size={24} color={currentIdx === photos.length - 1 ? theme.textDim : theme.text} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const sv = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: "#000" },
  photo:       { width: W, height: H },
  topBar:      { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  closeBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  storyTitle:  { color: theme.text, fontSize: 16, fontWeight: "600" },
  storyDate:   { color: theme.textMuted, fontSize: 11 },
  progress:    { color: theme.textMuted, fontSize: 13, fontWeight: "600" },
  dots:        { position: "absolute", top: 120, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 4 },
  dot:         { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive:   { backgroundColor: theme.primary },
  infoArea:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  narration:   { color: "rgba(255,255,255,0.75)", fontSize: 13, fontStyle: "italic", lineHeight: 20, marginBottom: 12 },
  narLoading:  { color: theme.textMuted, fontSize: 12 },
  photoDesc:   { color: theme.text, fontSize: 15, lineHeight: 22, fontWeight: "400" },
  tag:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  tagText:     { color: theme.text, fontSize: 12, textTransform: "capitalize" },
  navBtn:      { position: "absolute", top: "45%", width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  noPhotoText: { color: theme.text, fontSize: 16, marginBottom: 20 },
});

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: theme.bg },
  header:       { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title:        { color: theme.text, fontSize: 28, fontWeight: "600", letterSpacing: -0.6 },
  sub:          { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: spacing.lg },
  loadingText:  { color: theme.textMuted, fontSize: 13 },
  emptyTitle:   { color: theme.text, fontSize: 18, fontWeight: "600" },
  empty:        { color: theme.textMuted, textAlign: "center", fontSize: 13 },
  card:         { height: 300, borderRadius: radii.lg, overflow: "hidden", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  moodBar:      { position: "absolute", top: 0, left: 0, right: 0, height: 3, overflow: "hidden", flexDirection: "row", alignItems: "center" },
  moodBarFill:  { flex: 1, height: "100%" },
  moodText:     { position: "absolute", right: 10, top: 8, color: theme.text, fontSize: 10, fontWeight: "600", textTransform: "capitalize", backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  cardContent:  { position: "absolute", bottom: 50, left: 0, right: 0, padding: 18 },
  pill:         { alignSelf: "flex-start", flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  pillText:     { color: theme.text, fontSize: 11, fontWeight: "600" },
  cardTitle:    { color: theme.text, fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  cardSub:      { color: "#D0D0D2", fontSize: 13, marginTop: 4, lineHeight: 19 },
  cardDate:     { color: theme.textMuted, fontSize: 10, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" },
  photoStrip:   { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", height: 44, gap: 2, padding: 2 },
  stripThumb:   { width: 60, height: 40, borderRadius: 6 },
  stripMore:    { width: 60, height: 40, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  stripMoreText:{ color: theme.text, fontSize: 12, fontWeight: "700" },
});
