import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, TextInput, RefreshControl, Platform,
  Dimensions, Modal, FlatList
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect, useRouter } from "expo-router";
import { api, Photo, photoUri, emotionEmoji, BACKEND_URL } from "../../src/api";
import { theme, radii, spacing } from "../../src/theme";
WebBrowser.maybeCompleteAuthSession();

const { width: W } = Dimensions.get("window");
const TILE_SIZE = (W - spacing.md * 2 - 8) / 3;

type GooglePhoto = {
  id: string;
  baseUrl: string;
};

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Google
 const [gPhotos, setGPhotos] = useState<GooglePhoto[]>([]);
  const [gLoading, setGLoading] = useState(false);
  const [showGModal, setShowGModal] = useState(false);
  const [gToken, setGToken] = useState<string | null>(null);

  // ── Load gallery ─────────────────────────────
  const load = useCallback(async () => {
    try {
      setPhotos(await api.listPhotos());
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── GOOGLE LOGIN (backend only) ─────────────
 const connectGoogle = async () => {
  try {
    setGLoading(true);

    const redirectUri = "https://auth.expo.io/@sahil6383/ai-gallery";
    const authUrl = `${BACKEND_URL}/api/auth/google/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success") {
      throw new Error("Login cancelled");
    }

    const url = result.url;
    const queryString = url.split("?")[1] || "";
    const params = new URLSearchParams(queryString);
    const token = params.get("token");

    if (!token) throw new Error("No token received");
    setGToken(token);

    // 🔥 Use token to fetch photos
    const res = await fetch(
      `${BACKEND_URL}/api/google/photos?token=${token}`
    );

    const data = await res.json();

    setGPhotos(data.photos || []);
    setShowGModal(true);

  } catch (e: any) {
    Alert.alert("Google Error", e.message);
  } finally {
    setGLoading(false);
  }
};
  // // ── LOAD GOOGLE PHOTOS FROM BACKEND ─────────
  // const loadGooglePhotos = async () => {
  //   setGLoading(true);
  //   try {
  //     const res = await fetch(`${BACKEND_URL}/api/google/photos`);
  //     if (!res.ok) throw new Error("Failed");

  //     const data = await res.json();
  //     setGPhotos(data.photos || []);
  //     setShowGModal(true);
  //   } catch (e) {
  //     // Not logged in → trigger login
  //     await connectGoogle();
  //     return
  //   } finally {
  //     setGLoading(false);
  //   }
  // };

const loadGooglePhotos = async () => {
  setGLoading(true);
  try {
  if (gToken) {
    const res = await fetch(
      `${BACKEND_URL}/api/google/photos?token=${gToken}`
    );
    const data = await res.json();
    setGPhotos(data.photos || []);
    setShowGModal(true);
  } else {
    await connectGoogle();
  }
  } finally {
    setGLoading(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={loadGooglePhotos}>
          <Ionicons name="logo-google" size={22} color="#4285F4" />
        </TouchableOpacity>
      </View>

      {/* Gallery */}
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {photos.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push(`/photo/${p.id}`)}
            >
              <Image source={{ uri: photoUri(p) }} style={styles.tile} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Google Modal */}
      <Modal visible={showGModal} animationType="slide">
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <TouchableOpacity onPress={() => setShowGModal(false)}>
            <Text style={{ padding: 16 }}>Close</Text>
          </TouchableOpacity>

          {gLoading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={gPhotos}
              keyExtractor={(i) => i.id}
              numColumns={3}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.baseUrl + "=w300" }}
                  style={styles.gTile}
                />
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: theme.text,
  },
  iconBtn: {
    padding: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 10,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  gTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: 2,
  },
});
