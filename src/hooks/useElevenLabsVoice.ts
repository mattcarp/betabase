"use client";

import { useState, useCallback, useRef } from "react";

interface VoiceConfig {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

interface UseElevenLabsVoiceOptions {
  apiKey?: string;
  voiceConfig?: VoiceConfig;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      // Use env var directly to avoid importing config/apiKeys.ts in client
      const apiKey = options.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

      if (!apiKey) {
        options.onError?.(new Error("ElevenLabs API key not found"));
        return;
      }

      try {
        setIsLoading(true);
        options.onStart?.();

        // Default voice configuration
        const voiceConfig: VoiceConfig = {
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice as default
          modelId: "eleven_multilingual_v2",
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0,
          useSpeakerBoost: true,
          ...options.voiceConfig,
        };

        // Make direct API call to ElevenLabs
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
            },
            body: JSON.stringify({
              text,
              model_id: voiceConfig.modelId,
              voice_settings: {
                stability: voiceConfig.stability,
                similarity_boost: voiceConfig.similarityBoost,
                style: voiceConfig.style,
                use_speaker_boost: voiceConfig.useSpeakerBoost,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`);
        }

        // Get audio blob from response
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play audio
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }

        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          options.onEnd?.();
          URL.revokeObjectURL(audioUrl);
        };

        audioRef.current.onerror = (e) => {
          setIsPlaying(false);
          setIsLoading(false);
          options.onError?.(new Error("Audio playback failed"));
        };

        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        options.onError?.(error as Error);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      options.onEnd?.();
    }
  }, [options]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isLoading,
  };
}
