import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { api, Photo, photoUri } from "../../src/api";
import { theme, radii, spacing } from "../../src/theme";

type Msg = { role: "user" | "assistant"; content: string; photos?: Photo[]; timestamp?: string };

const SUGGESTIONS = [
  "Show me my happiest moments",
  "When was I last at the gym?",
  "Find photos with people",
  "Show receipts or text in photos",
  "What were my best travel memories?",
  "Show selfies or solo photos",
];

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([{
    role: "assistant",
    content: "Hi! I'm your memory assistant 🧠\n\nAsk me anything about your gallery — emotions, people, places, receipts, clothing, events. I understand intent and context, not just keywords.",
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [convId, setConvId]     = useState<string>();
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.listPhotos().then(p => setPhotoCount(p.length)).catch(() => {});
  }, []);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput(""); setShowSuggestions(false);
    const ts = new Date().toISOString();
    setMessages(m => [...m, { role: "user", content: message, timestamp: ts }]);
    setLoading(true);
    try {
      const resp = await api.chat(message, convId);
      setConvId(resp.conversation_id);
      let matched: Photo[] = [];
      if (resp.photo_ids.length > 0) {
        const all = await api.listPhotos();
        const byId = new Map(all.map(p => [p.id, p]));
        matched = resp.photo_ids.map(id => byId.get(id)).filter(Boolean) as Photo[];
      }
      setMessages(m => [...m, { role: "assistant", content: resp.reply, photos: matched, timestamp: new Date().toISOString() }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: `Sorry, I hit a snag: ${e?.message || "unknown error"}. Please try again.` }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  };

  const clearConversation = () => {
    Alert.alert("Clear conversation?", "This will start a fresh chat.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive",
        onPress: async () => {
          if (convId) { try { await api.deleteConv(convId); } catch {} }
          setConvId(undefined);
          setMessages([{ role: "assistant", content: "Fresh start! Ask me anything about your memories.", timestamp: new Date().toISOString() }]);
          setShowSuggestions(true);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="chat-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory Chat</Text>
          <Text style={styles.sub}>{photoCount === null ? "…" : `${photoCount} memories in context`}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {messages.length > 1 && (
            <TouchableOpacity style={styles.iconBtn} onPress={clearConversation}>
              <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          <LinearGradient colors={[theme.primarySoft, theme.primary]} style={styles.avatar} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
            <Ionicons name="sparkles" size={16} color="#1a0a0a" />
          </LinearGradient>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} onPhoto={id => router.push(`/photo/${id}`)} />
          ))}

          {loading && (
            <View style={[styles.bubble, styles.bubbleAI, { flexDirection: "row", gap: 10, alignItems: "center" }]}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={styles.bubbleText}>Searching through your memories…</Text>
            </View>
          )}

          {showSuggestions && messages.length <= 1 && (
            <View style={styles.suggestWrap}>
              <Text style={styles.suggestTitle}>Try asking:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)} activeOpacity={0.8} testID={`suggestion-${s.slice(0,10)}`}>
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 150 }} />
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={17} color={theme.textMuted} />
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything about your life…"
              placeholderTextColor={theme.textDim}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              editable={!loading}
              multiline
              testID="chat-input"
            />
            <TouchableOpacity
              onPress={() => send()}
              disabled={loading || !input.trim()}
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              testID="chat-send" activeOpacity={0.85}
            >
              <LinearGradient colors={[theme.primarySoft, theme.primary]} style={styles.sendGrad}>
                <Ionicons name="arrow-up" size={18} color="#1a0a0a" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ msg, onPhoto }: { msg: Msg; onPhoto: (id: string) => void }) {
  const isUser = msg.role === "user";
  const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      {!isUser && (
        <LinearGradient colors={[theme.primarySoft, theme.primary]} style={styles.botAvatar} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
          <Ionicons name="sparkles" size={10} color="#1a0a0a" />
        </LinearGradient>
      )}
      <View style={{ maxWidth: "84%" }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && { color: theme.text }]}>{msg.content}</Text>
          {msg.photos && msg.photos.length > 0 && (
            <View style={styles.photoGrid}>
              {msg.photos.slice(0, 6).map(p => (
                <TouchableOpacity key={p.id} style={styles.photoItem} onPress={() => onPhoto(p.id)} activeOpacity={0.85} testID={`chat-photo-${p.id}`}>
                  <Image source={{ uri: photoUri(p) }} style={{ width: "100%", height: "100%" }} />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.photoItemOverlay}>
                    <Text style={styles.photoItemEmotion}>{p.analysis?.emotion?.slice(0,3) || "—"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <Text style={[styles.timestamp, { textAlign: isUser ? "right" : "left" }]}>{ts}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: theme.bg },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  title:           { color: theme.text, fontSize: 22, fontWeight: "600", letterSpacing: -0.4 },
  sub:             { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  iconBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  avatar:          { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  botAvatar:       { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4, marginRight: 6 },
  scroll:          { padding: spacing.md, gap: spacing.sm },
  bubbleRow:       { flexDirection: "row", marginBottom: 14, alignItems: "flex-start" },
  bubble:          { padding: 14, borderRadius: 22 },
  bubbleAI:        { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: theme.border, borderTopLeftRadius: 6 },
  bubbleUser:      { backgroundColor: "rgba(255,140,148,0.12)", borderWidth: 1, borderColor: "rgba(255,140,148,0.3)", borderTopRightRadius: 6 },
  bubbleText:      { color: theme.text, fontSize: 15, lineHeight: 21 },
  timestamp:       { color: theme.textDim, fontSize: 10, marginTop: 4, paddingHorizontal: 4 },
  photoGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  photoItem:       { width: 78, height: 78, borderRadius: radii.sm, overflow: "hidden", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  photoItemOverlay:{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 4, justifyContent: "flex-end" },
  photoItemEmotion:{ color: theme.text, fontSize: 9, textTransform: "capitalize" },
  suggestWrap:     { gap: 10, marginTop: spacing.md },
  suggestTitle:    { color: theme.textMuted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: "600" },
  chip:            { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  chipText:        { color: theme.text, fontSize: 13, fontWeight: "500" },
  inputBar:        { position: "absolute", left: 0, right: 0, bottom: Platform.OS === "ios" ? 94 : 82, paddingHorizontal: spacing.md },
  inputWrap:       { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: "rgba(18,18,18,0.95)", borderWidth: 1, borderColor: theme.border },
  input:           { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 10, maxHeight: 100 },
  sendBtn:         { borderRadius: 999, overflow: "hidden" },
  sendGrad:        { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
});
