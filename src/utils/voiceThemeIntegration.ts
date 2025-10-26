/**
 * Voice Theme Integration
 * Helper utilities for voice-controlled theme switching with ElevenLabs
 */

import type { ThemeName } from "../contexts/ThemeContext";

/**
 * Theme keywords for voice recognition
 */
const THEME_KEYWORDS: Record<ThemeName, string[]> = {
  mac: [
    "mac",
    "mac design",
    "default",
    "default theme",
    "professional",
    "blue theme",
    "purple theme",
  ],
  jarvis: [
    "jarvis",
    "jarvis theme",
    "hud",
    "iron man",
    "jarvis hud",
    "cyan theme",
    "glass",
    "glassmorphic",
  ],
  aoma: [
    "aoma",
    "aoma theme",
    "sony",
    "corporate",
    "orange theme",
    "navy theme",
    "aoma three",
    "aoma 3",
  ],
};

/**
 * Detect theme from voice input
 * @param voiceText - Transcribed voice text
 * @returns Detected theme name or null
 */
export function detectThemeFromVoiceInput(voiceText: string): ThemeName | null {
  const normalizedText = voiceText.toLowerCase().trim();

  // Check for explicit "switch to [theme]" or "change theme to [theme]" patterns
  const switchPatterns = [
    /(?:switch|change|set).*?(?:theme|to)\s+(\w+)/i,
    /(?:use|apply|activate)\s+(?:the\s+)?(\w+)\s+theme/i,
  ];

  for (const pattern of switchPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const themeName = match[1].toLowerCase();
      // Check if the extracted word matches any theme keywords
      for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
        if (keywords.some((keyword) => keyword === themeName)) {
          return theme as ThemeName;
        }
      }
    }
  }

  // Fallback: Check if any theme keyword is mentioned
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedText.includes(keyword))) {
      return theme as ThemeName;
    }
  }

  return null;
}

/**
 * Trigger theme change via custom event
 * This can be called from ElevenLabs voice callback
 */
export function triggerVoiceThemeChange(theme: ThemeName): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("voice-theme-change", {
        detail: { theme },
      })
    );
  }
}

/**
 * Voice command patterns for theme switching
 */
export const VOICE_THEME_COMMANDS = [
  "switch to [theme] theme",
  "change theme to [theme]",
  "use [theme] theme",
  "activate [theme] theme",
  "apply [theme] theme",
  "set theme to [theme]",
];

/**
 * Get voice confirmation message for theme switch
 */
export function getThemeConfirmationMessage(theme: ThemeName): string {
  const messages: Record<ThemeName, string> = {
    mac: "Switching to MAC Design System theme",
    jarvis: "Activating JARVIS HUD interface",
    aoma: "Applying AOMA corporate theme",
  };

  return messages[theme] || `Switching to ${theme} theme`;
}

/**
 * Process voice transcription for theme commands
 * @param transcription - Voice transcription from ElevenLabs
 * @returns Object with detected theme and confidence
 */
export function processVoiceThemeCommand(transcription: string): {
  theme: ThemeName | null;
  confidence: "high" | "medium" | "low";
  message: string;
} {
  const detectedTheme = detectThemeFromVoiceInput(transcription);

  if (!detectedTheme) {
    return {
      theme: null,
      confidence: "low",
      message: "No theme detected in voice command",
    };
  }

  // Determine confidence based on explicitness
  const hasExplicitCommand = /(?:switch|change|set|use|apply|activate)/i.test(
    transcription
  );

  const confidence = hasExplicitCommand ? "high" : "medium";

  return {
    theme: detectedTheme,
    confidence,
    message: getThemeConfirmationMessage(detectedTheme),
  };
}

/**
 * Example integration with ElevenLabs callback
 *
 * Usage in your ElevenLabs component:
 *
 * ```typescript
 * import { processVoiceThemeCommand, triggerVoiceThemeChange } from '@/utils/voiceThemeIntegration';
 *
 * function handleVoiceInput(transcription: string) {
 *   const result = processVoiceThemeCommand(transcription);
 *
 *   if (result.theme && result.confidence === 'high') {
 *     // Speak confirmation
 *     elevenLabs.speak(result.message);
 *
 *     // Trigger theme change
 *     triggerVoiceThemeChange(result.theme);
 *   }
 * }
 * ```
 */
