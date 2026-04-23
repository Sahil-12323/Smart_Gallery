import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../src/api";
import { theme, radii, spacing } from "../../src/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [resetting, setResetting] = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [userName, setUserName] = useState("You");

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([api.getSettings(), api.stats()]);
      setSettings(s);
      setUserName(s.user_name || "You");
      setStats(st);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async (updates: Record<string, any>) => {
    const merged = { ...settings, ...updates };
    setSettings(merged);
    try { await api.updateSettings(merged); } catch {}
  };

  const resetAll = () => {
    Alert.alert(
      "Reset Gallery?",
      "This will permanently delete ALL your photos, conversations, and insights. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything", style: "destructive",
          onPress: async () => {
            setResetting(true);
            try { await api.reset(); await load(); Alert.alert("Done", "Gallery reset."); }
            catch (e: any) { Alert.alert("Error", e?.message); }
            finally { setResetting(false); }
          },
        },
      ]
    );
  };

  const seedDemo = async () => {
    Alert.alert("Load Demo?", "This will replace your current gallery with demo memories.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Load Demo",
        onPress: async () => {
          setSeeding(true);
          try {
            const r = await api.seed();
            Alert.alert("Loaded! 🎉", `${r.inserted} demo memories loaded and analyzed.`);
            await load();
          } catch (e: any) { Alert.alert("Error", e?.message); }
          finally { setSeeding(false); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <LinearGradient colors={[theme.primarySoft, theme.primary]} style={styles.avatar} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
              <Ionicons name="person" size={28} color="#1a0a0a" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileLabel}>Your name</Text>
              <TextInput
                style={styles.profileInput}
                value={userName}
                onChangeText={setUserName}
                onBlur={() => save({ user_name: userName })}
                placeholder="Enter your name"
                placeholderTextColor={theme.textDim}
              />
            </View>
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Gallery Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Photos" value={String(stats.total)} icon="images" />
              <StatCard label="Favourites" value={String(stats.favorites)} icon="heart" />
              <StatCard label="Earliest" value={stats.oldest || "—"} icon="calendar" />
              <StatCard label="Latest" value={stats.newest || "—"} icon="time" />
            </View>

            {stats.event_distribution && Object.keys(stats.event_distribution).length > 0 && (
              <View style={styles.distCard}>
                <Text style={styles.distTitle}>Top Event Types</Text>
                {Object.entries(stats.event_distribution).slice(0, 5).map(([ev, count]) => (
                  <View key={ev} style={styles.distRow}>
                    <Text style={styles.distLabel}>{ev}</Text>
                    <View style={styles.distBarWrap}>
                      <View style={[styles.distBar, { width: `${Math.round((count as number / stats.total) * 100)}%` }]} />
                    </View>
                    <Text style={styles.distCount}>{count as number}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.prefList}>
            <PrefRow
              label="Auto-generate insights"
              sub="Refresh insights when gallery changes"
              value={settings.auto_insights !== false}
              onChange={v => save({ auto_insights: v })}
            />
            <PrefRow
              label="Notifications"
              sub="On this day reminders"
              value={settings.notifications_enabled !== false}
              onChange={v => save({ notifications_enabled: v })}
            />
          </View>
        </View>

        {/* Data management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.actionList}>
            <TouchableOpacity style={styles.actionRow} onPress={seedDemo} disabled={seeding}>
              <Ionicons name="flash-outline" size={22} color={theme.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Load Demo Memories</Text>
                <Text style={styles.actionSub}>Replace gallery with AI-analyzed demo photos</Text>
              </View>
              {seeding
                ? <ActivityIndicator color={theme.textMuted} size="small" />
                : <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={resetAll} disabled={resetting}>
              <Ionicons name="trash-outline" size={22} color={theme.error} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, { color: theme.error }]}>Reset Everything</Text>
                <Text style={styles.actionSub}>Delete all photos, chats, and insights</Text>
              </View>
              {resetting
                ? <ActivityIndicator color={theme.error} size="small" />
                : <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <LinearGradient colors={[theme.primarySoft, theme.primary]} style={styles.aboutIcon} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
              <Ionicons name="sparkles" size={20} color="#1a0a0a" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.aboutTitle}>AI Gallery v2.0</Text>
              <Text style={styles.aboutSub}>Your life, queryable · Powered by Groq AI</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PrefRow({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: `${theme.primary}60` }}
        thumbColor={value ? theme.primary : theme.textDim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: theme.bg },
  header:      { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:       { color: theme.text, fontSize: 28, fontWeight: "600", letterSpacing: -0.6 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  section:     { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionTitle:{ color: theme.textMuted, fontSize: 11, letterSpacing: 1.8, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm },
  card:        { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center" },
  avatar:      { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  profileLabel:{ color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  profileInput:{ color: theme.text, fontSize: 17, fontWeight: "500" },
  statsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard:    { flex: 1, minWidth: "45%", padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center", gap: 4 },
  statValue:   { color: theme.text, fontSize: 16, fontWeight: "700" },
  statLabel:   { color: theme.textMuted, fontSize: 11, textAlign: "center" },
  distCard:    { marginTop: spacing.md, padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, gap: 10 },
  distTitle:   { color: theme.textMuted, fontSize: 11, letterSpacing: 1.2, fontWeight: "700", textTransform: "uppercase" },
  distRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  distLabel:   { color: theme.text, fontSize: 12, width: 80, textTransform: "capitalize" },
  distBarWrap: { flex: 1, height: 6, backgroundColor: theme.surfaceAlt, borderRadius: 3, overflow: "hidden" },
  distBar:     { height: "100%", backgroundColor: theme.primary, borderRadius: 3 },
  distCount:   { color: theme.textMuted, fontSize: 11, width: 28, textAlign: "right" },
  prefList:    { backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
  prefRow:     { flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  prefLabel:   { color: theme.text, fontSize: 14, fontWeight: "500" },
  prefSub:     { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  actionList:  { backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
  actionRow:   { flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  dangerRow:   { borderBottomWidth: 0 },
  actionLabel: { color: theme.text, fontSize: 14, fontWeight: "500" },
  actionSub:   { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  aboutCard:   { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center" },
  aboutIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  aboutTitle:  { color: theme.text, fontSize: 16, fontWeight: "600" },
  aboutSub:    { color: theme.textMuted, fontSize: 12, marginTop: 2 },
});
