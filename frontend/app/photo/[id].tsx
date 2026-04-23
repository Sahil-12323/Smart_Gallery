import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Share, Dimensions, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, Photo, photoUri, formatDate, emotionEmoji } from "../../src/api";
import { theme, radii, spacing, EMOTION_COLORS } from "../../src/theme";

const { width: W } = Dimensions.get("window");

export default function PhotoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const [photo, setPhoto]           = useState<Photo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await api.getPhoto(id as string);
        setPhoto(p);
      } catch (e: any) {
        router.back();
      } finally { setLoading(false); }
    })();
  }, [id]);

  // ── DELETE — uses Modal not Alert (Alert.onPress unreliable on Android) ──
  const confirmDelete = async () => {
    if (!photo) return;
    setShowDeleteModal(false);
    setDeleting(true);
    try {
      await api.deletePhoto(photo.id);
      router.back();
    } catch (e: any) {
      setDeleting(false);
      // Show error via state not Alert
      setDeleteError(e?.message || "Delete failed");
    }
  };

  const [deleteError, setDeleteError] = useState("");

  // ── FAVOURITE ─────────────────────────────────────────────────────────────
  const toggleFav = async () => {
    if (!photo) return;
    setToggling(true);
    try {
      const r = await api.toggleFav(photo.id);
      setPhoto(p => p ? { ...p, is_favorite: r.is_favorite } : p);
    } catch {} finally { setToggling(false); }
  };

  // ── SHARE ─────────────────────────────────────────────────────────────────
  const sharePhoto = async () => {
    if (!photo) return;
    try {
      await Share.share({
        message: `${photo.analysis?.description || "A memory"} — AI Gallery`,
      });
    } catch {}
  };

  if (loading || !photo) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const a = photo.analysis || ({} as Photo["analysis"]);
  const emoColors = EMOTION_COLORS[a.emotion?.toLowerCase() || "neutral"] || EMOTION_COLORS.neutral;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="photo-detail">

      {/* ── Top action bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={sharePhoto}>
            <Ionicons name="share-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleFav} disabled={toggling}>
            {toggling
              ? <ActivityIndicator color={theme.primary} size="small" />
              : <Ionicons name={photo.is_favorite ? "heart" : "heart-outline"} size={20} color={photo.is_favorite ? theme.primary : theme.text} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, deleting && { opacity: 0.5 }]}
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            testID="photo-delete"
          >
            {deleting
              ? <ActivityIndicator color={theme.error} size="small" />
              : <Ionicons name="trash-outline" size={20} color={theme.error} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Hero image ── */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: photoUri(photo) }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={["transparent", "rgba(5,5,5,0.97)"]} style={styles.imageFade} />
          {a.emotion && (
            <View style={styles.emotionBadge}>
              <LinearGradient colors={emoColors as any} style={StyleSheet.absoluteFill} />
              <Text style={styles.emotionBadgeText}>{emotionEmoji(a.emotion)} {a.emotion}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Description */}
          <Text style={styles.desc}>{a.description || "No description available."}</Text>

          {/* Error message */}
          {deleteError.length > 0 && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={theme.error} />
              <Text style={styles.errorText}>{deleteError}</Text>
              <TouchableOpacity onPress={() => setDeleteError("")}>
                <Ionicons name="close" size={16} color={theme.error} />
              </TouchableOpacity>
            </View>
          )}

          {/* Meta grid */}
          <View style={styles.metaGrid}>
            {photo.taken_at && <MetaCard icon="calendar" label="Date" value={formatDate(photo.taken_at)} />}
            {photo.location  && <MetaCard icon="location" label="Location" value={photo.location} />}
            {a.scene         && <MetaCard icon="map" label="Scene" value={a.scene} />}
            {a.event_type    && <MetaCard icon="star" label="Event" value={a.event_type} />}
            {a.people_count != null && a.people_count > 0 && <MetaCard icon="people" label="People" value={String(a.people_count)} />}
            {a.emotion_score != null && <MetaCard icon="heart" label="Mood" value={`${Math.round(a.emotion_score * 100)}%`} />}
          </View>

          {/* Mood bar */}
          {a.emotion_score != null && (
            <View style={styles.moodBar}>
              <Text style={styles.moodLabel}>Mood</Text>
              <View style={styles.moodTrack}>
                <LinearGradient colors={emoColors as any} start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                  style={[styles.moodFill, { width: `${Math.round(a.emotion_score * 100)}%` as any }]} />
              </View>
              <Text style={styles.moodPct}>{Math.round(a.emotion_score * 100)}%</Text>
            </View>
          )}

          {a.tags     && a.tags.length     > 0 && <ChipSection title="Tags"     items={a.tags}     color={theme.primary} />}
          {a.people   && a.people.length   > 0 && <ChipSection title="People"   items={a.people}   color={theme.secondary} />}
          {a.objects  && a.objects.length  > 0 && <ChipSection title="Objects"  items={a.objects}  color={theme.text} />}
          {a.clothing && a.clothing.length > 0 && <ChipSection title="Clothing" items={a.clothing} color={theme.accent} />}

          {a.colors && a.colors.length > 0 && (
            <View style={styles.chipSection}>
              <Text style={styles.chipTitle}>Colors</Text>
              <View style={styles.chipRow}>
                {a.colors.map((c, i) => (
                  <View key={`${c}-${i}`} style={styles.chip}>
                    <Text style={[styles.chipText, { color: theme.text }]}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {a.ocr_text ? (
            <View style={styles.ocrCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Ionicons name="text" size={14} color={theme.primarySoft} />
                <Text style={styles.ocrLabel}>TEXT IN PHOTO</Text>
              </View>
              <Text style={styles.ocrBody}>{a.ocr_text}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Delete confirmation modal ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="trash" size={32} color={theme.error} />
            </View>
            <Text style={styles.modalTitle}>Delete this memory?</Text>
            <Text style={styles.modalBody}>
              This photo will be permanently removed. This cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmDelete}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function MetaCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.metaCard}>
      <Ionicons name={icon} size={14} color={theme.primary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ChipSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={styles.chipSection}>
      <Text style={styles.chipTitle}>{title}</Text>
      <View style={styles.chipRow}>
        {items.map((t, i) => (
          <View key={`${t}-${i}`} style={[styles.chip, { borderColor: `${color}30` }]}>
            <Text style={[styles.chipText, { color }]}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: theme.bg },
  topBar:         { position: "absolute", top: 50, left: 0, right: 0, paddingHorizontal: spacing.md, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(5,5,5,0.65)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  imageWrap:      { width: "100%", height: W * 1.1, backgroundColor: theme.surface },
  image:          { width: "100%", height: "100%" },
  imageFade:      { position: "absolute", bottom: 0, left: 0, right: 0, height: "35%" },
  emotionBadge:   { position: "absolute", bottom: 14, left: spacing.md, borderRadius: radii.pill, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 7 },
  emotionBadgeText:{ color: "#1a0a0a", fontWeight: "800", fontSize: 13, textTransform: "capitalize" },
  content:        { padding: spacing.md, marginTop: -20 },
  desc:           { color: theme.text, fontSize: 18, lineHeight: 27, fontWeight: "400", marginBottom: spacing.lg },
  errorBanner:    { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: `${theme.error}15`, borderRadius: radii.md, borderWidth: 1, borderColor: `${theme.error}30`, marginBottom: spacing.md },
  errorText:      { flex: 1, color: theme.error, fontSize: 13 },
  metaGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
  metaCard:       { flex: 1, minWidth: "45%", padding: 12, backgroundColor: theme.surface, borderRadius: radii.md, borderWidth: 1, borderColor: theme.border, gap: 4 },
  metaLabel:      { color: theme.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: "600" },
  metaValue:      { color: theme.text, fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  moodBar:        { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.lg },
  moodLabel:      { color: theme.textMuted, fontSize: 12, width: 36 },
  moodTrack:      { flex: 1, height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: "hidden" },
  moodFill:       { height: "100%", borderRadius: 4 },
  moodPct:        { color: theme.text, fontSize: 12, fontWeight: "600", width: 36, textAlign: "right" },
  chipSection:    { marginBottom: spacing.md },
  chipTitle:      { color: theme.textMuted, fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: "700", marginBottom: 8 },
  chipRow:        { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: theme.surface, borderWidth: 1 },
  chipText:       { fontSize: 12, textTransform: "capitalize" },
  ocrCard:        { marginBottom: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: `${theme.primarySoft}30`, backgroundColor: `${theme.primarySoft}08` },
  ocrLabel:       { color: theme.primarySoft, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  ocrBody:        { color: theme.text, fontSize: 14, lineHeight: 21 },
  // Modal
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard:      { width: "100%", backgroundColor: theme.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: theme.border, padding: 28, alignItems: "center", gap: 14 },
  modalIcon:      { width: 68, height: 68, borderRadius: 34, backgroundColor: `${theme.error}18`, alignItems: "center", justifyContent: "center" },
  modalTitle:     { color: theme.text, fontSize: 22, fontWeight: "700", textAlign: "center" },
  modalBody:      { color: theme.textMuted, fontSize: 14, textAlign: "center", lineHeight: 21 },
  modalBtns:      { flexDirection: "row", gap: 12, marginTop: 4, width: "100%" },
  cancelBtn:      { flex: 1, paddingVertical: 15, borderRadius: radii.pill, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, alignItems: "center" },
  cancelText:     { color: theme.text, fontWeight: "600", fontSize: 16 },
  deleteBtn:      { flex: 1, paddingVertical: 15, borderRadius: radii.pill, backgroundColor: theme.error, alignItems: "center" },
  deleteBtnText:  { color: "#fff", fontWeight: "700", fontSize: 16 },
});
