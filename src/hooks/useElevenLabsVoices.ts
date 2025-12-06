"use client";

import { useState, useEffect, useCallback } from "react";

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url?: string;
  available_for_tiers?: string[];
  high_quality_base_model_ids?: string[];
}

interface UseElevenLabsVoicesOptions {
  apiKey?: string;
  onError?: (error: Error) => void;
}

export function useElevenLabsVoices(options: UseElevenLabsVoicesOptions = {}) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("21m00Tcm4TlvDq8ikWAM"); // Rachel as default
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    // Use env var directly to avoid importing config/apiKeys.ts in client
    const apiKey = options.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.warn("ElevenLabs API key not found - using default voice selection");
      // Fallback to common voices if no API key
      setVoices([
        {
          voice_id: "21m00Tcm4TlvDq8ikWAM",
          name: "Rachel",
          description: "Calm, professional female voice",
          category: "premade",
          labels: {
            gender: "female",
            accent: "american",
            age: "young_adult",
            use_case: "conversation",
          },
        },
        {
          voice_id: "AZnzlk1XvdvUeBnXmlld",
          name: "Domi",
          description: "Strong, confident female voice",
          category: "premade",
          labels: {
            gender: "female",
            accent: "american",
            age: "young_adult",
            use_case: "conversation",
          },
        },
        {
          voice_id: "EXAVITQu4vr4xnSDxMaL",
          name: "Bella",
          description: "Friendly, warm female voice",
          category: "premade",
          labels: {
            gender: "female",
            accent: "american",
            age: "young_adult",
            use_case: "conversation",
          },
        },
        {
          voice_id: "ErXwobaYiN019PkySvjV",
          name: "Antoni",
          description: "Well-rounded male voice",
          category: "premade",
          labels: {
            gender: "male",
            accent: "american",
            age: "young_adult",
            use_case: "conversation",
          },
        },
        {
          voice_id: "VR6AewLTigWG4xSOukaG",
          name: "Arnold",
          description: "Crisp, clear male voice",
          category: "premade",
          labels: {
            gender: "male",
            accent: "american",
            age: "middle_aged",
            use_case: "conversation",
          },
        },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      setVoices(data.voices || []);
    } catch (error) {
      console.error("Failed to fetch ElevenLabs voices:", error);
      options.onError?.(error as Error);

      // Fallback to default voices on error
      setVoices([
        {
          voice_id: "21m00Tcm4TlvDq8ikWAM",
          name: "Rachel",
          description: "Calm, professional female voice",
          category: "premade",
          labels: {
            gender: "female",
            accent: "american",
            age: "young_adult",
            use_case: "conversation",
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.apiKey]);

  // Fetch voices on mount
  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const playPreview = useCallback(
    async (voiceId: string) => {
      // Use env var directly
      const apiKey = options.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

      if (!apiKey) {
        console.warn("Cannot preview voice without API key");
        return;
      }

      // Stop any currently playing preview
      if (previewAudio) {
        previewAudio.pause();
        setIsPreviewPlaying(null);
      }

      try {
        setIsPreviewPlaying(voiceId);

        // Generate a short preview
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: "Hello! This is how I sound. I'm ready to help you with your conversations.",
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0,
              use_speaker_boost: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Preview generation failed: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsPreviewPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsPreviewPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };

        setPreviewAudio(audio);
        await audio.play();
      } catch (error) {
        console.error("Failed to play voice preview:", error);
        setIsPreviewPlaying(null);
        options.onError?.(error as Error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewAudio, options.apiKey]
  );

  const stopPreview = useCallback(() => {
    if (previewAudio) {
      previewAudio.pause();
      setIsPreviewPlaying(null);
    }
  }, [previewAudio]);

  const selectVoice = useCallback((voiceId: string) => {
    setSelectedVoiceId(voiceId);
  }, []);

  const getSelectedVoice = useCallback(() => {
    return voices.find((voice) => voice.voice_id === selectedVoiceId) || voices[0];
  }, [voices, selectedVoiceId]);

  return {
    voices,
    isLoading,
    selectedVoiceId,
    selectVoice,
    getSelectedVoice,
    playPreview,
    stopPreview,
    isPreviewPlaying,
    refetchVoices: fetchVoices,
  };
}
