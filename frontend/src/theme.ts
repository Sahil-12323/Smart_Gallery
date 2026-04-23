/**
 * AI Gallery v2.0 — Design tokens (Jewel & Luxury dark theme)
 */
export const theme = {
  bg:           "#050505",
  surface:      "#111111",
  surfaceAlt:   "#1A1A1A",
  surfaceGlass: "rgba(16,16,16,0.8)",
  border:       "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.18)",
  primary:      "#FF8C94",
  primarySoft:  "#FFC8A2",
  primaryDeep:  "#E06070",
  secondary:    "#8A9AFF",
  secondarySoft:"#B4BCFF",
  text:         "#F5F5F7",
  textMuted:    "#8A8A8E",
  textDim:      "#5A5A5E",
  success:      "#32D74B",
  warning:      "#FFD60A",
  error:        "#FF453A",
  accent:       "#FFC8A2",
  // Gradient sets
  gradPrimary:  ["#FFC8A2", "#FF8C94"] as const,
  gradSecondary:["#8A9AFF", "#6A7AFF"] as const,
  gradNeutral:  ["#2A2A2A", "#1A1A1A"] as const,
  gradGold:     ["#FFD700", "#FFA500"] as const,
};

export const radii   = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const EMOTION_COLORS: Record<string, [string, string]> = {
  happy:      ["#FFD700", "#FFA500"],
  excited:    ["#FF6B6B", "#FF4500"],
  romantic:   ["#FF8C94", "#FF4B6A"],
  energetic:  ["#00D2FF", "#0080FF"],
  calm:       ["#74B9FF", "#0984E3"],
  neutral:    ["#636E72", "#2D3436"],
  nostalgic:  ["#A29BFE", "#6C5CE7"],
  reflective: ["#8A9AFF", "#6A7AFF"],
  melancholic:["#74B9FF", "#0984E3"],
  sad:        ["#636E72", "#2D3436"],
};

export function emotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    happy: "😊", excited: "🎉", romantic: "💕", energetic: "⚡",
    calm: "🌊", neutral: "😐", nostalgic: "🌙", reflective: "💭",
    melancholic: "🌧", sad: "😔",
  };
  return map[emotion?.toLowerCase()] || "✨";
}
