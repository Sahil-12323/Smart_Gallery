import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.overlay} />
          </BlurView>
        ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2, marginTop: -2 },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Insights", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="gallery" options={{ title: "Gallery", tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="stories" options={{ title: "Stories", tabBarIcon: ({ color, size }) => <Ionicons name="film-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="memories" options={{ title: "Rewind", tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
      {/* Hidden tab — reachable via router.push */}
      <Tabs.Screen name="people" options={{ href: null, title: "People", tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0, right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 82 : 68,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "transparent",
    elevation: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,5,0.6)" },
});
