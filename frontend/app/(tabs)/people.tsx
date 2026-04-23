import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, PeopleGroup } from "../../src/api";
import { theme, radii, spacing } from "../../src/theme";

export default function PeopleScreen() {
  const router = useRouter();
  const [groups, setGroups]         = useState<PeopleGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.people();
      setGroups(r.groups);
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>People</Text>
          <Text style={styles.sub}>Grouped by appearance</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.loadingText}>Analyzing faces in your gallery…</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={40} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No people groups yet</Text>
          <Text style={styles.empty}>Upload photos with people and the AI will group them by appearance automatically.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 130, gap: 14 }}
          refreshControl={<RefreshControl tintColor={theme.primary} refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {groups.map((g, idx) => (
            <View key={idx} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.coverWrap}>
                  {(g.cover_url || g.cover_base64) ? (
                    <Image source={{ uri: g.cover_url || `data:${g.cover_mime};base64,${g.cover_base64 || ""}` }} style={styles.coverImg} />
                  ) : (
                    <View style={[styles.coverImg, { backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" }]}>
                      <Ionicons name="person" size={28} color={theme.textMuted} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupLabel} numberOfLines={2}>{g.descriptor}</Text>
                  <Text style={styles.groupCount}>{g.photo_count} photos together</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{g.photo_count}</Text>
                </View>
              </View>

              {/* Mini photo strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {g.photo_ids.slice(0, 8).map((pid, i) => (
                    <TouchableOpacity key={pid} style={styles.stripItem} onPress={() => router.push(`/photo/${pid}`)}>
                      <View style={[styles.stripItem, { backgroundColor: theme.surfaceAlt }]}>
                        <Ionicons name="image" size={20} color={theme.textDim} style={{ position: "absolute" }} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: theme.bg },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  title:        { color: theme.text, fontSize: 22, fontWeight: "600", letterSpacing: -0.4 },
  sub:          { color: theme.textMuted, fontSize: 12 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: spacing.lg },
  loadingText:  { color: theme.textMuted, fontSize: 13 },
  emptyTitle:   { color: theme.text, fontSize: 18, fontWeight: "600" },
  empty:        { color: theme.textMuted, textAlign: "center", fontSize: 13 },
  groupCard:    { backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, padding: spacing.md },
  groupHeader:  { flexDirection: "row", gap: 12, alignItems: "center" },
  coverWrap:    { width: 56, height: 56, borderRadius: radii.md, overflow: "hidden" },
  coverImg:     { width: 56, height: 56, borderRadius: radii.md },
  groupLabel:   { color: theme.text, fontSize: 14, fontWeight: "600", textTransform: "capitalize", flex: 1 },
  groupCount:   { color: theme.textMuted, fontSize: 12, marginTop: 3 },
  countBadge:   { width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.primary}20`, borderWidth: 1, borderColor: `${theme.primary}40`, alignItems: "center", justifyContent: "center" },
  countBadgeText:{ color: theme.primary, fontSize: 13, fontWeight: "700" },
  stripItem:    { width: 52, height: 52, borderRadius: radii.sm, overflow: "hidden", backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" },
});
