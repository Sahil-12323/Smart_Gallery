/**
 * AI Gallery v2.0 — Supabase Edition
 * API client — photos now served via Supabase Storage URLs, not base64
 */

// ── Network config ────────────────────────────────────────────
// Falls back to localhost for dev. On a physical device, set your
// machine's LAN IP: EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8000
const RAW_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";
const BASE = RAW_BASE.replace(/\/$/, "");

const DEFAULT_TIMEOUT_MS = 15000;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
  } catch (e: any) {
    if (e.name === "AbortError") {
      throw new Error("Request timed out. Check your backend URL in settings.");
    }
    if (e.message?.includes("Network request failed")) {
      throw new Error(
        `Cannot reach backend at ${BASE}.\n\nMake sure:\n• Backend is running\n• EXPO_PUBLIC_BACKEND_URL is set\n• On a physical device, use your LAN IP (not localhost)`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export type PhotoAnalysis = {
  description:      string;
  people:           string[];
  people_count:     number;
  emotion:          string;
  emotion_score:    number;
  objects:          string[];
  clothing:         string[];
  colors:           string[];
  scene:            string;
  ocr_text:         string;
  tags:             string[];
  event_type:       string;
  face_descriptors: string[];
};

export type Photo = {
  id:               string;
  url:              string;
  thumbnail_base64: string;
  mime_type:        string;
  taken_at:         string;
  location?:        string | null;
  created_at:       string;
  analysis:         PhotoAnalysis;
  is_favorite:      boolean;
  source?:          "local" | "google_photos";  // track origin
};

export type Insight = { title: string; body: string; icon: string; emotion: string };

export type Story = {
  id: string; title: string; subtitle: string;
  cover_url: string; cover_base64: string; mime_type: string;
  date_range: string; photo_count: number; photo_ids: string[];
  dominant_emotion: string; mood_score: number; photos?: Photo[];
};

export type Stats = {
  total: number; favorites: number; oldest: string | null; newest: string | null;
  event_distribution: Record<string, number>; emotion_distribution: Record<string, number>;
};

export type EmotionTimeline = {
  timeline: { week: string; avg_score: number; count: number }[];
  distribution: Record<string, number>;
};

export type PeopleGroup = {
  descriptor: string; photo_count: number; photo_ids: string[];
  cover_url: string; cover_mime: string;
};

// Google Photos types
export type GooglePhoto = {
  id:          string;
  baseUrl:     string;
  filename:    string;
  mimeType:    string;
  mediaMetadata: { creationTime: string; width: string; height: string };
  productUrl:  string;
};

export type GoogleAlbum = {
  id: string; title: string; mediaItemsCount: string; coverPhotoBaseUrl: string;
};

export const api = {
  listPhotos:   () => req<Photo[]>("/photos"),
  getPhoto:     (id: string) => req<Photo>(`/photos/${id}`),
  uploadPhoto:  (image_base64: string, mime_type: string, taken_at?: string, location?: string) =>
    req<Photo>("/photos", { method: "POST", body: JSON.stringify({ image_base64, mime_type, taken_at, location }) }),
  deletePhoto:  (id: string) => req<{ deleted: string }>(`/photos/${id}`, { method: "DELETE" }),
  toggleFav:    (id: string) => req<{ is_favorite: boolean }>(`/photos/${id}/favorite`, { method: "PATCH" }),

  chat:         (message: string, conversation_id?: string) =>
    req<{ conversation_id: string; reply: string; photo_ids: string[] }>("/chat", {
      method: "POST", body: JSON.stringify({ message, conversation_id }),
    }),
  getConv:      (id: string) => req<{ id: string; messages: any[] }>(`/chat/${id}`),
  deleteConv:   (id: string) => req<{ deleted: string }>(`/chat/${id}`, { method: "DELETE" }),

  insights:     (refresh = false) =>
    req<{ insights: Insight[]; generated_at: string; photo_count?: number }>(
      `/insights${refresh ? "?refresh=true" : ""}`
    ),
  onThisDay:    () =>
    req<{ date: string; photos: Photo[]; prediction: string | null; month_count: number }>("/memories/on-this-day"),
  stories:      () => req<{ stories: Story[] }>("/stories"),
  narrateStory: (story_id: string, photo_ids: string[]) =>
    req<{ narration: string }>("/stories/narrate", {
      method: "POST", body: JSON.stringify({ story_id, photo_ids }),
    }),
  search:       (query: string) =>
    req<{ results: Photo[] }>("/search", { method: "POST", body: JSON.stringify({ query }) }),
  favorites:    () => req<Photo[]>("/favorites"),
  stats:        () => req<Stats>("/stats"),
  emotionTimeline: (days = 90) => req<EmotionTimeline>(`/emotions/timeline?days=${days}`),
  people:       () => req<{ groups: PeopleGroup[] }>("/people"),

  getSettings:    () => req<Record<string, any>>("/settings"),
  updateSettings: (s: Record<string, any>) =>
    req<Record<string, any>>("/settings", { method: "PUT", body: JSON.stringify(s) }),

  // Google Photos — import a photo URL into AI Gallery
  importGooglePhoto: (baseUrl: string, filename: string, mimeType: string, creationTime: string) =>
    req<Photo>("/photos/import-url", {
      method: "POST",
      body: JSON.stringify({ url: baseUrl + "=d", filename, mime_type: mimeType, taken_at: creationTime }),
    }),

  seed:  () => req<{ inserted: number }>("/seed", { method: "POST" }),
  reset: () => req<{ ok: boolean }>("/reset", { method: "DELETE" }),

  // Health check
  ping: () => req<{ status: string }>("/"),
};

export function photoUri(p: { url?: string; thumbnail_base64?: string; mime_type?: string }): string {
  if (p.url) return p.url;
  if (p.thumbnail_base64) return `data:${p.mime_type || "image/jpeg"};base64,${p.thumbnail_base64}`;
  return "";
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso.slice(0, 10); }
}

export function relativeTime(iso: string): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7)   return `${d} days ago`;
    if (d < 30)  return `${Math.floor(d / 7)} weeks ago`;
    if (d < 365) return `${Math.floor(d / 30)} months ago`;
    return `${Math.floor(d / 365)} years ago`;
  } catch { return iso.slice(0, 10); }
}

export function emotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    happy: "😊", excited: "🎉", romantic: "💕", energetic: "⚡",
    calm: "🌊", neutral: "😐", nostalgic: "🌙", reflective: "💭",
    melancholic: "🌧", sad: "😔",
  };
  return map[emotion?.toLowerCase()] || "✨";
}

export const BACKEND_URL = BASE;
